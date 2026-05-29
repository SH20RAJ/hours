/**
 * Hours sync API — a Cloudflare Worker backed by D1.
 *
 * Auth: every request must carry `Authorization: Bearer <stack access token>`.
 * The token is an ES256 JWT verified locally against Stack Auth's JWKS endpoint
 * (no round-trip to Stack per request). The verified `sub` claim is the user id
 * that scopes every row.
 *
 * Sync model: last-write-wins by `updatedAt`. The client POSTs its full local
 * state; we upsert each row only when the incoming `updatedAt` is newer, then
 * return the merged server state so the client can reconcile. Deletions do not
 * propagate in this version (no tombstones) — see README/limitations.
 */
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export interface Env {
  DB: D1Database;
  STACK_PROJECT_ID: string;
  /** Optional override; defaults to Stack Auth's public API base. */
  STACK_API_URL?: string;
  /** Allowed CORS origin (e.g. https://hours.shraj.workers.dev). "*" in dev. */
  ALLOWED_ORIGIN?: string;
}

// ---------------------------------------------------------------------------
// JWKS (cached across requests within an isolate)
// ---------------------------------------------------------------------------

let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksCacheKey = "";

function getJwks(env: Env) {
  const base = env.STACK_API_URL || "https://api.stack-auth.com";
  const url = `${base}/api/v1/projects/${env.STACK_PROJECT_ID}/.well-known/jwks.json`;
  if (!jwksCache || jwksCacheKey !== url) {
    jwksCache = createRemoteJWKSet(new URL(url));
    jwksCacheKey = url;
  }
  return jwksCache;
}

async function verifyUser(request: Request, env: Env): Promise<string> {
  const header = request.headers.get("Authorization") ?? "";
  if (!header.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing bearer token");
  }
  const token = header.slice("Bearer ".length).trim();
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, getJwks(env)));
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
  if (!payload.sub) throw new HttpError(401, "Token has no subject");
  return payload.sub;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function corsHeaders(env: Env): HeadersInit {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data: unknown, status: number, env: Env): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env) },
  });
}

// ---------------------------------------------------------------------------
// Row mapping (camelCase API <-> snake_case columns)
// ---------------------------------------------------------------------------

const EPOCH = "1970-01-01T00:00:00.000Z";

interface SyncPayload {
  sessions?: any[];
  categories?: any[];
  goals?: any[];
  settings?: any | null;
}

async function handleSync(request: Request, env: Env, userId: string): Promise<Response> {
  let body: SyncPayload;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "Body must be valid JSON");
  }

  const statements: D1PreparedStatement[] = [];

  // Sessions — LWW upsert.
  for (const s of body.sessions ?? []) {
    if (!s?.id) continue;
    statements.push(
      env.DB.prepare(
        `INSERT INTO sessions
           (id, user_id, activity_name, category_id, start_time, end_time,
            duration_ms, notes, tags, source, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(user_id, id) DO UPDATE SET
           activity_name=excluded.activity_name, category_id=excluded.category_id,
           start_time=excluded.start_time, end_time=excluded.end_time,
           duration_ms=excluded.duration_ms, notes=excluded.notes,
           tags=excluded.tags, source=excluded.source, updated_at=excluded.updated_at
         WHERE excluded.updated_at > sessions.updated_at`,
      ).bind(
        s.id, userId, s.activityName ?? "", s.categoryId ?? "",
        s.startTime ?? EPOCH, s.endTime ?? EPOCH, Math.round(s.durationMs ?? 0),
        s.notes ?? null, JSON.stringify(s.tags ?? []), s.source ?? "timer",
        s.createdAt ?? EPOCH, s.updatedAt ?? s.createdAt ?? EPOCH,
      ),
    );
  }

  // Categories — LWW upsert.
  for (const c of body.categories ?? []) {
    if (!c?.id) continue;
    statements.push(
      env.DB.prepare(
        `INSERT INTO categories
           (id, user_id, name, identity, color, tone, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?)
         ON CONFLICT(user_id, id) DO UPDATE SET
           name=excluded.name, identity=excluded.identity, color=excluded.color,
           tone=excluded.tone, updated_at=excluded.updated_at
         WHERE excluded.updated_at > categories.updated_at`,
      ).bind(
        c.id, userId, c.name ?? "", c.identity ?? "", c.color ?? "gray",
        c.tone ?? "neutral", c.createdAt ?? EPOCH, c.updatedAt ?? c.createdAt ?? EPOCH,
      ),
    );
  }

  // Goals — LWW upsert (use created_at as the LWW key since goals lack updated_at
  // in the client model; we persist a server-side updated_at mirror).
  for (const g of body.goals ?? []) {
    if (!g?.id) continue;
    const stamp = g.updatedAt ?? g.createdAt ?? EPOCH;
    statements.push(
      env.DB.prepare(
        `INSERT INTO goals
           (id, user_id, title, type, period, target_value, category_id,
            identity, created_at, is_active, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(user_id, id) DO UPDATE SET
           title=excluded.title, type=excluded.type, period=excluded.period,
           target_value=excluded.target_value, category_id=excluded.category_id,
           identity=excluded.identity, is_active=excluded.is_active,
           updated_at=excluded.updated_at
         WHERE excluded.updated_at > goals.updated_at`,
      ).bind(
        g.id, userId, g.title ?? "", g.type ?? "total_hours", g.period ?? "weekly",
        Number(g.targetValue ?? 0), g.categoryId ?? null, g.identity ?? null,
        g.createdAt ?? EPOCH, g.isActive === false ? 0 : 1, stamp,
      ),
    );
  }

  // Settings — single row per user, LWW.
  if (body.settings) {
    const st = body.settings;
    statements.push(
      env.DB.prepare(
        `INSERT INTO settings
           (user_id, daily_target_hours, week_starts_on, desired_identities, theme, updated_at)
         VALUES (?,?,?,?,?,?)
         ON CONFLICT(user_id) DO UPDATE SET
           daily_target_hours=excluded.daily_target_hours,
           week_starts_on=excluded.week_starts_on,
           desired_identities=excluded.desired_identities,
           theme=excluded.theme, updated_at=excluded.updated_at
         WHERE excluded.updated_at > settings.updated_at`,
      ).bind(
        userId, Number(st.dailyTargetHours ?? 6), Number(st.weekStartsOn ?? 1),
        JSON.stringify(st.desiredIdentities ?? []), st.theme ?? "dark",
        st.updatedAt ?? new Date().toISOString(),
      ),
    );
  }

  if (statements.length > 0) {
    await env.DB.batch(statements);
  }

  // Read back the merged server truth for this user.
  const [sessions, categories, goals, settings] = await Promise.all([
    env.DB.prepare("SELECT * FROM sessions WHERE user_id = ?").bind(userId).all(),
    env.DB.prepare("SELECT * FROM categories WHERE user_id = ?").bind(userId).all(),
    env.DB.prepare("SELECT * FROM goals WHERE user_id = ?").bind(userId).all(),
    env.DB.prepare("SELECT * FROM settings WHERE user_id = ?").bind(userId).first(),
  ]);

  return json(
    {
      syncedAt: new Date().toISOString(),
      state: {
        sessions: (sessions.results as any[]).map(rowToSession),
        categories: (categories.results as any[]).map(rowToCategory),
        goals: (goals.results as any[]).map(rowToGoal),
        settings: settings ? rowToSettings(settings as any) : null,
      },
    },
    200,
    env,
  );
}

function rowToSession(r: any) {
  return {
    id: r.id,
    activityName: r.activity_name,
    categoryId: r.category_id,
    startTime: r.start_time,
    endTime: r.end_time,
    durationMs: r.duration_ms,
    notes: r.notes ?? undefined,
    tags: safeJson(r.tags, []),
    source: r.source,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToCategory(r: any) {
  return {
    id: r.id,
    name: r.name,
    identity: r.identity,
    color: r.color,
    tone: r.tone,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToGoal(r: any) {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    period: r.period,
    targetValue: r.target_value,
    categoryId: r.category_id ?? undefined,
    identity: r.identity ?? undefined,
    createdAt: r.created_at,
    isActive: r.is_active === 1,
    updatedAt: r.updated_at,
  };
}

function rowToSettings(r: any) {
  return {
    dailyTargetHours: r.daily_target_hours,
    weekStartsOn: r.week_starts_on,
    desiredIdentities: safeJson(r.desired_identities, []),
    theme: r.theme,
    updatedAt: r.updated_at,
  };
}

function safeJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/health") {
        return json({ ok: true, service: "hours-api" }, 200, env);
      }

      if (url.pathname === "/api/sync" && request.method === "POST") {
        if (!env.STACK_PROJECT_ID) {
          throw new HttpError(500, "Server missing STACK_PROJECT_ID");
        }
        const userId = await verifyUser(request, env);
        return await handleSync(request, env, userId);
      }

      return json({ error: "Not found" }, 404, env);
    } catch (err) {
      if (err instanceof HttpError) {
        return json({ error: err.message }, err.status, env);
      }
      return json({ error: "Internal error" }, 500, env);
    }
  },
};
