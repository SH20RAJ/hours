import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { AppDataState, Cadence, Task, TaskCategory } from '@/types/tasks';
import { getCadenceWindow, getSecondsBetween, nowIso, overlapsWindow } from '@/utils/time';

const STORAGE_KEY = '@hours:data:v1';

type CreateTaskInput = {
  title: string;
  notes?: string;
  tags: string[];
  cadence: Cadence;
  targetMinutes: number | null;
  preferredTime?: string;
  category: TaskCategory;
};

type UpdateTaskInput = Partial<CreateTaskInput>;

type AppDataContextType = {
  loaded: boolean;
  state: AppDataState;
  createTask: (input: CreateTaskInput) => void;
  updateTask: (id: string, input: UpdateTaskInput) => void;
  deleteTask: (id: string) => void;
  toggleTimer: (taskId: string) => void;
  stopTimer: () => void;
  getTaskTrackedSeconds: (task: Task, now?: Date) => number;
  getTaskTargetSeconds: (task: Task) => number | null;
  getWeeklyTrackedSeconds: (category?: TaskCategory) => number;
  getDailyTrackedSeconds: () => number;
  getWeeklyImprovementPercent: () => number | null;
};

const defaultState: AppDataState = {
  tasks: [],
  sessions: [],
  activeTimer: null,
};

const AppDataContext = createContext<AppDataContextType | null>(null);

function generateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sumSessionSecondsForWindow(
  state: AppDataState,
  taskId: string,
  start: Date,
  end: Date,
  now = new Date()
) {
  let total = 0;

  for (const session of state.sessions) {
    if (session.taskId !== taskId) {
      continue;
    }

    if (!overlapsWindow(session.startedAt, session.endedAt, start, end)) {
      continue;
    }

    const clippedStart = Math.max(new Date(session.startedAt).getTime(), start.getTime());
    const clippedEnd = Math.min(new Date(session.endedAt).getTime(), end.getTime());
    total += Math.max(0, Math.floor((clippedEnd - clippedStart) / 1000));
  }

  if (state.activeTimer?.taskId === taskId) {
    const activeStart = new Date(state.activeTimer.startedAt);
    const clippedStart = new Date(Math.max(activeStart.getTime(), start.getTime()));
    const clippedEnd = new Date(Math.min(now.getTime(), end.getTime()));
    total += Math.max(0, Math.floor((clippedEnd.getTime() - clippedStart.getTime()) / 1000));
  }

  return total;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppDataState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          return;
        }
        const parsed = JSON.parse(raw) as AppDataState;
        if (active && parsed?.tasks && parsed?.sessions) {
          setState({
            tasks: parsed.tasks,
            sessions: parsed.sessions,
            activeTimer: parsed.activeTimer ?? null,
          });
        }
      } catch {
        // Ignore malformed storage and start fresh.
      } finally {
        if (active) {
          setLoaded(true);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loaded]);

  const value = useMemo<AppDataContextType>(
    () => ({
      loaded,
      state,
      createTask: (input) => {
        const task: Task = {
          id: generateId(),
          title: input.title.trim(),
          notes: input.notes?.trim() || undefined,
          tags: input.tags,
          cadence: input.cadence,
          targetMinutes: input.targetMinutes,
          preferredTime: input.preferredTime?.trim() || undefined,
          category: input.category,
          createdAt: nowIso(),
        };

        setState((prev) => ({
          ...prev,
          tasks: [task, ...prev.tasks],
        }));
      },
      updateTask: (id, input) => {
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) => {
            if (task.id !== id) {
              return task;
            }

            return {
              ...task,
              ...input,
              title: input.title !== undefined ? input.title.trim() : task.title,
              notes: input.notes !== undefined ? input.notes?.trim() : task.notes,
              preferredTime:
                input.preferredTime !== undefined ? input.preferredTime?.trim() : task.preferredTime,
            };
          }),
        }));
      },
      deleteTask: (id) => {
        setState((prev) => {
          const sessionFiltered = prev.sessions.filter((session) => session.taskId !== id);
          const activeTimer = prev.activeTimer?.taskId === id ? null : prev.activeTimer;
          return {
            ...prev,
            tasks: prev.tasks.filter((task) => task.id !== id),
            sessions: sessionFiltered,
            activeTimer,
          };
        });
      },
      toggleTimer: (taskId) => {
        setState((prev) => {
          const now = nowIso();

          if (prev.activeTimer?.taskId === taskId) {
            const durationSeconds = getSecondsBetween(prev.activeTimer.startedAt, now);
            if (durationSeconds < 1) {
              return {
                ...prev,
                activeTimer: null,
              };
            }
            return {
              ...prev,
              activeTimer: null,
              sessions: [
                {
                  id: generateId(),
                  taskId,
                  startedAt: prev.activeTimer.startedAt,
                  endedAt: now,
                  durationSeconds,
                },
                ...prev.sessions,
              ],
            };
          }

          if (prev.activeTimer) {
            const previousDuration = getSecondsBetween(prev.activeTimer.startedAt, now);
            const closedSessions =
              previousDuration > 0
                ? [
                    {
                      id: generateId(),
                      taskId: prev.activeTimer.taskId,
                      startedAt: prev.activeTimer.startedAt,
                      endedAt: now,
                      durationSeconds: previousDuration,
                    },
                    ...prev.sessions,
                  ]
                : prev.sessions;

            return {
              ...prev,
              sessions: closedSessions,
              activeTimer: {
                taskId,
                startedAt: now,
              },
            };
          }

          return {
            ...prev,
            activeTimer: {
              taskId,
              startedAt: now,
            },
          };
        });
      },
      stopTimer: () => {
        setState((prev) => {
          if (!prev.activeTimer) {
            return prev;
          }

          const now = nowIso();
          const durationSeconds = getSecondsBetween(prev.activeTimer.startedAt, now);
          if (durationSeconds < 1) {
            return {
              ...prev,
              activeTimer: null,
            };
          }

          return {
            ...prev,
            activeTimer: null,
            sessions: [
              {
                id: generateId(),
                taskId: prev.activeTimer.taskId,
                startedAt: prev.activeTimer.startedAt,
                endedAt: now,
                durationSeconds,
              },
              ...prev.sessions,
            ],
          };
        });
      },
      getTaskTrackedSeconds: (task, now = new Date()) => {
        const window = getCadenceWindow(task.cadence, now);
        return sumSessionSecondsForWindow(state, task.id, window.start, window.end, now);
      },
      getTaskTargetSeconds: (task) => {
        if (task.cadence === 'free' || task.targetMinutes === null) {
          return null;
        }
        return task.targetMinutes * 60;
      },
      getWeeklyTrackedSeconds: (category) => {
        const now = new Date();
        const week = getCadenceWindow('weekly', now);
        const taskIds = new Set(
          state.tasks
            .filter((task) => {
              if (!category) {
                return true;
              }
              return task.category === category;
            })
            .map((task) => task.id)
        );

        let total = 0;
        for (const session of state.sessions) {
          if (!taskIds.has(session.taskId)) {
            continue;
          }
          if (!overlapsWindow(session.startedAt, session.endedAt, week.start, week.end)) {
            continue;
          }
          const clippedStart = Math.max(new Date(session.startedAt).getTime(), week.start.getTime());
          const clippedEnd = Math.min(new Date(session.endedAt).getTime(), now.getTime());
          total += Math.max(0, Math.floor((clippedEnd - clippedStart) / 1000));
        }

        if (state.activeTimer && taskIds.has(state.activeTimer.taskId)) {
          const clippedStart = Math.max(
            new Date(state.activeTimer.startedAt).getTime(),
            week.start.getTime()
          );
          total += Math.max(0, Math.floor((now.getTime() - clippedStart) / 1000));
        }

        return total;
      },
      getDailyTrackedSeconds: () => {
        const now = new Date();
        const day = getCadenceWindow('daily', now);
        let total = 0;
        for (const task of state.tasks) {
          total += sumSessionSecondsForWindow(state, task.id, day.start, day.end, now);
        }
        return total;
      },
      getWeeklyImprovementPercent: () => {
        const now = new Date();
        const thisWeek = getCadenceWindow('weekly', now);
        const lastWeekStart = new Date(thisWeek.start);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(thisWeek.start);

        const allTaskIds = new Set(state.tasks.map((task) => task.id));
        let thisWeekSeconds = 0;
        let lastWeekSeconds = 0;

        for (const session of state.sessions) {
          if (!allTaskIds.has(session.taskId)) {
            continue;
          }

          if (overlapsWindow(session.startedAt, session.endedAt, thisWeek.start, now)) {
            const clippedStart = Math.max(new Date(session.startedAt).getTime(), thisWeek.start.getTime());
            const clippedEnd = Math.min(new Date(session.endedAt).getTime(), now.getTime());
            thisWeekSeconds += Math.max(0, Math.floor((clippedEnd - clippedStart) / 1000));
          }

          if (overlapsWindow(session.startedAt, session.endedAt, lastWeekStart, lastWeekEnd)) {
            const clippedStart = Math.max(
              new Date(session.startedAt).getTime(),
              lastWeekStart.getTime()
            );
            const clippedEnd = Math.min(new Date(session.endedAt).getTime(), lastWeekEnd.getTime());
            lastWeekSeconds += Math.max(0, Math.floor((clippedEnd - clippedStart) / 1000));
          }
        }

        if (state.activeTimer) {
          const activeStart = new Date(state.activeTimer.startedAt).getTime();
          if (activeStart <= now.getTime()) {
            thisWeekSeconds += Math.max(
              0,
              Math.floor((now.getTime() - Math.max(activeStart, thisWeek.start.getTime())) / 1000)
            );
          }
        }

        if (lastWeekSeconds <= 0) {
          return null;
        }

        return ((thisWeekSeconds - lastWeekSeconds) / lastWeekSeconds) * 100;
      },
    }),
    [loaded, state]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return ctx;
}
