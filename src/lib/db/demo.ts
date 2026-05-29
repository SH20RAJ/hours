import type { Category, TimeSession } from "@/lib/types";
import { nowIso, uid } from "@/lib/utils";

interface DemoTemplate {
  categoryName: string;
  activities: string[];
  notes: string[];
  tags: string[];
  /** Probability the category appears on a given day. */
  frequency: number;
  /** Typical session length range in minutes. */
  minMinutes: number;
  maxMinutes: number;
  /** How many sessions per day when it does appear. */
  maxSessionsPerDay: number;
}

const TEMPLATES: DemoTemplate[] = [
  {
    categoryName: "Coding",
    activities: ["Feature work", "Bug fixing", "Refactor", "Code review"],
    notes: ["Shipped the timer module", "Cleaned up the data layer", "Paired on auth"],
    tags: ["focus", "work"],
    frequency: 0.85,
    minMinutes: 45,
    maxMinutes: 180,
    maxSessionsPerDay: 3,
  },
  {
    categoryName: "Startup",
    activities: ["Customer calls", "Roadmap", "Investor update", "Landing page"],
    notes: ["Talked to 3 users", "Drafted the pitch", "Reworked pricing"],
    tags: ["build"],
    frequency: 0.55,
    minMinutes: 30,
    maxMinutes: 120,
    maxSessionsPerDay: 2,
  },
  {
    categoryName: "Learning",
    activities: ["System design course", "Reading docs", "Tutorial"],
    notes: ["Distributed systems chapter", "Watched a deep-dive"],
    tags: ["study"],
    frequency: 0.6,
    minMinutes: 25,
    maxMinutes: 90,
    maxSessionsPerDay: 2,
  },
  {
    categoryName: "Fitness",
    activities: ["Gym", "Run", "Yoga"],
    notes: ["Push day", "5k easy pace", "Mobility"],
    tags: ["health"],
    frequency: 0.5,
    minMinutes: 30,
    maxMinutes: 75,
    maxSessionsPerDay: 1,
  },
  {
    categoryName: "Reading",
    activities: ["Book", "Long-form article"],
    notes: ["A few chapters", "Essay on focus"],
    tags: ["growth"],
    frequency: 0.45,
    minMinutes: 20,
    maxMinutes: 60,
    maxSessionsPerDay: 1,
  },
  {
    categoryName: "Content",
    activities: ["Writing", "Video edit", "Thread"],
    notes: ["Drafted a post", "Edited the demo clip"],
    tags: ["create"],
    frequency: 0.35,
    minMinutes: 30,
    maxMinutes: 90,
    maxSessionsPerDay: 1,
  },
  {
    categoryName: "Deep Work",
    activities: ["Architecture", "Hard problem", "Writing spec"],
    notes: ["No distractions block", "Cracked the sync design"],
    tags: ["focus"],
    frequency: 0.4,
    minMinutes: 60,
    maxMinutes: 150,
    maxSessionsPerDay: 1,
  },
  {
    categoryName: "Social Media",
    activities: ["Scrolling", "X", "Instagram"],
    notes: ["Fell into a rabbit hole", "Quick check turned long"],
    tags: ["waste"],
    frequency: 0.7,
    minMinutes: 15,
    maxMinutes: 75,
    maxSessionsPerDay: 2,
  },
  {
    categoryName: "Entertainment",
    activities: ["Show", "Gaming", "Movie"],
    notes: ["Evening wind down", "One more episode"],
    tags: ["relax"],
    frequency: 0.5,
    minMinutes: 30,
    maxMinutes: 120,
    maxSessionsPerDay: 1,
  },
  {
    categoryName: "Sleep",
    activities: ["Night sleep", "Nap"],
    notes: ["Solid rest", "Short recharge"],
    tags: ["recovery"],
    frequency: 0.3,
    minMinutes: 30,
    maxMinutes: 90,
    maxSessionsPerDay: 1,
  },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Build ~14 days of believable sessions across the provided categories.
 * Sessions are spread through plausible hours of the day and never overlap
 * midnight, so day-grouped views stay clean.
 */
export function generateDemoSessions(categories: Category[]): TimeSession[] {
  const byName = new Map(categories.map((c) => [c.name, c]));
  const sessions: TimeSession[] = [];
  const now = new Date();

  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const day = new Date(now);
    day.setDate(now.getDate() - dayOffset);

    for (const template of TEMPLATES) {
      const category = byName.get(template.categoryName);
      if (!category) continue;
      if (Math.random() > template.frequency) continue;

      const sessionCount = 1 + Math.floor(Math.random() * template.maxSessionsPerDay);
      let cursorHour = 7 + Math.random() * 2; // start the day around 7-9am

      for (let s = 0; s < sessionCount; s++) {
        const durationMin = randBetween(template.minMinutes, template.maxMinutes);
        cursorHour += Math.random() * 2.5; // gap between activities
        if (cursorHour > 23) break;

        const start = new Date(day);
        const startHour = Math.floor(cursorHour);
        const startMin = Math.floor((cursorHour - startHour) * 60);
        start.setHours(startHour, startMin, 0, 0);

        const durationMs = durationMin * 60 * 1000;
        const end = new Date(start.getTime() + durationMs);
        // Keep within the same day.
        if (end.getDate() !== start.getDate()) break;

        const ts = nowIso();
        sessions.push({
          id: uid(),
          activityName: pick(template.activities),
          categoryId: category.id,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          durationMs,
          notes: Math.random() > 0.4 ? pick(template.notes) : undefined,
          tags: Math.random() > 0.5 ? [pick(template.tags)] : [],
          source: "timer",
          createdAt: ts,
          updatedAt: ts,
        });

        cursorHour += durationMin / 60;
      }
    }
  }

  return sessions;
}
