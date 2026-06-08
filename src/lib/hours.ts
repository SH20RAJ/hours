export type GoalType = "daily-minutes" | "weekly-minutes" | "weekly-sessions";
export type PomodoroPreset = "none" | "25-5" | "50-10";
export type SessionSource = "timer" | "manual";

export type SkillGoal = {
	type: GoalType;
	value: number;
};

export type Skill = {
	id: string;
	name: string;
	color: string;
	goal: SkillGoal;
	pomodoro: PomodoroPreset;
	createdAt: string;
	archivedAt?: string;
};

export type Session = {
	id: string;
	skillId: string;
	startedAt: string;
	endedAt: string;
	source: SessionSource;
	note?: string;
};

export type ActiveSession = {
	id: string;
	skillId: string;
	startedAt: string;
};

export type HoursSnapshot = {
	version: 1;
	exportedAt: string;
	skills: Skill[];
	sessions: Session[];
	activeSession?: ActiveSession | null;
};

export type DaySlice = {
	dayKey: string;
	skillId: string;
	sessionId: string;
	durationMs: number;
	startedAt: string;
	endedAt: string;
	source: SessionSource;
	note?: string;
};

export type GoalProgress =
	| {
			kind: "duration";
			completedMs: number;
			targetMs: number;
			remainingMs: number;
			percent: number;
	  }
	| {
			kind: "sessions";
			completedSessions: number;
			targetSessions: number;
			remainingSessions: number;
			percent: number;
	  };

export type PomodoroPhase =
	| {
			enabled: false;
	  }
	| {
			enabled: true;
			phase: "work" | "break";
			label: string;
			elapsedInPhaseMs: number;
			remainingInPhaseMs: number;
			cycleIndex: number;
	  };

export const GOAL_LABELS: Record<GoalType, string> = {
	"daily-minutes": "Hours per day",
	"weekly-minutes": "Hours per week",
	"weekly-sessions": "Sessions per week",
};

export const POMODORO_LABELS: Record<PomodoroPreset, string> = {
	none: "Off",
	"25-5": "25 / 5",
	"50-10": "50 / 10",
};

export const SKILL_COLORS = ["#ef8f45", "#6d8cff", "#52b788", "#c084fc", "#f06292", "#2bb3a3", "#e6b422", "#7c9a75"];

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const pad2 = (value: number) => String(value).padStart(2, "0");

export function createId(prefix: string): string {
	return `${prefix}_${crypto.randomUUID()}`;
}

export function getDayKey(date = new Date()): string {
	return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function startOfLocalDay(dayKeyOrDate: string | Date): Date {
	if (typeof dayKeyOrDate === "string") {
		const [year, month, day] = dayKeyOrDate.split("-").map(Number);
		return new Date(year, month - 1, day);
	}
	return new Date(dayKeyOrDate.getFullYear(), dayKeyOrDate.getMonth(), dayKeyOrDate.getDate());
}

export function addDays(date: Date, days: number): Date {
	const next = new Date(date);
	next.setDate(next.getDate() + days);
	return next;
}

export function getWeekRange(date = new Date()): { start: Date; end: Date; key: string } {
	const dayStart = startOfLocalDay(date);
	const mondayOffset = (dayStart.getDay() + 6) % 7;
	const start = addDays(dayStart, -mondayOffset);
	const end = addDays(start, 7);
	return { start, end, key: getDayKey(start) };
}

export function clampPercent(value: number): number {
	if (!Number.isFinite(value)) {
		return 0;
	}
	return Math.max(0, Math.min(100, value));
}

export function getSessionDurationMs(session: Pick<Session, "startedAt" | "endedAt">): number {
	return Math.max(0, new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime());
}

export function activeToSession(active: ActiveSession, now = new Date()): Session {
	return {
		id: active.id,
		skillId: active.skillId,
		startedAt: active.startedAt,
		endedAt: now.toISOString(),
		source: "timer",
	};
}

export function splitSessionByDay(session: Session): DaySlice[] {
	const start = new Date(session.startedAt);
	const end = new Date(session.endedAt);

	if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
		return [];
	}

	const slices: DaySlice[] = [];
	let cursor = start;

	while (cursor < end) {
		const currentDay = startOfLocalDay(cursor);
		const nextDay = addDays(currentDay, 1);
		const sliceEnd = nextDay < end ? nextDay : end;
		const durationMs = Math.max(0, sliceEnd.getTime() - cursor.getTime());

		if (durationMs > 0) {
			slices.push({
				dayKey: getDayKey(currentDay),
				skillId: session.skillId,
				sessionId: session.id,
				durationMs,
				startedAt: cursor.toISOString(),
				endedAt: sliceEnd.toISOString(),
				source: session.source,
				note: session.note,
			});
		}

		cursor = sliceEnd;
	}

	return slices;
}

export function getDaySlices(sessions: Session[], dayKey: string): DaySlice[] {
	return sessions
		.flatMap(splitSessionByDay)
		.filter((slice) => slice.dayKey === dayKey)
		.sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
}

export function getTotalsBySkillForDay(sessions: Session[], dayKey: string): Map<string, number> {
	const totals = new Map<string, number>();
	for (const slice of getDaySlices(sessions, dayKey)) {
		totals.set(slice.skillId, (totals.get(slice.skillId) ?? 0) + slice.durationMs);
	}
	return totals;
}

export function getTotalForDay(sessions: Session[], dayKey: string): number {
	return [...getTotalsBySkillForDay(sessions, dayKey).values()].reduce((total, value) => total + value, 0);
}

export function getTotalForRange(sessions: Session[], start: Date, end: Date, skillId?: string): number {
	return sessions.reduce((total, session) => {
		if (skillId && session.skillId !== skillId) {
			return total;
		}

		const sessionStart = new Date(session.startedAt).getTime();
		const sessionEnd = new Date(session.endedAt).getTime();
		const rangeStart = start.getTime();
		const rangeEnd = end.getTime();
		const overlap = Math.max(0, Math.min(sessionEnd, rangeEnd) - Math.max(sessionStart, rangeStart));
		return total + overlap;
	}, 0);
}

export function countSessionsInRange(sessions: Session[], start: Date, end: Date, skillId: string): number {
	const rangeStart = start.getTime();
	const rangeEnd = end.getTime();

	return sessions.filter((session) => {
		if (session.skillId !== skillId) {
			return false;
		}
		const sessionStart = new Date(session.startedAt).getTime();
		const sessionEnd = new Date(session.endedAt).getTime();
		return sessionStart < rangeEnd && sessionEnd > rangeStart;
	}).length;
}

export function getGoalProgress(skill: Skill, sessions: Session[], date = new Date()): GoalProgress {
	if (skill.goal.type === "daily-minutes") {
		const dayKey = getDayKey(date);
		const completedMs = getTotalsBySkillForDay(sessions, dayKey).get(skill.id) ?? 0;
		const targetMs = Math.max(1, skill.goal.value) * MINUTE_MS;
		return {
			kind: "duration",
			completedMs,
			targetMs,
			remainingMs: Math.max(0, targetMs - completedMs),
			percent: clampPercent((completedMs / targetMs) * 100),
		};
	}

	const { start, end } = getWeekRange(date);

	if (skill.goal.type === "weekly-minutes") {
		const completedMs = getTotalForRange(sessions, start, end, skill.id);
		const targetMs = Math.max(1, skill.goal.value) * MINUTE_MS;
		return {
			kind: "duration",
			completedMs,
			targetMs,
			remainingMs: Math.max(0, targetMs - completedMs),
			percent: clampPercent((completedMs / targetMs) * 100),
		};
	}

	const completedSessions = countSessionsInRange(sessions, start, end, skill.id);
	const targetSessions = Math.max(1, Math.round(skill.goal.value));
	return {
		kind: "sessions",
		completedSessions,
		targetSessions,
		remainingSessions: Math.max(0, targetSessions - completedSessions),
		percent: clampPercent((completedSessions / targetSessions) * 100),
	};
}

export function formatDuration(ms: number): string {
	const totalMinutes = Math.max(0, Math.floor(ms / MINUTE_MS));
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (hours === 0) {
		return `${minutes}m`;
	}
	if (minutes === 0) {
		return `${hours}h`;
	}
	return `${hours}h ${pad2(minutes)}m`;
}

export function formatClock(ms: number): string {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

export function formatTime(iso: string): string {
	return new Intl.DateTimeFormat(undefined, {
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(iso));
}

export function parseManualEntry(dayKey: string, startTime: string, endTime: string): { startedAt: string; endedAt: string } {
	const startMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(startTime);
	const endMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(endTime);

	if (!startMatch || !endMatch) {
		throw new Error("Use HH:MM time for manual entries.");
	}

	const start = startOfLocalDay(dayKey);
	start.setHours(Number(startMatch[1]), Number(startMatch[2]), 0, 0);
	const end = startOfLocalDay(dayKey);
	end.setHours(Number(endMatch[1]), Number(endMatch[2]), 0, 0);

	if (end <= start) {
		throw new Error("End time must be after start time.");
	}

	return {
		startedAt: start.toISOString(),
		endedAt: end.toISOString(),
	};
}

export function getPomodoroPhase(skill: Skill, active: ActiveSession | null | undefined, now = new Date()): PomodoroPhase {
	if (!active || active.skillId !== skill.id || skill.pomodoro === "none") {
		return { enabled: false };
	}

	const [workMinutes, breakMinutes] = skill.pomodoro.split("-").map(Number);
	const workMs = workMinutes * MINUTE_MS;
	const breakMs = breakMinutes * MINUTE_MS;
	const cycleMs = workMs + breakMs;
	const elapsedMs = Math.max(0, now.getTime() - new Date(active.startedAt).getTime());
	const cycleElapsed = elapsedMs % cycleMs;
	const cycleIndex = Math.floor(elapsedMs / cycleMs) + 1;

	if (cycleElapsed < workMs) {
		return {
			enabled: true,
			phase: "work",
			label: `Focus ${workMinutes}m`,
			elapsedInPhaseMs: cycleElapsed,
			remainingInPhaseMs: workMs - cycleElapsed,
			cycleIndex,
		};
	}

	return {
		enabled: true,
		phase: "break",
		label: `Break ${breakMinutes}m`,
		elapsedInPhaseMs: cycleElapsed - workMs,
		remainingInPhaseMs: cycleMs - cycleElapsed,
		cycleIndex,
	};
}

export function normalizeSnapshot(value: unknown): HoursSnapshot {
	if (!value || typeof value !== "object") {
		throw new Error("Backup file is not a valid Hours export.");
	}

	const snapshot = value as Partial<HoursSnapshot>;

	if (!Array.isArray(snapshot.skills) || !Array.isArray(snapshot.sessions)) {
		throw new Error("Backup file is missing skills or sessions.");
	}

	const skills = snapshot.skills.filter(isSkill);
	const skillIds = new Set(skills.map((skill) => skill.id));
	const sessions = snapshot.sessions.filter((session) => isSession(session) && skillIds.has(session.skillId));
	const activeSession = snapshot.activeSession && isActiveSession(snapshot.activeSession) && skillIds.has(snapshot.activeSession.skillId) ? snapshot.activeSession : null;

	return {
		version: 1,
		exportedAt: typeof snapshot.exportedAt === "string" ? snapshot.exportedAt : new Date().toISOString(),
		skills,
		sessions,
		activeSession,
	};
}

function isSkill(value: unknown): value is Skill {
	const skill = value as Partial<Skill>;
	return Boolean(
		skill &&
			typeof skill.id === "string" &&
			typeof skill.name === "string" &&
			typeof skill.color === "string" &&
			skill.goal &&
			["daily-minutes", "weekly-minutes", "weekly-sessions"].includes(skill.goal.type) &&
			typeof skill.goal.value === "number" &&
			["none", "25-5", "50-10"].includes(skill.pomodoro ?? "none") &&
			typeof skill.createdAt === "string",
	);
}

function isSession(value: unknown): value is Session {
	const session = value as Partial<Session>;
	return Boolean(
		session &&
			typeof session.id === "string" &&
			typeof session.skillId === "string" &&
			typeof session.startedAt === "string" &&
			typeof session.endedAt === "string" &&
			["timer", "manual"].includes(session.source ?? "") &&
			getSessionDurationMs(session as Session) > 0,
	);
}

function isActiveSession(value: unknown): value is ActiveSession {
	const active = value as Partial<ActiveSession>;
	return Boolean(active && typeof active.id === "string" && typeof active.skillId === "string" && typeof active.startedAt === "string");
}
