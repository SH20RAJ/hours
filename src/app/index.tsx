import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
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

function getCategoryBadgeStyle(category: TaskCategory, isDark: boolean) {
  return {
    backgroundColor:
      category === 'good' ? (isDark ? '#064e3b' : '#dcfce7') : category === 'bad' ? (isDark ? '#7f1d1d' : '#fee2e2') : (isDark ? '#334155' : '#f1f5f9'),
  };
}

function getCategoryTextColor(category: TaskCategory, isDark: boolean) {
  return category === 'good' ? (isDark ? '#a7f3d0' : '#166534') : category === 'bad' ? (isDark ? '#fecaca' : '#991b1b') : (isDark ? '#cbd5e1' : '#475569');
}

function TaskCard({
  task,
  isRunning,
  trackedSeconds,
  targetSeconds,
  onStartStop,
  onEdit,
  onDelete,
  isDark,
}: {
  task: Task;
  isRunning: boolean;
  trackedSeconds: number;
  targetSeconds: number | null;
  onStartStop: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDark: boolean;
}) {
  const progress = targetSeconds ? Math.min(100, (trackedSeconds / targetSeconds) * 100) : null;
  const extra = targetSeconds ? Math.max(0, trackedSeconds - targetSeconds) : 0;
  const isComplete = targetSeconds ? trackedSeconds >= targetSeconds : false;

  const cardStyle = [styles.card, isDark ? styles.cardDark : styles.cardLight];
  const textTitle = [styles.heading, isDark ? styles.textDark : styles.textLight];
  const textSub = [styles.body, isDark ? styles.subtextDark : styles.subtextLight];
  const metricBox = [styles.metricCard, isDark ? styles.metricDark : styles.metricLight];

  return (
    <View style={cardStyle}>
      <View style={styles.rowSpace}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <View style={[styles.badge, isDark ? styles.badgeDark : styles.badgeLight]}>
              <Text style={[styles.badgeText, isDark ? styles.subtextDark : styles.subtextLight]}>{task.cadence.toUpperCase()}</Text>
            </View>
            <View style={[styles.badge, getCategoryBadgeStyle(task.category, isDark)]}>
              <Text style={[styles.badgeText, { color: getCategoryTextColor(task.category, isDark) }]}>{task.category.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={textTitle}>{task.title}</Text>
          {task.notes ? <Text style={textSub}>{task.notes}</Text> : null}
          {task.preferredTime ? <Text style={textSub}>Do at: {task.preferredTime}</Text> : null}
          {task.tags.length > 0 ? <Text style={textSub}>Tags: {task.tags.join(', ')}</Text> : null}
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={metricBox}>
          <Text style={textSub}>Spent</Text>
          <Text style={[textSub, styles.strong]}>{formatDuration(trackedSeconds)}</Text>
        </View>
        <View style={metricBox}>
          <Text style={textSub}>Target</Text>
          <Text style={[textSub, styles.strong]}>{targetSeconds === null ? 'Free' : formatMinutes(Math.floor(targetSeconds / 60))}</Text>
        </View>
        <View style={metricBox}>
          <Text style={textSub}>Status</Text>
          <Text style={[textSub, styles.strong]}>{isComplete ? 'Fulfilled' : 'In progress'}</Text>
        </View>
      </View>

      {progress !== null ? (
        <View style={styles.progressWrap}>
          <View style={[styles.progressBg, isDark ? styles.progressBgDark : styles.progressBgLight]}>
            <View style={[styles.progressFill, { width: `${progress}%` }, isComplete ? styles.progressComplete : null]} />
          </View>
          <Text style={textSub}>{Math.round(progress)}%</Text>
        </View>
      ) : null}

      {extra > 0 ? <Text style={[styles.body, { color: isDark ? '#4ade80' : '#16a34a' }]}>Extra time: {formatDuration(extra)}</Text> : null}

      <View style={styles.actions}>
        <ActionButton label={isRunning ? 'Stop Timer' : 'Start Timer'} onPress={onStartStop} strong isDark={isDark} />
        <ActionButton label="Edit" onPress={onEdit} isDark={isDark} />
        <ActionButton label="Delete" onPress={onDelete} tone="danger" isDark={isDark} />
      </View>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  strong,
  tone,
  isDark,
}: {
  label: string;
  onPress: () => void;
  strong?: boolean;
  tone?: 'danger';
  isDark: boolean;
}) {
  let bg = isDark ? '#334155' : '#f1f5f9';
  let tColor = isDark ? '#f8fafc' : '#0f172a';

  if (strong) {
    bg = isDark ? '#e2e8f0' : '#0f172a';
    tColor = isDark ? '#0f172a' : '#f8fafc';
  } else if (tone === 'danger') {
    bg = isDark ? '#7f1d1d' : '#fee2e2';
    tColor = isDark ? '#fecaca' : '#991b1b';
  }

  return (
    <Pressable onPress={onPress} style={[styles.actionButton, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: tColor }]}>{label}</Text>
    </Pressable>
  );
}

export default function TaskScreen() {
  const { loaded, state, createTask, updateTask, deleteTask, toggleTimer, getTaskTrackedSeconds, getTaskTargetSeconds } =
    useAppData();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormState>(blankForm);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date());

  const bg = isDark ? '#000000' : '#f8fafc';
  const textTitle = [styles.heroTitle, isDark ? styles.textDark : styles.textLight];
  const textSub = [styles.body, isDark ? styles.subtextDark : styles.subtextLight];
  const panelStyling = [styles.panel, isDark ? styles.panelDark : styles.panelLight];

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

  const onChangeTime = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selectedDate) {
      setDateObj(selectedDate);
      const timeString = selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setForm((prev) => ({ ...prev, preferredTime: timeString }));
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={panelStyling}>
          <Text style={[styles.body, styles.strong, isDark ? styles.textDark : styles.textLight]}>Live timer</Text>
          <Text style={textSub}>
            {activeTask
              ? `Running: ${activeTask.title} (since ${new Date(state.activeTimer!.startedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })})`
              : 'No active timer'}
          </Text>
          <View style={styles.actions}>
            <ActionButton label={activeTask ? 'Add New' : 'Create Task'} onPress={openCreate} strong isDark={isDark} />
            {activeTask ? <ActionButton label="Stop Current" onPress={() => toggleTimer(activeTask.id)} isDark={isDark} /> : null}
          </View>
        </View>

        {!loaded ? <Text style={textSub}>Loading your data...</Text> : null}

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
            isDark={isDark}
          />
        ))}

        {loaded && state.tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={textTitle}>Welcome to Hours.</Text>
            <Text style={[textSub, { textAlign: 'center' }]}>Create your first commitment and start tracking time honestly.</Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)} presentationStyle="pageSheet">
        <View style={[styles.safe, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
          <View style={[styles.modalHeader, isDark ? styles.modalHeaderDark : styles.modalHeaderLight]}>
            <Text style={[styles.heroTitle, isDark ? styles.textDark : styles.textLight]}>{editTask ? 'Edit Task' : 'New Task'}</Text>
            <Pressable onPress={() => setShowModal(false)} style={styles.closeBtn}>
              <Text style={[styles.body, styles.strong, isDark ? styles.textDark : styles.textLight]}>Close</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            
            <Label text="Title" isDark={isDark} />
            <Input value={form.title} onChangeText={(value) => setForm((prev) => ({ ...prev, title: value }))} isDark={isDark} />

            <Label text="Notes (optional)" isDark={isDark} />
            <Input
              value={form.notes}
              multiline
              onChangeText={(value) => setForm((prev) => ({ ...prev, notes: value }))}
              isDark={isDark}
            />

            <Label text="Tags (comma separated)" isDark={isDark} />
            <Input
              value={form.tagsCsv}
              onChangeText={(value) => setForm((prev) => ({ ...prev, tagsCsv: value }))}
              isDark={isDark}
            />

            <Label text="Cadence" isDark={isDark} />
            <View style={styles.pillsWrap}>
              {cadenceOptions.map((option) => (
                <Pill
                  key={option}
                  active={form.cadence === option}
                  label={option}
                  onPress={() => setForm((prev) => ({ ...prev, cadence: option }))}
                  isDark={isDark}
                />
              ))}
            </View>

            {form.cadence !== 'free' ? (
              <>
                <Label text="Target minutes" isDark={isDark} />
                <Input
                  keyboardType="number-pad"
                  value={form.targetMinutes}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, targetMinutes: value }))}
                  isDark={isDark}
                />
              </>
            ) : null}

            <Label text="Preferred time" isDark={isDark} />
            <View style={styles.timePickerRow}>
              <Input
                value={form.preferredTime}
                onChangeText={(value) => setForm((prev) => ({ ...prev, preferredTime: value }))}
                isDark={isDark}
                placeholder="e.g. 7:30 PM"
                style={{ flex: 1 }}
              />
              <Pressable onPress={() => setShowTimePicker(true)} style={[styles.pill, isDark ? styles.pillDark : styles.pillLight]}>
                <Text style={[styles.badgeText, isDark ? styles.textDark : styles.textLight]}>Pick Time</Text>
              </Pressable>
            </View>
            {Platform.OS === 'ios' && showTimePicker && (
               <DateTimePicker
                 value={dateObj}
                 mode="time"
                 display="default"
                 onChange={onChangeTime}
                 themeVariant={isDark ? 'dark' : 'light'}
               />
            )}
            {Platform.OS !== 'ios' && showTimePicker && (
                <DateTimePicker
                  value={dateObj}
                  mode="time"
                  display="default"
                  onChange={onChangeTime}
                />
            )}

            <Label text="Category" isDark={isDark} />
            <View style={styles.pillsWrap}>
              {categoryOptions.map((option) => (
                <Pill
                  key={option}
                  active={form.category === option}
                  label={option}
                  onPress={() => setForm((prev) => ({ ...prev, category: option }))}
                  isDark={isDark}
                />
              ))}
            </View>

            <View style={[styles.actions, { marginTop: 20 }]}>
              <ActionButton label={editTask ? 'Save Changes' : 'Create Task'} onPress={submitForm} strong isDark={isDark} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Label({ text, isDark }: { text: string; isDark: boolean }) {
  return <Text style={[styles.label, isDark ? styles.textDark : styles.textLight]}>{text}</Text>;
}

function Input({
  value,
  onChangeText,
  multiline,
  keyboardType,
  isDark,
  placeholder,
  style
}: {
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: 'number-pad';
  isDark: boolean;
  placeholder?: string;
  style?: object;
}) {
  return (
    <TextInput
      style={[
        styles.input,
        isDark ? styles.inputDark : styles.inputLight,
        multiline ? styles.inputMultiline : null,
        style
      ]}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      keyboardType={keyboardType}
      placeholder={placeholder}
      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
    />
  );
}

function Pill({
  label,
  active,
  onPress,
  isDark,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  isDark: boolean;
}) {
  const bgActive = isDark ? '#e2e8f0' : '#0f172a';
  const textActive = isDark ? '#0f172a' : '#f8fafc';
  const bgInactive = isDark ? '#334155' : '#f1f5f9';
  const textInactive = isDark ? '#cbd5e1' : '#475569';

  return (
    <Pressable onPress={onPress} style={[styles.pill, { backgroundColor: active ? bgActive : bgInactive }]}>
      <Text style={[styles.badgeText, { color: active ? textActive : textInactive }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    gap: 16,
    paddingBottom: 80,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 8,
  },
  panel: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
  },
  panelDark: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
  },
  panelLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  cardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
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
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeDark: {
    backgroundColor: '#334155',
  },
  badgeLight: {
    backgroundColor: '#f1f5f9',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  textDark: { color: '#f8fafc' },
  textLight: { color: '#0f172a' },
  subtextDark: { color: '#94a3b8' },
  subtextLight: { color: '#64748b' },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  strong: {
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    gap: 2,
    borderWidth: 1,
  },
  metricDark: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
  },
  metricLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  progressWrap: {
    gap: 8,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBgDark: { backgroundColor: '#1e293b' },
  progressBgLight: { backgroundColor: '#e2e8f0' },
  progressFill: {
    height: 6,
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  progressComplete: {
    backgroundColor: '#10b981',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalHeaderDark: {
    borderColor: '#1e293b',
  },
  modalHeaderLight: {
    borderColor: '#e2e8f0',
  },
  closeBtn: {
    padding: 8,
  },
  modalContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 80,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  inputDark: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
    color: '#f8fafc',
  },
  inputLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    color: '#0f172a',
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillDark: { backgroundColor: '#1e293b' },
  pillLight: { backgroundColor: '#e2e8f0' },
  timePickerRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
});
