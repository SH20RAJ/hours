import { describe, expect, it } from "vitest";
import {
	type Session,
	type Skill,
	formatClock,
	formatDuration,
	getDayKey,
	getGoalProgress,
	getWeekRange,
	normalizeSnapshot,
	parseManualEntry,
	splitSessionByDay,
} from "./hours";

const skill: Skill = {
	id: "skill_dsa",
	name: "DSA",
	color: "#ef8f45",
	goal: {
		type: "daily-minutes",
		value: 120,
	},
	pomodoro: "25-5",
	createdAt: new Date(2026, 0, 1).toISOString(),
};

const session = (startedAt: Date, endedAt: Date, overrides: Partial<Session> = {}): Session => ({
	id: overrides.id ?? `session_${startedAt.getTime()}`,
	skillId: overrides.skillId ?? skill.id,
	startedAt: startedAt.toISOString(),
	endedAt: endedAt.toISOString(),
	source: overrides.source ?? "timer",
	note: overrides.note,
});

describe("time helpers", () => {
	it("formats duration and active clocks", () => {
		expect(formatDuration(45 * 60 * 1000)).toBe("45m");
		expect(formatDuration(2 * 60 * 60 * 1000)).toBe("2h");
		expect(formatDuration(95 * 60 * 1000)).toBe("1h 35m");
		expect(formatClock(3_725_000)).toBe("01:02:05");
	});

	it("uses Monday as the start of local weeks", () => {
		const { start, end, key } = getWeekRange(new Date(2026, 5, 10, 12));

		expect(getDayKey(start)).toBe("2026-06-08");
		expect(getDayKey(end)).toBe("2026-06-15");
		expect(key).toBe("2026-06-08");
	});

	it("splits sessions across local midnight", () => {
		const slices = splitSessionByDay(session(new Date(2026, 5, 8, 23, 30), new Date(2026, 5, 9, 0, 45)));

		expect(slices).toHaveLength(2);
		expect(slices[0]).toMatchObject({ dayKey: "2026-06-08", durationMs: 30 * 60 * 1000 });
		expect(slices[1]).toMatchObject({ dayKey: "2026-06-09", durationMs: 45 * 60 * 1000 });
	});

	it("calculates daily duration goals", () => {
		const sessions = [
			session(new Date(2026, 5, 8, 9), new Date(2026, 5, 8, 10)),
			session(new Date(2026, 5, 8, 11), new Date(2026, 5, 8, 11, 30)),
		];
		const progress = getGoalProgress(skill, sessions, new Date(2026, 5, 8, 12));

		expect(progress.kind).toBe("duration");
		if (progress.kind === "duration") {
			expect(progress.completedMs).toBe(90 * 60 * 1000);
			expect(progress.targetMs).toBe(120 * 60 * 1000);
			expect(progress.percent).toBe(75);
		}
	});

	it("calculates weekly session goals", () => {
		const piano: Skill = {
			...skill,
			id: "skill_piano",
			goal: {
				type: "weekly-sessions",
				value: 3,
			},
		};
		const sessions = [
			session(new Date(2026, 5, 8, 9), new Date(2026, 5, 8, 10), { skillId: piano.id }),
			session(new Date(2026, 5, 10, 9), new Date(2026, 5, 10, 10), { skillId: piano.id }),
			session(new Date(2026, 5, 16, 9), new Date(2026, 5, 16, 10), { skillId: piano.id }),
		];
		const progress = getGoalProgress(piano, sessions, new Date(2026, 5, 10, 12));

		expect(progress.kind).toBe("sessions");
		if (progress.kind === "sessions") {
			expect(progress.completedSessions).toBe(2);
			expect(progress.targetSessions).toBe(3);
			expect(Math.round(progress.percent)).toBe(67);
		}
	});

	it("validates manual entries on the same day", () => {
		const parsed = parseManualEntry("2026-06-08", "19:00", "20:30");

		expect(new Date(parsed.endedAt).getTime() - new Date(parsed.startedAt).getTime()).toBe(90 * 60 * 1000);
		expect(() => parseManualEntry("2026-06-08", "20:00", "19:00")).toThrow("End time");
		expect(() => parseManualEntry("2026-06-08", "8pm", "19:00")).toThrow("HH:MM");
	});

	it("normalizes backups and drops orphaned sessions", () => {
		const goodSession = session(new Date(2026, 5, 8, 9), new Date(2026, 5, 8, 10));
		const orphanSession = { ...goodSession, id: "session_orphan", skillId: "missing" };
		const snapshot = normalizeSnapshot({
			skills: [skill],
			sessions: [goodSession, orphanSession],
			activeSession: {
				id: "active_1",
				skillId: skill.id,
				startedAt: new Date(2026, 5, 8, 11).toISOString(),
			},
		});

		expect(snapshot.version).toBe(1);
		expect(snapshot.sessions).toHaveLength(1);
		expect(snapshot.activeSession?.skillId).toBe(skill.id);
	});
});
