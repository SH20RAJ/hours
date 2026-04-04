import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppData } from '@/state/tasks-context';
import type { Cadence, Task, TaskCategory } from '@/types/tasks';
import { formatDuration, formatMinutes } from '@/utils/time';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter } from '@/components/ui/modal';
import { CloseIcon, Icon } from '@/components/ui/icon';
import { Center } from '@/components/ui/center';
import { Divider } from '@/components/ui/divider';

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

function getCategoryBadgeAction(category: TaskCategory): "success" | "error" | "info" {
  if (category === 'good') return 'success';
  if (category === 'bad') return 'error';
  return 'info';
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

  return (
    <Box className="rounded-2xl border border-outline-200 dark:border-outline-800 bg-background-0 dark:bg-background-900 p-4">
      <VStack space="md">
        <HStack className="justify-between items-start">
          <VStack space="sm" className="flex-1">
            <HStack space="sm">
              <Badge action="info" variant="solid" className="rounded-md">
                <BadgeText className="uppercase">{task.cadence}</BadgeText>
              </Badge>
              <Badge action={getCategoryBadgeAction(task.category)} variant="solid" className="rounded-md">
                <BadgeText className="uppercase">{task.category}</BadgeText>
              </Badge>
            </HStack>
            <Heading size="lg">{task.title}</Heading>
            {task.notes ? <Text size="sm" className="text-typography-500 dark:text-typography-400">{task.notes}</Text> : null}
            {task.preferredTime ? <Text size="sm" className="text-typography-500 dark:text-typography-400">Do at: {task.preferredTime}</Text> : null}
            {task.tags.length > 0 ? <Text size="sm" className="text-typography-500 dark:text-typography-400">Tags: {task.tags.join(', ')}</Text> : null}
          </VStack>
        </HStack>

        <HStack space="md" className="mt-2 text-typography-700">
          <Box className="flex-1 bg-background-50 dark:bg-background-950 p-2 rounded-md border border-outline-100 dark:border-outline-800">
            <Text size="xs" className="text-typography-500 dark:text-typography-400">Spent</Text>
            <Text size="sm" className="font-bold">{formatDuration(trackedSeconds)}</Text>
          </Box>
          <Box className="flex-1 bg-background-50 dark:bg-background-950 p-2 rounded-md border border-outline-100 dark:border-outline-800">
            <Text size="xs" className="text-typography-500 dark:text-typography-400">Target</Text>
            <Text size="sm" className="font-bold">{targetSeconds === null ? 'Free' : formatMinutes(Math.floor(targetSeconds / 60))}</Text>
          </Box>
          <Box className="flex-1 bg-background-50 dark:bg-background-950 p-2 rounded-md border border-outline-100 dark:border-outline-800">
            <Text size="xs" className="text-typography-500 dark:text-typography-400">Status</Text>
            <Text size="sm" className="font-bold">{isComplete ? 'Fulfilled' : 'In progress'}</Text>
          </Box>
        </HStack>

        {progress !== null ? (
          <VStack space="xs">
            <Progress value={progress} size="md" className="w-full">
              <ProgressFilledTrack className={isComplete ? 'bg-success-500' : 'bg-info-500'} />
            </Progress>
            <Text size="xs" className="text-typography-500 dark:text-typography-400">{Math.round(progress)}%</Text>
          </VStack>
        ) : null}

        {extra > 0 ? <Text size="sm" className="text-success-500 dark:text-success-400">Extra time: {formatDuration(extra)}</Text> : null}

        <Divider className="my-1" />

        <HStack space="md" className="flex-wrap">
          <Button size="sm" variant={isRunning ? 'solid' : 'outline'} onPress={onStartStop}>
            <ButtonText>{isRunning ? 'Stop Timer' : 'Start Timer'}</ButtonText>
          </Button>
          <Button size="sm" variant="outline" action="secondary" onPress={onEdit}>
            <ButtonText>Edit</ButtonText>
          </Button>
          <Button size="sm" variant="outline" action="negative" onPress={onDelete}>
            <ButtonText>Delete</ButtonText>
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

export default function TaskScreen() {
  const { loaded, state, createTask, updateTask, deleteTask, toggleTimer, getTaskTrackedSeconds, getTaskTargetSeconds } = useAppData();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormState>(blankForm);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date());

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
    if (!title) return;

    const tags = form.tagsCsv.split(',').map((tag) => tag.trim()).filter(Boolean);
    const parsedTarget = Number(form.targetMinutes);
    const target = form.cadence === 'free' || !form.targetMinutes.trim() || !Number.isFinite(parsedTarget) ? null : Math.max(1, parsedTarget);

    if (editTask) {
      updateTask(editTask.id, {
        title, notes: form.notes, tags, cadence: form.cadence, targetMinutes: target, preferredTime: form.preferredTime, category: form.category,
      });
    } else {
      createTask({
        title, notes: form.notes, tags, cadence: form.cadence, targetMinutes: target, preferredTime: form.preferredTime, category: form.category,
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
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 16 }}>
        <Box className="rounded-2xl border border-outline-200 dark:border-outline-800 bg-background-0 dark:bg-background-900 p-4">
          <VStack space="sm">
            <Heading size="md">Live timer</Heading>
            <Text size="sm" className="text-typography-500 dark:text-typography-400">
              {activeTask
                ? `Running: ${activeTask.title} (since ${new Date(state.activeTimer!.startedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })})`
                : 'No active timer'}
            </Text>
            <HStack space="md" className="mt-2">
              <Button size="sm" onPress={openCreate}>
                <ButtonText>{activeTask ? 'Add New' : 'Create Task'}</ButtonText>
              </Button>
              {activeTask ? (
                <Button size="sm" action="negative" variant="outline" onPress={() => toggleTimer(activeTask.id)}>
                  <ButtonText>Stop Current</ButtonText>
                </Button>
              ) : null}
            </HStack>
          </VStack>
        </Box>

        {!loaded ? <Text className="text-center mt-4">Loading your data...</Text> : null}

        <VStack space="lg">
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
        </VStack>

        {loaded && state.tasks.length === 0 ? (
          <Center className="py-10">
            <Heading size="xl">Welcome to Hours.</Heading>
            <Text className="text-center mt-2 text-typography-500 dark:text-typography-400">
              Create your first commitment and start tracking time honestly.
            </Text>
          </Center>
        ) : null}
      </ScrollView>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="lg">
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="lg">{editTask ? 'Edit Task' : 'New Task'}</Heading>
            <ModalCloseButton>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <VStack space="md" className="pb-4">
              
              <VStack space="xs">
                <Text size="sm" className="font-bold">Title</Text>
                <Input size="md">
                  <InputField value={form.title} onChangeText={(val) => setForm(p => ({ ...p, title: val }))} />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text size="sm" className="font-bold">Notes (optional)</Text>
                <Textarea size="md">
                  <TextareaInput value={form.notes} onChangeText={(val) => setForm(p => ({ ...p, notes: val }))} />
                </Textarea>
              </VStack>

              <VStack space="xs">
                <Text size="sm" className="font-bold">Tags (comma separated)</Text>
                <Input size="md">
                  <InputField value={form.tagsCsv} onChangeText={(val) => setForm(p => ({ ...p, tagsCsv: val }))} />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text size="sm" className="font-bold">Cadence</Text>
                <HStack space="md" className="flex-wrap">
                  {cadenceOptions.map((opt) => (
                    <Button key={opt} size="sm" variant={form.cadence === opt ? 'solid' : 'outline'} onPress={() => setForm(p => ({ ...p, cadence: opt }))}>
                      <ButtonText>{opt}</ButtonText>
                    </Button>
                  ))}
                </HStack>
              </VStack>

              {form.cadence !== 'free' ? (
                <VStack space="xs">
                  <Text size="sm" className="font-bold">Target minutes</Text>
                  <Input size="md">
                    <InputField keyboardType="number-pad" value={form.targetMinutes} onChangeText={(val) => setForm(p => ({ ...p, targetMinutes: val }))} />
                  </Input>
                </VStack>
              ) : null}

              <VStack space="xs">
                <Text size="sm" className="font-bold">Preferred time</Text>
                <HStack space="md" className="items-center">
                  <Box className="flex-1">
                    <Input size="md">
                      <InputField placeholder="e.g. 7:30 PM" value={form.preferredTime} onChangeText={(val) => setForm(p => ({ ...p, preferredTime: val }))} />
                    </Input>
                  </Box>
                  <Button size="sm" action="secondary" onPress={() => setShowTimePicker(true)}>
                    <ButtonText>Pick Time</ButtonText>
                  </Button>
                </HStack>
                {Platform.OS === 'ios' && showTimePicker && (
                  <DateTimePicker value={dateObj} mode="time" display="default" onChange={onChangeTime} themeVariant={isDark ? 'dark' : 'light'} />
                )}
                {Platform.OS !== 'ios' && showTimePicker && (
                  <DateTimePicker value={dateObj} mode="time" display="default" onChange={onChangeTime} />
                )}
              </VStack>

              <VStack space="xs">
                <Text size="sm" className="font-bold">Category</Text>
                <HStack space="md" className="flex-wrap">
                  {categoryOptions.map((opt) => (
                    <Button key={opt} size="sm" variant={form.category === opt ? 'solid' : 'outline'} onPress={() => setForm(p => ({ ...p, category: opt }))}>
                      <ButtonText>{opt}</ButtonText>
                    </Button>
                  ))}
                </HStack>
              </VStack>

            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" action="secondary" className="mr-3" onPress={() => setShowModal(false)}>
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button onPress={submitForm}>
              <ButtonText>{editTask ? 'Save Changes' : 'Create Task'}</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </SafeAreaView>
  );
}
