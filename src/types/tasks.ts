export type Cadence = 'daily' | 'weekly' | 'monthly' | 'free';

export type TaskCategory = 'good' | 'bad' | 'neutral';

export type Task = {
  id: string;
  title: string;
  notes?: string;
  tags: string[];
  cadence: Cadence;
  targetMinutes: number | null;
  preferredTime?: string;
  category: TaskCategory;
  createdAt: string;
};

export type TimeSession = {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
};

export type ActiveTimer = {
  taskId: string;
  startedAt: string;
};

export type AppDataState = {
  tasks: Task[];
  sessions: TimeSession[];
  activeTimer: ActiveTimer | null;
};
