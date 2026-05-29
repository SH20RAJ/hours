"use client";

import { useMemo, useState } from "react";
import { subDays, startOfDay } from "date-fns";
import {
  Fingerprint,
  Sparkles,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IdentityScoreRing } from "@/components/dashboard/identity-score-ring";

import { useDataStore } from "@/lib/stores/data-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import {
  getIdentityBreakdown,
  getSessionsInRange,
  getTotalDuration,
  getSessionsForWeek,
  calculateFutureSelfAlignment,
  weeklySummaryLine,
} from "@/lib/analytics";
import { formatDuration, msToHours, round } from "@/lib/utils";
import Link from "next/link";

type Range = "today" | "week" | "all";

export default function IdentityPage() {
  const hydrated = useHydrated();
  const sessions = useDataStore((s) => s.sessions);
  const categories = useDataStore((s) => s.categories);
  const settings = useDataStore((s) => s.settings);

  const [range, setRange] = useState<Range>("week");

  const data = useMemo(() => {
    const now = new Date();
    let scoped = sessions;
    if (range === "today") {
      scoped = getSessionsInRange(sessions, startOfDay(now), now);
    } else if (range === "week") {
      scoped = getSessionsInRange(sessions, startOfDay(subDays(now, 6)), now);
    }

    const breakdown = getIdentityBreakdown(scoped, categories);
    const alignment = calculateFutureSelfAlignment(
      breakdown,
      settings.desiredIdentities,
    );

    // Build actual-vs-desired comparison rows.
    const desiredTotal = settings.desiredIdentities.reduce(
      (sum, d) => sum + d.targetPercentage,
      0,
    );
    const comparison = settings.desiredIdentities
      .map((d) => {
        const actual = breakdown.find((b) => b.identity === d.identity);
        const target =
          desiredTotal > 0 ? (d.targetPercentage / desiredTotal) * 100 : 0;
        const actualPct = actual?.percentage ?? 0;
        return {
          identity: d.identity,
          target: round(target),
          actual: round(actualPct),
          delta: round(actualPct - target),
          color: actual?.color ?? "#6b7280",
        };
      })
      .sort((a, b) => b.target - a.target);

    const weekSessions = getSessionsForWeek(sessions, now, settings.weekStartsOn);
    return {
      breakdown,
      alignment,
      comparison,
      total: getTotalDuration(scoped),
      summary: weeklySummaryLine(weekSessions, categories),
    };
  }, [sessions, categories, settings, range]);

  if (!hydrated) return <IdentitySkeleton />;

  if (sessions.length === 0) {
    return (
      <div className="space-y-5">
        <Header />
        <EmptyState
          icon={Fingerprint}
          title="Your identity takes shape here"
          description="As you track time, Hours translates your hours into identity signals — Developer, Founder, Athlete — and shows how close you are to who you want to become."
        />
      </div>
    );
  }

  const topIdentity = data.breakdown[0];

  return (
    <div className="space-y-5">
      <Header />

      <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This week</TabsTrigger>
          <TabsTrigger value="all">All time</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Alignment hero */}
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-center sm:gap-8">
          <IdentityScoreRing
            score={data.alignment}
            label="Alignment"
            sublabel="Future-self score"
            size={150}
          />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-semibold">
              {topIdentity
                ? `You're living mostly as a ${topIdentity.identity}`
                : "No time tracked in this range"}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {alignmentMessage(data.alignment)}
            </p>
            {topIdentity && (
              <p className="mt-3 text-sm">
                <span className="font-medium">{round(topIdentity.percentage)}%</span>{" "}
                of your time · {formatDuration(topIdentity.durationMs)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {data.breakdown.length === 0 ? (
        <EmptyState
          icon={Fingerprint}
          title="Nothing tracked in this range"
          description="Switch ranges or track a session to see your identity mix."
        />
      ) : (
        <>
          {/* Identity breakdown bars */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Identity signals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {data.breakdown.map((b) => (
                <div key={b.identity} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{b.identity}</span>
                    <span className="tabular text-muted-foreground">
                      {round(b.percentage)}% · {formatDuration(b.durationMs)}
                    </span>
                  </div>
                  <Progress value={b.percentage} color={b.color} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actual vs desired */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Actual vs future self</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/settings">
                  <Target className="h-4 w-4" />
                  Edit mix
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {data.comparison.map((c) => (
                <div key={c.identity} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.identity}</span>
                    <span className="flex items-center gap-2">
                      <span className="tabular text-muted-foreground">
                        {c.actual}% / {c.target}%
                      </span>
                      <DeltaChip delta={c.delta} />
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={c.actual} color={c.color} />
                    {/* Target marker */}
                    <span
                      className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded bg-foreground/70"
                      style={{ left: `${Math.min(c.target, 100)}%` }}
                      aria-hidden
                    />
                  </div>
                </div>
              ))}
              <p className="pt-1 text-xs text-muted-foreground">
                The marker shows your target. Bars past it mean you&apos;re ahead;
                short of it means there&apos;s room to grow.
              </p>
            </CardContent>
          </Card>

          {/* Weekly review */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Weekly review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[0.95rem] leading-relaxed">{data.summary}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Header() {
  return (
    <header>
      <h1 className="hidden text-2xl font-bold tracking-tight lg:block">Identity</h1>
      <p className="text-sm text-muted-foreground lg:mt-0.5">
        Who your hours are turning you into.
      </p>
    </header>
  );
}

function DeltaChip({ delta }: { delta: number }) {
  if (Math.abs(delta) < 1) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        on track
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${
        up ? "text-success" : "text-warning"
      }`}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}
      {delta}%
    </span>
  );
}

function alignmentMessage(score: number): string {
  if (score >= 80) return "You're closely living the life you set out to. Keep going.";
  if (score >= 60) return "You're well aligned with your future self, with a little room to fine-tune.";
  if (score >= 40) return "You're partway there. A few intentional shifts will close the gap.";
  if (score >= 20) return "Your time and your intentions are drifting apart. Small changes compound.";
  return "There's a real gap between how you spend time and who you want to be. Start with one block.";
}

function IdentitySkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-64 rounded-xl" />
      <Skeleton className="h-44 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
