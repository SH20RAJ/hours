import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppData } from '@/state/tasks-context';
import type { Cadence, Task, TaskCategory } from '@/types/tasks';
import { formatDuration, formatMinutes } from '@/utils/time';

type TaskFormState = {
  title: string;
  notes: string;
  tagsCsv: string;
  cadence: Cadence;
  targetMinutes: string;
  preferredTime: string;
  category: TaskCategory;
};

const blankForm: TaskFormState = {
  title: '',
  notes: '',
  tagsCsv: '',
  cadence: 'daily',
  targetMinutes: '60',
  preferredTime: '',
  category: 'good',
};

const cadenceOptions: Cadence[] = ['daily', 'weekly', 'monthly', 'free'];
const categoryOptions: TaskCategory[] = ['good', 'bad', 'neutral'];

function getCategoryBadgeStyle(category: TaskCategory) {
  return {
    backgroundColor:
      category === 'good' ? '#123524' : category === 'bad' ? '#4a1f26' : '#2f3242',
  };
}

function TaskCard({
  task,
  isRunning,
  trackedSeconds,
  targetSeconds,
  onStartStop,
  onEdit,
  onDelete,
}: {
  task: Task;
  isRunning: boolean;
  trackedSeconds: number;
  targetSeconds: number | null;
  onStartStop: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress = targetSeconds ? Math.min(100, (trackedSeconds / targetSeconds) * 100) : null;
  const extra = targetSeconds ? Math.max(0, trackedSeconds - targetSeconds) : 0;
  const isComplete = targetSeconds ? trackedSeconds >= targetSeconds : false;

  return (
    <View style={styles.card}>
      <View style={styles.rowSpace}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <View style={styles.badge}>
              <Text style={[styles.body, styles.strong]}>{task.cadence.toUpperCase()}</Text>
            </View>
            <View style={[styles.badge, getCategoryBadgeStyle(task.category)]}>
              <Text style={[styles.body, styles.strong]}>{task.category.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.heading}>{task.title}</Text>
          {task.notes ? <Text style={styles.body}>{task.notes}</Text> : null}
          {task.preferredTime ? <Text style={styles.body}>Do at: {task.preferredTime}</Text> : null}
          {task.tags.length > 0 ? <Text style={styles.body}>Tags: {task.tags.join(', ')}</Text> : null}
        </View>
      </View>

      <View style={styles.metricsRow}>
        <Metric label="Spent" value={formatDuration(trackedSeconds)} />
        <Metric
          label="Target"
          value={targetSeconds === null ? 'Free task' : formatMinutes(Math.floor(targetSeconds / 60))}
        />
        <Metric label="Status" value={isComplete ? 'Fulfilled' : 'In progress'} />
      </View>

      {progress !== null ? (
        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.body}>{Math.round(progress)}%</Text>
        </View>
      ) : null}

      {extra > 0 ? <Text style={styles.body}>Extra time: {formatDuration(extra)}</Text> : null}

      <View style={styles.actions}>
        <ActionButton label={isRunning ? 'Stop Timer' : 'Start Timer'} onPress={onStartStop} strong />
        <ActionButton label="Edit" onPress={onEdit} />
        <ActionButton label="Delete" onPress={onDelete} tone="danger" />
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.body}>{label}</Text>
      <Text style={[styles.body, styles.strong]}>{value}</Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  strong,
  tone,
}: {
  label: string;
  onPress: () => void;
  strong?: boolean;
  tone?: 'danger';
}) {
  const backgroundColor = tone === 'danger' ? '#4a1f26' : strong ? '#1f6feb' : '#1f2937';

  return (
    <Pressable onPress={onPress} style={[styles.actionButton, { backgroundColor }]}>
      <Text style={[styles.body, styles.strong]}>{label}</Text>
    </Pressable>
  );
}

export default function TaskScreen() {
  const { loaded, state, createTask, updateTask, deleteTask, toggleTimer, getTaskTrackedSeconds, getTaskTargetSeconds } =
    useAppData();
  const colorScheme = useColorScheme();
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormState>(blankForm);

  const cardTone = colorScheme === 'dark' ? '#0f172a' : '#ffffff';
  const bg = colorScheme === 'dark' ? '#020617' : '#f8fafc';

  const activeTask = useMemo(() => {
    return state.tasks.find((task) => task.id === state.activeTimer?.taskId) ?? null;
  }, [state.tasks, state.activeTimer]);

  function openCreate() {
    setEditTask(null);
    setForm(blankForm);
    setShowModal(true);
  }

  function openEdit(task: Task) {
    setEditTask(task);
    setForm({
      title: task.title,
      notes: task.notes ?? '',
      tagsCsv: task.tags.join(', '),
      cadence: task.cadence,
      targetMinutes: task.targetMinutes?.toString() ?? '',
      preferredTime: task.preferredTime ?? '',
      category: task.category,
    });
    setShowModal(true);
  }

  function submitForm() {
    const title = form.title.trim();
    if (!title) {
      return;
    }

    const tags = form.tagsCsv
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const parsedTarget = Number(form.targetMinutes);
    const target =
      form.cadence === 'free' || !form.targetMinutes.trim() || !Number.isFinite(parsedTarget)
        ? null
        : Math.max(1, parsedTarget);

    if (editTask) {
      updateTask(editTask.id, {
        title,
        notes: form.notes,
        tags,
        cadence: form.cadence,
        targetMinutes: target,
        preferredTime: form.preferredTime,
        category: form.category,
      });
    } else {
      createTask({
        title,
        notes: form.notes,
        tags,
        cadence: form.cadence,
        targetMinutes: target,
        preferredTime: form.preferredTime,
        category: form.category,
      });
    }

    setShowModal(false);
    setEditTask(null);
    setForm(blankForm);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>HOURS</Text>
          <Text style={styles.heroTitle}>Promises to yourself, measured honestly.</Text>
          <Text style={styles.body}>
            Create daily, weekly, monthly, or free tasks. Run a timer when you begin and track whether your commitment was fulfilled.
          </Text>
        </View>

        <View style={[styles.panel, { backgroundColor: cardTone }]}>
          <Text style={[styles.body, styles.strong]}>Live timer</Text>
          <Text style={styles.body}>
            {activeTask
              ? `Running: ${activeTask.title} (since ${new Date(state.activeTimer!.startedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })})`
              : 'No active timer'}
          </Text>
          <View style={styles.actions}>
            <ActionButton label="Add Task" onPress={openCreate} strong />
            {activeTask ? <ActionButton label="Stop Current" onPress={() => toggleTimer(activeTask.id)} /> : null}
          </View>
        </View>

        {!loaded ? <Text style={styles.body}>Loading your data...</Text> : null}

        {state.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isRunning={state.activeTimer?.taskId === task.id}
            trackedSeconds={getTaskTrackedSeconds(task)}
            targetSeconds={getTaskTargetSeconds(task)}
            onStartStop={() => toggleTimer(task.id)}
            onEdit={() => openEdit(task)}
            onDelete={() => deleteTask(task.id)}
          />
        ))}

        {loaded && state.tasks.length === 0 ? (
          <View style={[styles.panel, { backgroundColor: cardTone }]}>
            <Text style={[styles.body, styles.strong]}>No tasks yet</Text>
            <Text style={styles.body}>Create your first commitment and start tracking time.</Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.heroTitle}>{editTask ? 'Edit Task' : 'Create Task'}</Text>

            <Label text="Title" />
            <Input value={form.title} onChangeText={(value) => setForm((prev) => ({ ...prev, title: value }))} />

            <Label text="Notes" />
            <Input
              value={form.notes}
              multiline
              onChangeText={(value) => setForm((prev) => ({ ...prev, notes: value }))}
            />

            <Label text="Tags (comma separated)" />
            <Input
              value={form.tagsCsv}
              onChangeText={(value) => setForm((prev) => ({ ...prev, tagsCsv: value }))}
            />

            <Label text="Cadence" />
            <View style={styles.pillsWrap}>
              {cadenceOptions.map((option) => (
                <Pill
                  key={option}
                  active={form.cadence === option}
                  label={option}
                  onPress={() => setForm((prev) => ({ ...prev, cadence: option }))}
                />
              ))}
            </View>

            {form.cadence !== 'free' ? (
              <>
                <Label text="Target minutes" />
                <Input
                  keyboardType="number-pad"
                  value={form.targetMinutes}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, targetMinutes: value }))}
                />
              </>
            ) : null}

            <Label text="Preferred time (for example 7:30 PM)" />
            <Input
              value={form.preferredTime}
              onChangeText={(value) => setForm((prev) => ({ ...prev, preferredTime: value }))}
            />

            <Label text="Category" />
            <View style={styles.pillsWrap}>
              {categoryOptions.map((option) => (
                <Pill
                  key={option}
                  active={form.category === option}
                  label={option}
                  onPress={() => setForm((prev) => ({ ...prev, category: option }))}
                />
              ))}
            </View>

            <View style={styles.actions}>
              <ActionButton label={editTask ? 'Save' : 'Create'} onPress={submitForm} strong />
              <ActionButton label="Cancel" onPress={() => setShowModal(false)} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={[styles.body, styles.strong]}>{text}</Text>;
}

function Input({
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: 'number-pad';
}) {
  return (
    <TextInput
      style={[styles.input, multiline ? styles.inputMultiline : null]}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      keyboardType={keyboardType}
    />
  );
}

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active ? styles.pillActive : null]}>
      <Text style={[styles.body, styles.strong]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 80,
  },
  hero: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#0f172a',
    gap: 8,
  },
  heroKicker: {
    color: '#93c5fd',
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
  },
  panel: {
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  card: {
    borderRadius: 18,
    padding: 14,
    gap: 10,
    backgroundColor: '#111827',
  },
  rowSpace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#1f2937',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  body: {
    color: '#e5e7eb',
    fontSize: 14,
  },
  strong: {
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    borderRadius: 10,
    padding: 8,
    backgroundColor: '#1f2937',
    gap: 4,
  },
  progressWrap: {
    gap: 6,
  },
  progressBg: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#334155',
  },
  progressFill: {
    height: 8,
    backgroundColor: '#22c55e',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalContent: {
    padding: 16,
    gap: 8,
    paddingBottom: 80,
  },
  input: {
    backgroundColor: '#111827',
    color: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1f2937',
  },
  pillActive: {
    backgroundColor: '#1d4ed8',
  },
});
