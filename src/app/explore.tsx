import React from 'react';
import { ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppData } from '@/state/tasks-context';
import { formatDuration } from '@/utils/time';

import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Divider } from '@/components/ui/divider';

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <Box className="px-4 py-3 bg-background-50 dark:bg-background-950 rounded-xl border border-outline-100 dark:border-outline-800">
      <VStack space="xs">
        <Text size="sm" className="font-bold text-primary-500 dark:text-primary-400">{title}</Text>
        <Heading size="lg">{value}</Heading>
        {subtitle ? <Text size="xs" className="text-typography-500 dark:text-typography-400">{subtitle}</Text> : null}
      </VStack>
    </Box>
  );
}

export default function AnalyticsScreen() {
  const { state, getDailyTrackedSeconds, getWeeklyTrackedSeconds, getWeeklyImprovementPercent, getTaskTrackedSeconds, getTaskTargetSeconds } =
    useAppData();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const dailyTracked = getDailyTrackedSeconds();
  const weeklyTracked = getWeeklyTrackedSeconds();
  const weeklyGood = getWeeklyTrackedSeconds('good');
  const weeklyBad = getWeeklyTrackedSeconds('bad');
  const weeklyImprovement = getWeeklyImprovementPercent();
  const unrecognizedToday = Math.max(0, 86400 - dailyTracked);

  const fulfilled = state.tasks.filter((task) => {
    const target = getTaskTargetSeconds(task);
    if (target === null) {
      return false;
    }
    return getTaskTrackedSeconds(task) >= target;
  }).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 14 }}>
        
        <Box className="p-4 rounded-xl bg-background-0 dark:bg-background-900 border border-outline-200 dark:border-outline-800">
          <VStack space="sm">
            <Text size="xs" className="font-bold text-info-500 tracking-[1px]">ANALYTICS</Text>
            <Heading size="xl">Where your time really went.</Heading>
            <Text size="sm" className="text-typography-500 dark:text-typography-400">
              Track commitment fulfillment, category split, and your weekly improvement trend.
            </Text>
          </VStack>
        </Box>

        <VStack space="md">
          <StatCard title="Tracked Today" value={formatDuration(dailyTracked)} />
          <StatCard title="Tracked This Week" value={formatDuration(weeklyTracked)} />
          <StatCard title="Unrecognized Today" value={formatDuration(unrecognizedToday)} />
          <StatCard
            title="Weekly Improvement"
            value={
              weeklyImprovement === null
                ? 'Not enough data'
                : `${weeklyImprovement >= 0 ? '+' : ''}${weeklyImprovement.toFixed(1)}%`
            }
            subtitle="Compared with last week"
          />
          <StatCard title="Good Time (Week)" value={formatDuration(weeklyGood)} />
          <StatCard title="Bad Time (Week)" value={formatDuration(weeklyBad)} />
          <StatCard
            title="Promises Fulfilled"
            value={`${fulfilled} / ${state.tasks.filter((task) => task.targetMinutes !== null).length}`}
            subtitle="Current cadence window"
          />
        </VStack>

        <Box className="p-4 rounded-xl bg-background-0 dark:bg-background-900 border border-outline-200 dark:border-outline-800 mt-2">
          <VStack space="md">
            <Heading size="md">Task Breakdown</Heading>
            <Divider />
            {state.tasks.map((task, index) => {
              const tracked = getTaskTrackedSeconds(task);
              const target = getTaskTargetSeconds(task);
              const extra = target ? Math.max(0, tracked - target) : 0;
              return (
                <VStack key={task.id} space="sm">
                  <HStack className="justify-between items-center">
                    <VStack space="xs" className="flex-1">
                      <Text className="font-bold text-typography-900 dark:text-typography-100">{task.title}</Text>
                      <Text size="xs" className="uppercase text-typography-500 dark:text-typography-400">{task.cadence} cadence</Text>
                    </VStack>
                    <VStack space="xs" className="items-end">
                      <Text className="font-bold">{formatDuration(tracked)}</Text>
                      {extra > 0 ? <Text size="xs" className="text-success-500 dark:text-success-400">+{formatDuration(extra)} extra</Text> : null}
                    </VStack>
                  </HStack>
                  {index < state.tasks.length - 1 ? <Divider /> : null}
                </VStack>
              );
            })}

            {state.tasks.length === 0 ? <Text size="sm" className="text-typography-500 dark:text-typography-400">No tasks yet.</Text> : null}
          </VStack>
        </Box>
        
      </ScrollView>
    </SafeAreaView>
  );
}
