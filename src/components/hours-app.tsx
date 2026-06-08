"use client";

import {
	Archive,
	CalendarDays,
	Check,
	Clock3,
	Download,
	Heart,
	Home,
	Pencil,
	Play,
	Plus,
	RefreshCcw,
	Settings,
	Square,
	Target,
	TimerReset,
	Trash2,
	Upload,
} from "lucide-react";
import { type CSSProperties, type ChangeEvent, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
	GOAL_LABELS,
	POMODORO_LABELS,
	SKILL_COLORS,
	type ActiveSession,
	type GoalType,
	type PomodoroPreset,
	type Session,
	type Skill,
	activeToSession,
	addDays,
	createId,
	formatClock,
	formatDuration,
	formatTime,
	getDayKey,
	getDaySlices,
	getGoalProgress,
	getPomodoroPhase,
	getTotalForDay,
	getTotalsBySkillForDay,
	parseManualEntry,
	startOfLocalDay,
} from "@/lib/hours";
import {
	type HoursData,
	clearHoursData,
	exportHoursData,
	importHoursData,
	isIndexedDbAvailable,
	loadHoursData,
	saveSession,
	saveSkill,
	setActiveSession,
} from "@/lib/hours-db";

type Tab = "today" | "skills" | "calendar" | "settings";

type SkillFormState = {
	name: string;
	color: string;
	goalType: GoalType;
	goalValue: string;
	pomodoro: PomodoroPreset;
};

type ManualFormState = {
	skillId: string;
	dayKey: string;
	startTime: string;
	endTime: string;
	note: string;
};

const emptyData: HoursData = {
	skills: [],
	sessions: [],
	activeSession: null,
};

const defaultSkillForm = (color = SKILL_COLORS[0]): SkillFormState => ({
	name: "",
	color,
	goalType: "daily-minutes",
	goalValue: "120",
	pomodoro: "none",
});

const defaultManualForm = (dayKey: string, skillId = ""): ManualFormState => ({
	skillId,
	dayKey,
	startTime: "19:00",
	endTime: "20:00",
	note: "",
});

const PAYPAL_DONATION_URL = "https://www.paypal.com/paypalme/sh20raj";
const RAZORPAY_PAYMENT_URL = "https://razorpay.me/@iamsh";

export function HoursApp() {
	const [data, setData] = useState<HoursData>(emptyData);
	const [ready, setReady] = useState(false);
	const [storageError, setStorageError] = useState<string | null>(null);
	const [tab, setTab] = useState<Tab>("today");
	const [now, setNow] = useState(() => new Date());
	const [toast, setToast] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [selectedDay, setSelectedDay] = useState(() => getDayKey(new Date()));
	const [visibleMonth, setVisibleMonth] = useState(() => startOfLocalDay(new Date()));
	const [manualOpen, setManualOpen] = useState(false);
	const [manualForm, setManualForm] = useState<ManualFormState>(() => defaultManualForm(getDayKey(new Date())));
	const [skillForm, setSkillForm] = useState<SkillFormState>(() => defaultSkillForm());
	const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
	const importInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		let mounted = true;

		Promise.resolve()
			.then(() => {
				if (!isIndexedDbAvailable()) {
					throw new Error("This browser does not support IndexedDB, so Hours cannot save offline data here.");
				}
				return loadHoursData();
			})
			.then((loaded) => {
				if (mounted) {
					setData(loaded);
					setReady(true);
				}
			})
			.catch((error: unknown) => {
				if (mounted) {
					setStorageError(error instanceof Error ? error.message : "Could not load local Hours data.");
					setReady(true);
				}
			});

		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		const timer = window.setInterval(() => setNow(new Date()), 1000);
		return () => window.clearInterval(timer);
	}, []);

	useEffect(() => {
		if (!("serviceWorker" in navigator)) {
			return;
		}

		navigator.serviceWorker.register("/sw.js").catch(() => {
			setToast("Offline cache could not be registered.");
		});
	}, []);

	useEffect(() => {
		if (!toast) {
			return;
		}
		const timer = window.setTimeout(() => setToast(null), 3400);
		return () => window.clearTimeout(timer);
	}, [toast]);

	const activeSkills = useMemo(() => data.skills.filter((skill) => !skill.archivedAt), [data.skills]);
	const archivedSkills = useMemo(() => data.skills.filter((skill) => skill.archivedAt), [data.skills]);
	const activeSkill = data.activeSession ? data.skills.find((skill) => skill.id === data.activeSession?.skillId) : undefined;
	const sessionsWithActive = useMemo(() => {
		if (!data.activeSession) {
			return data.sessions;
		}
		return [...data.sessions, activeToSession(data.activeSession, now)];
	}, [data.activeSession, data.sessions, now]);
	const todayKey = getDayKey(now);
	const todayTotal = getTotalForDay(sessionsWithActive, todayKey);
	const todayTotals = getTotalsBySkillForDay(sessionsWithActive, todayKey);
	const selectedDaySlices = getDaySlices(sessionsWithActive, selectedDay);
	const selectedDayTotal = getTotalForDay(sessionsWithActive, selectedDay);

	function resetSkillForm() {
		setEditingSkillId(null);
		setSkillForm(defaultSkillForm(SKILL_COLORS[data.skills.length % SKILL_COLORS.length]));
	}

	async function handleSkillSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const name = skillForm.name.trim();
		const goalValue = Number(skillForm.goalValue);

		if (!name) {
			setToast("Name the skill first.");
			return;
		}
		if (!Number.isFinite(goalValue) || goalValue <= 0) {
			setToast("Goal value must be greater than zero.");
			return;
		}

		const existing = editingSkillId ? data.skills.find((skill) => skill.id === editingSkillId) : null;
		const skill: Skill = {
			id: existing?.id ?? createId("skill"),
			name,
			color: skillForm.color,
			goal: {
				type: skillForm.goalType,
				value: skillForm.goalType === "weekly-sessions" ? Math.round(goalValue) : Math.round(goalValue),
			},
			pomodoro: skillForm.pomodoro,
			createdAt: existing?.createdAt ?? new Date().toISOString(),
			archivedAt: existing?.archivedAt,
		};

		setBusy(true);
		try {
			await saveSkill(skill);
			setData((current) => ({
				...current,
				skills: existing ? current.skills.map((item) => (item.id === skill.id ? skill : item)) : [...current.skills, skill],
			}));
			resetSkillForm();
			setToast(existing ? "Skill updated." : "Skill added.");
		} catch (error) {
			setToast(error instanceof Error ? error.message : "Could not save skill.");
		} finally {
			setBusy(false);
		}
	}

	function editSkill(skill: Skill) {
		setEditingSkillId(skill.id);
		setSkillForm({
			name: skill.name,
			color: skill.color,
			goalType: skill.goal.type,
			goalValue: String(skill.goal.value),
			pomodoro: skill.pomodoro,
		});
		setTab("skills");
	}

	async function archiveSkill(skill: Skill) {
		if (data.activeSession?.skillId === skill.id) {
			setToast("Stop this skill's active timer before archiving it.");
			return;
		}

		const archived = {
			...skill,
			archivedAt: new Date().toISOString(),
		};

		setBusy(true);
		try {
			await saveSkill(archived);
			setData((current) => ({
				...current,
				skills: current.skills.map((item) => (item.id === skill.id ? archived : item)),
			}));
			setToast(`${skill.name} archived.`);
		} catch (error) {
			setToast(error instanceof Error ? error.message : "Could not archive skill.");
		} finally {
			setBusy(false);
		}
	}

	async function restoreSkill(skill: Skill) {
		const restored = { ...skill };
		delete restored.archivedAt;

		setBusy(true);
		try {
			await saveSkill(restored);
			setData((current) => ({
				...current,
				skills: current.skills.map((item) => (item.id === skill.id ? restored : item)),
			}));
			setToast(`${skill.name} restored.`);
		} catch (error) {
			setToast(error instanceof Error ? error.message : "Could not restore skill.");
		} finally {
			setBusy(false);
		}
	}

	async function toggleTimer(skill: Skill) {
		if (data.activeSession?.skillId === skill.id) {
			await stopActiveSession();
			return;
		}

		if (data.activeSession) {
			setToast("Stop the current session before starting another.");
			return;
		}

		const active: ActiveSession = {
			id: createId("session"),
			skillId: skill.id,
			startedAt: new Date().toISOString(),
		};

		setBusy(true);
		try {
			await setActiveSession(active);
			setData((current) => ({ ...current, activeSession: active }));
			setToast("Timer started.");
		} catch (error) {
			setToast(error instanceof Error ? error.message : "Could not start timer.");
		} finally {
			setBusy(false);
		}
	}

	async function stopActiveSession() {
		if (!data.activeSession) {
			return;
		}

		const endedAt = new Date().toISOString();
		const session: Session = {
			id: data.activeSession.id,
			skillId: data.activeSession.skillId,
			startedAt: data.activeSession.startedAt,
			endedAt,
			source: "timer",
		};

		setBusy(true);
		try {
			if (new Date(session.endedAt).getTime() > new Date(session.startedAt).getTime()) {
				await saveSession(session);
			}
			await setActiveSession(null);
			setData((current) => ({
				...current,
				activeSession: null,
				sessions: new Date(session.endedAt).getTime() > new Date(session.startedAt).getTime() ? [...current.sessions, session] : current.sessions,
			}));
			setToast("Session saved.");
		} catch (error) {
			setToast(error instanceof Error ? error.message : "Could not stop timer.");
		} finally {
			setBusy(false);
		}
	}

	function openManualEntry(dayKey = selectedDay) {
		setManualForm(defaultManualForm(dayKey, activeSkills[0]?.id ?? ""));
		setManualOpen(true);
	}

	async function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!manualForm.skillId) {
			setToast("Choose a skill for the manual entry.");
			return;
		}

		setBusy(true);
		try {
			const parsed = parseManualEntry(manualForm.dayKey, manualForm.startTime, manualForm.endTime);
			const session: Session = {
				id: createId("session"),
				skillId: manualForm.skillId,
				startedAt: parsed.startedAt,
				endedAt: parsed.endedAt,
				source: "manual",
				note: manualForm.note.trim() || undefined,
			};
			await saveSession(session);
			setData((current) => ({ ...current, sessions: [...current.sessions, session] }));
			setSelectedDay(manualForm.dayKey);
			setManualOpen(false);
			setToast("Manual time added.");
		} catch (error) {
			setToast(error instanceof Error ? error.message : "Could not add manual time.");
		} finally {
			setBusy(false);
		}
	}

	async function handleExport() {
		try {
			const snapshot = await exportHoursData();
			const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `hours-backup-${getDayKey(new Date())}.json`;
			link.click();
			URL.revokeObjectURL(url);
			setToast("Backup downloaded.");
		} catch (error) {
			setToast(error instanceof Error ? error.message : "Could not export backup.");
		}
	}

	async function handleImport(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		setBusy(true);
		try {
			const imported = await importHoursData(JSON.parse(await file.text()));
			setData(imported);
			setToast("Backup imported.");
		} catch (error) {
			setToast(error instanceof Error ? error.message : "Could not import backup.");
		} finally {
			setBusy(false);
			event.target.value = "";
		}
	}

	async function handleClearData() {
		if (!window.confirm("Clear all local Hours data on this device?")) {
			return;
		}

		setBusy(true);
		try {
			await clearHoursData();
			setData(emptyData);
			resetSkillForm();
			setToast("Local data cleared.");
		} catch (error) {
			setToast(error instanceof Error ? error.message : "Could not clear local data.");
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="hours-shell">
			<header className="app-header">
				<div>
					<p className="eyebrow">Digital wellbeing for skills</p>
					<h1>Hours</h1>
				</div>
				<button className="icon-button" type="button" aria-label="Add manual time" onClick={() => openManualEntry(todayKey)} disabled={!activeSkills.length || busy}>
					<Plus size={20} />
				</button>
			</header>

			{storageError ? <div className="notice danger">{storageError}</div> : null}
			{!ready ? <div className="notice">Loading your local timeline...</div> : null}

			<main className="app-main">
				{tab === "today" ? (
					<TodayView
						activeSession={data.activeSession}
						activeSkill={activeSkill}
						activeSkills={activeSkills}
						busy={busy}
						now={now}
						sessions={sessionsWithActive}
						todayKey={todayKey}
						todayTotal={todayTotal}
						todayTotals={todayTotals}
						onEditSkill={editSkill}
						onManual={() => openManualEntry(todayKey)}
						onStop={stopActiveSession}
						onToggleTimer={toggleTimer}
					/>
				) : null}

				{tab === "skills" ? (
					<SkillsView
						archivedSkills={archivedSkills}
						busy={busy}
						editingSkillId={editingSkillId}
						form={skillForm}
						skills={activeSkills}
						onArchive={archiveSkill}
						onCancelEdit={resetSkillForm}
						onEdit={editSkill}
						onFormChange={setSkillForm}
						onRestore={restoreSkill}
						onSubmit={handleSkillSubmit}
					/>
				) : null}

				{tab === "calendar" ? (
					<CalendarView
						month={visibleMonth}
						selectedDay={selectedDay}
						selectedDaySlices={selectedDaySlices}
						selectedDayTotal={selectedDayTotal}
						sessions={sessionsWithActive}
						skills={data.skills}
						onManual={() => openManualEntry(selectedDay)}
						onMonthChange={setVisibleMonth}
						onSelectDay={setSelectedDay}
					/>
				) : null}

				{tab === "settings" ? (
					<SettingsView busy={busy} onClear={handleClearData} onExport={handleExport} onImportClick={() => importInputRef.current?.click()} />
				) : null}
			</main>

			<nav className="bottom-nav" aria-label="Primary">
				<NavButton active={tab === "today"} icon={<Home size={20} />} label="Today" onClick={() => setTab("today")} />
				<NavButton active={tab === "skills"} icon={<Target size={20} />} label="Skills" onClick={() => setTab("skills")} />
				<NavButton active={tab === "calendar"} icon={<CalendarDays size={20} />} label="Calendar" onClick={() => setTab("calendar")} />
				<NavButton active={tab === "settings"} icon={<Settings size={20} />} label="Settings" onClick={() => setTab("settings")} />
			</nav>

			<input ref={importInputRef} className="sr-only" type="file" accept="application/json" onChange={handleImport} />

			{manualOpen ? (
				<ManualEntryDialog
					busy={busy}
					form={manualForm}
					skills={activeSkills}
					onChange={setManualForm}
					onClose={() => setManualOpen(false)}
					onSubmit={handleManualSubmit}
				/>
			) : null}

			{toast ? <div className="toast">{toast}</div> : null}
		</div>
	);
}

function TodayView({
	activeSession,
	activeSkill,
	activeSkills,
	busy,
	now,
	sessions,
	todayKey,
	todayTotal,
	todayTotals,
	onEditSkill,
	onManual,
	onStop,
	onToggleTimer,
}: {
	activeSession: ActiveSession | null;
	activeSkill?: Skill;
	activeSkills: Skill[];
	busy: boolean;
	now: Date;
	sessions: Session[];
	todayKey: string;
	todayTotal: number;
	todayTotals: Map<string, number>;
	onEditSkill: (skill: Skill) => void;
	onManual: () => void;
	onStop: () => void;
	onToggleTimer: (skill: Skill) => void;
}) {
	return (
		<div className="view-stack">
			<section className="summary-band">
				<div>
					<p className="label">Today</p>
					<strong>{formatDuration(todayTotal)}</strong>
				</div>
				<div>
					<p className="label">Skills touched</p>
					<strong>{[...todayTotals.values()].filter(Boolean).length}</strong>
				</div>
			</section>

			{activeSession && activeSkill ? (
				<ActiveTimerCard activeSession={activeSession} now={now} skill={activeSkill} sessions={sessions} onStop={onStop} busy={busy} />
			) : (
				<section className="focus-panel">
					<div>
						<p className="label">Ready when you are</p>
						<h2>Start one focused skill session.</h2>
					</div>
					<button className="secondary-button" type="button" onClick={onManual} disabled={!activeSkills.length || busy}>
						<Clock3 size={18} />
						Add missed time
					</button>
				</section>
			)}

			<section className="section-block">
				<div className="section-heading">
					<div>
						<p className="label">Track</p>
						<h2>Your skills</h2>
					</div>
				</div>

				{activeSkills.length ? (
					<div className="skill-list">
						{activeSkills.map((skill) => (
							<SkillProgressCard
								key={skill.id}
								active={activeSession?.skillId === skill.id}
								busy={busy}
								progress={getGoalProgress(skill, sessions, now)}
								skill={skill}
								todayMs={todayTotals.get(skill.id) ?? 0}
								onEdit={() => onEditSkill(skill)}
								onToggle={() => onToggleTimer(skill)}
							/>
						))}
					</div>
				) : (
					<EmptyState title="Add your first skill" text="Set a tiny quota, then let Hours keep the timeline for you." />
				)}
			</section>

			<DailyBreakdown dayKey={todayKey} sessions={sessions} skills={activeSkills} title="Today timeline" />
		</div>
	);
}

function ActiveTimerCard({
	activeSession,
	busy,
	now,
	sessions,
	skill,
	onStop,
}: {
	activeSession: ActiveSession;
	busy: boolean;
	now: Date;
	sessions: Session[];
	skill: Skill;
	onStop: () => void;
}) {
	const elapsed = now.getTime() - new Date(activeSession.startedAt).getTime();
	const progress = getGoalProgress(skill, sessions, now);
	const pomodoro = getPomodoroPhase(skill, activeSession, now);
	const motivation = getMotivation(progress);

	return (
		<section className="active-card" style={{ "--skill": skill.color } as CSSProperties}>
			<div className="active-topline">
				<div>
					<p className="label">In session</p>
					<h2>{skill.name}</h2>
				</div>
				<button className="stop-button" type="button" onClick={onStop} disabled={busy}>
					<Square size={18} />
					Stop
				</button>
			</div>
			<div className="timer-face">{formatClock(elapsed)}</div>
			<p className="motivation">{motivation}</p>
			{pomodoro.enabled ? (
				<div className="pomodoro-strip">
					<span>{pomodoro.label}</span>
					<span>Cycle {pomodoro.cycleIndex}</span>
					<span>{formatClock(pomodoro.remainingInPhaseMs)} left</span>
				</div>
			) : null}
		</section>
	);
}

function SkillProgressCard({
	active,
	busy,
	progress,
	skill,
	todayMs,
	onEdit,
	onToggle,
}: {
	active: boolean;
	busy: boolean;
	progress: ReturnType<typeof getGoalProgress>;
	skill: Skill;
	todayMs: number;
	onEdit: () => void;
	onToggle: () => void;
}) {
	const progressText =
		progress.kind === "duration"
			? `${formatDuration(progress.completedMs)} / ${formatDuration(progress.targetMs)}`
			: `${progress.completedSessions} / ${progress.targetSessions} sessions`;

	return (
		<article className="skill-card" style={{ "--skill": skill.color } as CSSProperties}>
			<div className="skill-main">
				<div className="skill-dot" aria-hidden />
				<div>
					<h3>{skill.name}</h3>
					<p>
						{GOAL_LABELS[skill.goal.type]} · {POMODORO_LABELS[skill.pomodoro]}
					</p>
				</div>
			</div>
			<div className="progress-line">
				<div style={{ width: `${progress.percent}%` }} />
			</div>
			<div className="skill-meta">
				<span>{progressText}</span>
				<span>{formatDuration(todayMs)} today</span>
			</div>
			<div className="card-actions">
				<button className="ghost-button" type="button" onClick={onEdit}>
					<Pencil size={16} />
					Edit
				</button>
				<button className={active ? "primary-button active" : "primary-button"} type="button" onClick={onToggle} disabled={busy}>
					{active ? <Square size={17} /> : <Play size={17} />}
					{active ? "Stop" : "Start"}
				</button>
			</div>
		</article>
	);
}

function SkillsView({
	archivedSkills,
	busy,
	editingSkillId,
	form,
	skills,
	onArchive,
	onCancelEdit,
	onEdit,
	onFormChange,
	onRestore,
	onSubmit,
}: {
	archivedSkills: Skill[];
	busy: boolean;
	editingSkillId: string | null;
	form: SkillFormState;
	skills: Skill[];
	onArchive: (skill: Skill) => void;
	onCancelEdit: () => void;
	onEdit: (skill: Skill) => void;
	onFormChange: (form: SkillFormState) => void;
	onRestore: (skill: Skill) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
	return (
		<div className="view-stack">
			<section className="section-block">
				<div className="section-heading">
					<div>
						<p className="label">{editingSkillId ? "Update quota" : "New skill"}</p>
						<h2>{editingSkillId ? "Edit skill" : "Add a skill"}</h2>
					</div>
					{editingSkillId ? (
						<button className="ghost-button icon-only-wide" type="button" onClick={onCancelEdit}>
							<RefreshCcw size={16} />
							Cancel
						</button>
					) : null}
				</div>

				<form className="skill-form" onSubmit={onSubmit}>
					<label>
						<span>Name</span>
						<input value={form.name} placeholder="DSA, Piano, Reading..." onChange={(event) => onFormChange({ ...form, name: event.target.value })} />
					</label>

					<div className="color-row" aria-label="Skill color">
						{SKILL_COLORS.map((color) => (
							<button
								key={color}
								className={form.color === color ? "color-swatch selected" : "color-swatch"}
								style={{ backgroundColor: color }}
								type="button"
								aria-label={`Use color ${color}`}
								onClick={() => onFormChange({ ...form, color })}
							/>
						))}
					</div>

					<label>
						<span>Goal type</span>
						<select value={form.goalType} onChange={(event) => onFormChange({ ...form, goalType: event.target.value as GoalType })}>
							<option value="daily-minutes">Minutes per day</option>
							<option value="weekly-minutes">Minutes per week</option>
							<option value="weekly-sessions">Sessions per week</option>
						</select>
					</label>

					<div className="form-grid">
						<label>
							<span>Target</span>
							<input min="1" inputMode="numeric" type="number" value={form.goalValue} onChange={(event) => onFormChange({ ...form, goalValue: event.target.value })} />
						</label>
						<label>
							<span>Pomodoro</span>
							<select value={form.pomodoro} onChange={(event) => onFormChange({ ...form, pomodoro: event.target.value as PomodoroPreset })}>
								<option value="none">Off</option>
								<option value="25-5">25 focus / 5 break</option>
								<option value="50-10">50 focus / 10 break</option>
							</select>
						</label>
					</div>

					<button className="primary-button full" type="submit" disabled={busy}>
						<Check size={18} />
						{editingSkillId ? "Save skill" : "Create skill"}
					</button>
				</form>
			</section>

			<section className="section-block">
				<div className="section-heading">
					<div>
						<p className="label">Library</p>
						<h2>Active skills</h2>
					</div>
				</div>
				{skills.length ? (
					<div className="simple-list">
						{skills.map((skill) => (
							<SkillListItem key={skill.id} skill={skill} onArchive={() => onArchive(skill)} onEdit={() => onEdit(skill)} />
						))}
					</div>
				) : (
					<EmptyState title="No active skills yet" text="Add one skill to unlock timer tracking and daily logs." />
				)}
			</section>

			{archivedSkills.length ? (
				<section className="section-block">
					<div className="section-heading">
						<div>
							<p className="label">History safe</p>
							<h2>Archived</h2>
						</div>
					</div>
					<div className="simple-list">
						{archivedSkills.map((skill) => (
							<SkillListItem key={skill.id} archived skill={skill} onRestore={() => onRestore(skill)} />
						))}
					</div>
				</section>
			) : null}
		</div>
	);
}

function SkillListItem({
	archived,
	skill,
	onArchive,
	onEdit,
	onRestore,
}: {
	archived?: boolean;
	skill: Skill;
	onArchive?: () => void;
	onEdit?: () => void;
	onRestore?: () => void;
}) {
	return (
		<article className="list-item" style={{ "--skill": skill.color } as CSSProperties}>
			<div className="skill-main">
				<div className="skill-dot" aria-hidden />
				<div>
					<h3>{skill.name}</h3>
					<p>
						{skill.goal.value} · {GOAL_LABELS[skill.goal.type]} · {POMODORO_LABELS[skill.pomodoro]}
					</p>
				</div>
			</div>
			<div className="row-actions">
				{archived ? (
					<button className="ghost-button" type="button" onClick={onRestore}>
						<RefreshCcw size={16} />
						Restore
					</button>
				) : (
					<>
						<button className="icon-button small" type="button" aria-label={`Edit ${skill.name}`} onClick={onEdit}>
							<Pencil size={16} />
						</button>
						<button className="icon-button small" type="button" aria-label={`Archive ${skill.name}`} onClick={onArchive}>
							<Archive size={16} />
						</button>
					</>
				)}
			</div>
		</article>
	);
}

function CalendarView({
	month,
	selectedDay,
	selectedDaySlices,
	selectedDayTotal,
	sessions,
	skills,
	onManual,
	onMonthChange,
	onSelectDay,
}: {
	month: Date;
	selectedDay: string;
	selectedDaySlices: ReturnType<typeof getDaySlices>;
	selectedDayTotal: number;
	sessions: Session[];
	skills: Skill[];
	onManual: () => void;
	onMonthChange: (date: Date) => void;
	onSelectDay: (dayKey: string) => void;
}) {
	const days = getCalendarDays(month);
	const currentMonth = month.getMonth();

	return (
		<div className="view-stack">
			<section className="section-block">
				<div className="calendar-header">
					<button className="icon-button small" type="button" aria-label="Previous month" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
						<RefreshCcw className="rotate-left" size={16} />
					</button>
					<h2>
						{new Intl.DateTimeFormat(undefined, {
							month: "long",
							year: "numeric",
						}).format(month)}
					</h2>
					<button className="icon-button small" type="button" aria-label="Next month" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
						<RefreshCcw className="rotate-right" size={16} />
					</button>
				</div>
				<div className="weekday-grid">
					{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
						<span key={`${day}-${index}`}>{day}</span>
					))}
				</div>
				<div className="calendar-grid">
					{days.map((day) => {
						const dayKey = getDayKey(day);
						const total = getTotalForDay(sessions, dayKey);
						const active = dayKey === selectedDay;
						return (
							<button
								key={dayKey}
								className={active ? "day-cell selected" : "day-cell"}
								type="button"
								data-muted={day.getMonth() !== currentMonth}
								onClick={() => onSelectDay(dayKey)}
							>
								<span>{day.getDate()}</span>
								<i style={{ opacity: total ? 1 : 0 }} />
							</button>
						);
					})}
				</div>
			</section>

			<section className="summary-band">
				<div>
					<p className="label">Selected day</p>
					<strong>{formatReadableDay(selectedDay)}</strong>
				</div>
				<div>
					<p className="label">Total</p>
					<strong>{formatDuration(selectedDayTotal)}</strong>
				</div>
			</section>

			<button className="secondary-button full" type="button" onClick={onManual} disabled={!skills.filter((skill) => !skill.archivedAt).length}>
				<Plus size={18} />
				Add missed time
			</button>

			<DailyBreakdown dayKey={selectedDay} sessions={sessions} skills={skills} title="Timeline" />
			<SkillBreakdown slices={selectedDaySlices} skills={skills} />
		</div>
	);
}

function SettingsView({
	busy,
	onClear,
	onExport,
	onImportClick,
}: {
	busy: boolean;
	onClear: () => void;
	onExport: () => void;
	onImportClick: () => void;
}) {
	return (
		<div className="view-stack">
			<section className="section-block">
				<div className="section-heading">
					<div>
						<p className="label">Local-first</p>
						<h2>Backup</h2>
					</div>
				</div>
				<div className="settings-actions">
					<button className="secondary-button full" type="button" onClick={onExport} disabled={busy}>
						<Download size={18} />
						Export JSON
					</button>
					<button className="secondary-button full" type="button" onClick={onImportClick} disabled={busy}>
						<Upload size={18} />
						Import JSON
					</button>
					<button className="danger-button full" type="button" onClick={onClear} disabled={busy}>
						<Trash2 size={18} />
						Clear this device
					</button>
				</div>
			</section>

			<section className="section-block">
				<div className="section-heading">
					<div>
						<p className="label">Support</p>
						<h2>Donate</h2>
					</div>
				</div>
				<div className="settings-actions">
					<a className="primary-button full" href={PAYPAL_DONATION_URL} target="_blank" rel="noreferrer">
						<Heart size={18} />
						Donate with PayPal
					</a>
					<a className="secondary-button full" href={RAZORPAY_PAYMENT_URL} target="_blank" rel="noreferrer">
						<Heart size={18} />
						Pay with Razorpay
					</a>
				</div>
			</section>
		</div>
	);
}

function ManualEntryDialog({
	busy,
	form,
	skills,
	onChange,
	onClose,
	onSubmit,
}: {
	busy: boolean;
	form: ManualFormState;
	skills: Skill[];
	onChange: (form: ManualFormState) => void;
	onClose: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
	return (
		<div className="dialog-backdrop" role="presentation">
			<section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="manual-entry-title">
				<div className="section-heading">
					<div>
						<p className="label">Manual log</p>
						<h2 id="manual-entry-title">Add missed time</h2>
					</div>
					<button className="icon-button small" type="button" aria-label="Close manual entry" onClick={onClose}>
						<Square size={14} />
					</button>
				</div>
				<form className="skill-form" onSubmit={onSubmit}>
					<label>
						<span>Skill</span>
						<select value={form.skillId} onChange={(event) => onChange({ ...form, skillId: event.target.value })}>
							<option value="">Choose skill</option>
							{skills.map((skill) => (
								<option key={skill.id} value={skill.id}>
									{skill.name}
								</option>
							))}
						</select>
					</label>
					<label>
						<span>Date</span>
						<input type="date" value={form.dayKey} onChange={(event) => onChange({ ...form, dayKey: event.target.value })} />
					</label>
					<div className="form-grid">
						<label>
							<span>Start</span>
							<input type="time" value={form.startTime} onChange={(event) => onChange({ ...form, startTime: event.target.value })} />
						</label>
						<label>
							<span>End</span>
							<input type="time" value={form.endTime} onChange={(event) => onChange({ ...form, endTime: event.target.value })} />
						</label>
					</div>
					<label>
						<span>Note</span>
						<input value={form.note} placeholder="Optional" onChange={(event) => onChange({ ...form, note: event.target.value })} />
					</label>
					<button className="primary-button full" type="submit" disabled={busy}>
						<Check size={18} />
						Add time
					</button>
				</form>
			</section>
		</div>
	);
}

function DailyBreakdown({ dayKey, sessions, skills, title }: { dayKey: string; sessions: Session[]; skills: Skill[]; title: string }) {
	const skillMap = new Map(skills.map((skill) => [skill.id, skill]));
	const slices = getDaySlices(sessions, dayKey);

	return (
		<section className="section-block">
			<div className="section-heading">
				<div>
					<p className="label">{formatReadableDay(dayKey)}</p>
					<h2>{title}</h2>
				</div>
			</div>
			{slices.length ? (
				<div className="timeline">
					{slices.map((slice) => {
						const skill = skillMap.get(slice.skillId);
						return (
							<article key={`${slice.sessionId}-${slice.startedAt}`} className="timeline-item" style={{ "--skill": skill?.color ?? "#9ca3af" } as CSSProperties}>
								<div className="timeline-time">
									<span>{formatTime(slice.startedAt)}</span>
									<span>{formatTime(slice.endedAt)}</span>
								</div>
								<div>
									<h3>{skill?.name ?? "Archived skill"}</h3>
									<p>
										{formatDuration(slice.durationMs)} · {slice.source}
										{slice.note ? ` · ${slice.note}` : ""}
									</p>
								</div>
							</article>
						);
					})}
				</div>
			) : (
				<EmptyState title="No time logged" text="Start a timer or add missed time to build this day." />
			)}
		</section>
	);
}

function SkillBreakdown({ slices, skills }: { slices: ReturnType<typeof getDaySlices>; skills: Skill[] }) {
	const skillMap = new Map(skills.map((skill) => [skill.id, skill]));
	const totals = slices.reduce((map, slice) => {
		map.set(slice.skillId, (map.get(slice.skillId) ?? 0) + slice.durationMs);
		return map;
	}, new Map<string, number>());
	const max = Math.max(...totals.values(), 1);

	return (
		<section className="section-block">
			<div className="section-heading">
				<div>
					<p className="label">Digital wellbeing view</p>
					<h2>Skill usage</h2>
				</div>
			</div>
			{totals.size ? (
				<div className="breakdown-list">
					{[...totals.entries()].map(([skillId, total]) => {
						const skill = skillMap.get(skillId);
						return (
							<div key={skillId} className="breakdown-row" style={{ "--skill": skill?.color ?? "#9ca3af" } as CSSProperties}>
								<div>
									<span>{skill?.name ?? "Archived skill"}</span>
									<strong>{formatDuration(total)}</strong>
								</div>
								<i>
									<b style={{ width: `${(total / max) * 100}%` }} />
								</i>
							</div>
						);
					})}
				</div>
			) : (
				<EmptyState title="Nothing to compare" text="A day with two skills will show the best usage breakdown here." />
			)}
		</section>
	);
}

function EmptyState({ text, title }: { text: string; title: string }) {
	return (
		<div className="empty-state">
			<TimerReset size={24} />
			<h3>{title}</h3>
			<p>{text}</p>
		</div>
	);
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
	return (
		<button className={active ? "nav-button active" : "nav-button"} type="button" onClick={onClick}>
			{icon}
			<span>{label}</span>
		</button>
	);
}

function getCalendarDays(month: Date): Date[] {
	const first = new Date(month.getFullYear(), month.getMonth(), 1);
	const mondayOffset = (first.getDay() + 6) % 7;
	const start = addDays(first, -mondayOffset);
	return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function formatReadableDay(dayKey: string): string {
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
	}).format(startOfLocalDay(dayKey));
}

function getMotivation(progress: ReturnType<typeof getGoalProgress>): string {
	if (progress.percent >= 100) {
		return "Well done, Champ. Today's target is complete.";
	}
	if (progress.percent >= 90) {
		return "You're almost there. Keep the line moving.";
	}
	if (progress.percent > 0) {
		return "One session at a time. Momentum counts.";
	}
	return "Starting is the hardest step.";
}
