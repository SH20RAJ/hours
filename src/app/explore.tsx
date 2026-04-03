import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppData } from '@/state/tasks-context';
import { formatDuration } from '@/utils/time';

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export default function AnalyticsScreen() {
  const { state, getDailyTrackedSeconds, getWeeklyTrackedSeconds, getWeeklyImprovementPercent, getTaskTrackedSeconds, getTaskTargetSeconds } =
    useAppData();

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
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>ANALYTICS</Text>
          <Text style={styles.heroTitle}>Where your time really went.</Text>
          <Text style={styles.body}>
            Track commitment fulfillment, category split, and your weekly improvement trend.
          </Text>
        </View>

        <View style={styles.grid}>
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
        </View>

        <View style={styles.listCard}>
          <Text style={styles.listTitle}>Task Breakdown</Text>
          {state.tasks.map((task) => {
            const tracked = getTaskTrackedSeconds(task);
            const target = getTaskTargetSeconds(task);
            const extra = target ? Math.max(0, tracked - target) : 0;
            return (
              <View key={task.id} style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.body}>{task.cadence.toUpperCase()} cadence</Text>
                </View>
                <View style={styles.rightStat}>
                  <Text style={styles.taskValue}>{formatDuration(tracked)}</Text>
                  {extra > 0 ? <Text style={styles.extra}>+{formatDuration(extra)} extra</Text> : null}
                </View>
              </View>
            );
          })}

          {state.tasks.length === 0 ? <Text style={styles.body}>No tasks yet.</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 80,
  },
  hero: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#0f172a',
    gap: 8,
  },
  kicker: {
    color: '#38bdf8',
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
  },
  body: {
    color: '#cbd5e1',
  },
  grid: {
    gap: 10,
  },
  statCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  statTitle: {
    color: '#93c5fd',
    fontWeight: '700',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
  },
  statSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  listCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  listTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 18,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#374151',
    paddingBottom: 8,
  },
  taskTitle: {
    color: '#e2e8f0',
    fontWeight: '600',
  },
  rightStat: {
    alignItems: 'flex-end',
  },
  taskValue: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  extra: {
    color: '#22c55e',
    fontSize: 12,
  },
});
