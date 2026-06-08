import {
	type ActiveSession,
	type HoursSnapshot,
	type Session,
	type Skill,
	normalizeSnapshot,
} from "./hours";

const DB_NAME = "hours-local-first";
const DB_VERSION = 1;
const SKILLS_STORE = "skills";
const SESSIONS_STORE = "sessions";
const META_STORE = "meta";
const ACTIVE_KEY = "activeSession";

let dbPromise: Promise<IDBDatabase> | null = null;

type MetaRecord = {
	key: string;
	value: unknown;
};

export type HoursData = {
	skills: Skill[];
	sessions: Session[];
	activeSession: ActiveSession | null;
};

export function isIndexedDbAvailable(): boolean {
	return typeof window !== "undefined" && "indexedDB" in window;
}

export async function loadHoursData(): Promise<HoursData> {
	const [skills, sessions, activeSession] = await Promise.all([getAllSkills(), getAllSessions(), getActiveSession()]);
	return {
		skills: sortSkills(skills),
		sessions: sortSessions(sessions),
		activeSession,
	};
}

export async function saveSkill(skill: Skill): Promise<void> {
	const db = await openHoursDb();
	await writeStore(db, SKILLS_STORE, (store) => store.put(skill));
}

export async function saveSession(session: Session): Promise<void> {
	const db = await openHoursDb();
	await writeStore(db, SESSIONS_STORE, (store) => store.put(session));
}

export async function setActiveSession(activeSession: ActiveSession | null): Promise<void> {
	const db = await openHoursDb();
	await writeStore(db, META_STORE, (store) => store.put({ key: ACTIVE_KEY, value: activeSession }));
}

export async function exportHoursData(): Promise<HoursSnapshot> {
	const data = await loadHoursData();
	return {
		version: 1,
		exportedAt: new Date().toISOString(),
		skills: data.skills,
		sessions: data.sessions,
		activeSession: data.activeSession,
	};
}

export async function importHoursData(value: unknown): Promise<HoursData> {
	const snapshot = normalizeSnapshot(value);
	const db = await openHoursDb();

	await writeTransaction(db, [SKILLS_STORE, SESSIONS_STORE, META_STORE], (transaction) => {
		const skills = transaction.objectStore(SKILLS_STORE);
		const sessions = transaction.objectStore(SESSIONS_STORE);
		const meta = transaction.objectStore(META_STORE);

		skills.clear();
		sessions.clear();
		meta.clear();

		for (const skill of snapshot.skills) {
			skills.put(skill);
		}
		for (const session of snapshot.sessions) {
			sessions.put(session);
		}
		meta.put({ key: ACTIVE_KEY, value: snapshot.activeSession ?? null });
	});

	return loadHoursData();
}

export async function clearHoursData(): Promise<void> {
	const db = await openHoursDb();
	await writeTransaction(db, [SKILLS_STORE, SESSIONS_STORE, META_STORE], (transaction) => {
		transaction.objectStore(SKILLS_STORE).clear();
		transaction.objectStore(SESSIONS_STORE).clear();
		transaction.objectStore(META_STORE).clear();
	});
}

async function getAllSkills(): Promise<Skill[]> {
	const db = await openHoursDb();
	return readStore<Skill[]>(db, SKILLS_STORE, (store) => store.getAll());
}

async function getAllSessions(): Promise<Session[]> {
	const db = await openHoursDb();
	return readStore<Session[]>(db, SESSIONS_STORE, (store) => store.getAll());
}

async function getActiveSession(): Promise<ActiveSession | null> {
	const db = await openHoursDb();
	const record = await readStore<MetaRecord | undefined>(db, META_STORE, (store) => store.get(ACTIVE_KEY));
	return (record?.value as ActiveSession | null | undefined) ?? null;
}

function openHoursDb(): Promise<IDBDatabase> {
	if (!isIndexedDbAvailable()) {
		return Promise.reject(new Error("IndexedDB is not available in this browser."));
	}

	dbPromise ??= new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(SKILLS_STORE)) {
				db.createObjectStore(SKILLS_STORE, { keyPath: "id" });
			}
			if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
				db.createObjectStore(SESSIONS_STORE, { keyPath: "id" });
			}
			if (!db.objectStoreNames.contains(META_STORE)) {
				db.createObjectStore(META_STORE, { keyPath: "key" });
			}
		};

		request.onerror = () => reject(request.error ?? new Error("Could not open Hours database."));
		request.onsuccess = () => {
			const db = request.result;
			db.onversionchange = () => {
				db.close();
				dbPromise = null;
			};
			resolve(db);
		};
	});

	return dbPromise;
}

function readStore<T>(db: IDBDatabase, storeName: string, operation: (store: IDBObjectStore) => IDBRequest): Promise<T> {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, "readonly");
		const request = operation(transaction.objectStore(storeName));

		request.onerror = () => reject(request.error ?? new Error(`Could not read ${storeName}.`));
		request.onsuccess = () => resolve(request.result as T);
		transaction.onerror = () => reject(transaction.error ?? new Error(`Could not read ${storeName}.`));
	});
}

function writeStore(db: IDBDatabase, storeName: string, operation: (store: IDBObjectStore) => void): Promise<void> {
	return writeTransaction(db, [storeName], (transaction) => {
		operation(transaction.objectStore(storeName));
	});
}

function writeTransaction(db: IDBDatabase, storeNames: string[], operation: (transaction: IDBTransaction) => void): Promise<void> {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeNames, "readwrite");

		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error ?? new Error("Could not write Hours data."));
		transaction.onabort = () => reject(transaction.error ?? new Error("Hours data write was aborted."));

		operation(transaction);
	});
}

function sortSkills(skills: Skill[]): Skill[] {
	return [...skills].sort((a, b) => {
		const activeSort = Number(Boolean(a.archivedAt)) - Number(Boolean(b.archivedAt));
		if (activeSort !== 0) {
			return activeSort;
		}
		return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
	});
}

function sortSessions(sessions: Session[]): Session[] {
	return [...sessions].sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
}
