/**
 * db.js
 * Promise-based IndexedDB wrapper for Houry.
 */

const DB_NAME = 'HouryDB';
const DB_VERSION = 1;

class HouryDatabase {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 1. Skills store
        if (!db.objectStoreNames.contains('skills')) {
          const skillStore = db.createObjectStore('skills', { keyPath: 'id', autoIncrement: true });
          skillStore.createIndex('name', 'name', { unique: true });
        }

        // 2. Sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
          sessionStore.createIndex('skillId', 'skillId', { unique: false });
          sessionStore.createIndex('date', 'date', { unique: false });
        }

        // 3. Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Prepopulate with default skills
        const transaction = event.target.transaction;
        const skillStore = transaction.objectStore('skills');
        const defaultSkills = [
          { name: 'DSA', color: '#00f2fe', goalType: 'daily-hours', goalValue: 2, createdAt: Date.now() },
          { name: 'Piano', color: '#d946ef', goalType: 'weekly-times', goalValue: 3, createdAt: Date.now() },
          { name: 'Reading', color: '#10b981', goalType: 'weekly-hours', goalValue: 12, createdAt: Date.now() },
          { name: 'Gym', color: '#f59e0b', goalType: 'daily-hours', goalValue: 1, createdAt: Date.now() }
        ];

        defaultSkills.forEach(skill => {
          skillStore.add(skill);
        });

        console.log('Database initialized with default stores and skills.');
      };
    });
  }

  // --- SKILLS METHODS ---
  async addSkill(skill) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('skills', 'readwrite');
      const store = tx.objectStore('skills');
      const request = store.add(skill);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async getSkills() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('skills', 'readonly');
      const store = tx.objectStore('skills');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async getSkill(id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('skills', 'readonly');
      const store = tx.objectStore('skills');
      const request = store.get(Number(id));

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async deleteSkill(id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['skills', 'sessions'], 'readwrite');
      const skillStore = tx.objectStore('skills');
      const sessionStore = tx.objectStore('sessions');

      // Delete the skill
      skillStore.delete(Number(id));

      // Also clean up all sessions associated with this skill
      const index = sessionStore.index('skillId');
      const request = index.openCursor(IDBKeyRange.only(Number(id)));
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  // --- SESSIONS METHODS ---
  async addSession(session) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      const request = store.add(session);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async getSessionsByDate(dateStr) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('sessions', 'readonly');
      const store = tx.objectStore('sessions');
      const index = store.index('date');
      const request = index.getAll(IDBKeyRange.only(dateStr));

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async getSessionsBySkill(skillId) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('sessions', 'readonly');
      const store = tx.objectStore('sessions');
      const index = store.index('skillId');
      const request = index.getAll(IDBKeyRange.only(Number(skillId)));

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async getAllSessions() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('sessions', 'readonly');
      const store = tx.objectStore('sessions');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async deleteSession(id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      const request = store.delete(Number(id));

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // --- SETTINGS METHODS ---
  async getSetting(key, defaultValue = null) {
    await this.initPromise;
    return new Promise((resolve) => {
      const tx = this.db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.value);
        } else {
          resolve(defaultValue);
        }
      };
      request.onerror = () => resolve(defaultValue);
    });
  }

  async setSetting(key, value) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }
}

// Export a single instance to be used globally
window.db = new HouryDatabase();
