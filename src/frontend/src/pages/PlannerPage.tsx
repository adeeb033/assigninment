/**
 * PlannerPage — "Today's Focus" AI-generated study plan.
 *
 * Displays:
 *   - Page header with date + "Refresh Plan" button
 *   - Behavioral insight card (if avgProcrastinationDays > 0)
 *   - Ordered task list with PlannerTaskCard components
 *   - Study summary stats (hours, task count, urgency, on-time rate)
 *
 * Layout is provided by the root route — no inline header/navbar here.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import {
  Brain,
  CheckCircle2,
  Clock,
  RefreshCcw,
  Target,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { PlannerTaskCard } from "../components/PlannerTaskCard";
import {
  useApp,
  useAssignmentsWithScores,
  useDailyPlan,
} from "../context/AppContext";
import type { Assignment, UrgencyLevel } from "../types";

// ─── Urgency color classes ────────────────────────────────────────────────────

const URGENCY_CLASSES: Record<UrgencyLevel, string> = {
  critical: "bg-urgency-critical text-urgency-critical border-urgency-critical",
  high: "bg-urgency-high text-urgency-high border-urgency-high",
  medium: "bg-urgency-medium text-urgency-medium border-urgency-medium",
  low: "bg-urgency-low text-urgency-low border-urgency-low",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getTopUrgencyLevel(
  urgencies: (UrgencyLevel | undefined)[],
): UrgencyLevel {
  const order: UrgencyLevel[] = ["critical", "high", "medium", "low"];
  for (const level of order) {
    if (urgencies.includes(level)) return level;
  }
  return "low";
}

function averageCompletionRate(
  ratesByDifficulty: Record<number, number>,
): number {
  const values = Object.values(ratesByDifficulty);
  if (values.length === 0) return 1;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-1 p-4 rounded-xl bg-card border border-border text-center flex-1 min-w-[100px]">
      <div className="text-primary">{icon}</div>
      <div className="text-lg font-display font-bold text-foreground leading-tight">
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PlannerPage() {
  const plan = useDailyPlan();
  const assignments = useAssignmentsWithScores();
  const { state, dispatch } = useApp();

  // Refresh key forces re-render / recomputation
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshKey((k) => k + 1);
      setIsRefreshing(false);
    }, 600);
  };

  const getAssignment = (id: string) => assignments.find((a) => a.id === id);

  const handleMarkInProgress = (assignment: Assignment) => {
    dispatch({
      type: "UPDATE_ASSIGNMENT",
      payload: { ...assignment, status: "in-progress" },
    });
  };

  // Derived stats
  const totalHours = plan.reduce((sum, t) => sum + t.recommendedHours, 0);
  const taskUrgencies = plan.map(
    (t) => getAssignment(t.assignmentId)?.urgencyLevel,
  );
  const topUrgency = getTopUrgencyLevel(taskUrgencies);
  const onTimeRate = averageCompletionRate(
    state.behaviorProfile.completionRateByDifficulty,
  );
  const procrastDays = state.behaviorProfile.avgProcrastinationDays;

  return (
    <div
      key={refreshKey}
      data-ocid="planner.page"
      className="px-4 md:px-8 py-6 max-w-2xl mx-auto space-y-6"
    >
      {/* ── Hero Title ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-primary shrink-0" />
            <h1 className="font-display text-2xl font-bold text-foreground">
              Today's Focus
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {formatTodayDate()} · Your AI-generated study plan
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          data-ocid="planner.refresh_button"
          className="shrink-0 gap-1.5"
        >
          <RefreshCcw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Recalculating…" : "Refresh Plan"}
        </Button>
      </div>

      {/* ── Behavioral Insight Card ── */}
      {procrastDays > 0 && (
        <Card data-ocid="planner.insight_card" className="bg-card border">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-semibold text-foreground">
                Procrastination buffer active.
              </span>{" "}
              You typically start{" "}
              <strong>
                {procrastDays} day{procrastDays !== 1 ? "s" : ""}
              </strong>{" "}
              later than recommended. Start date predictions have been adjusted
              to account for this.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Task List ── */}
      {plan.length === 0 ? (
        <div
          data-ocid="planner.empty_state"
          className="text-center py-16 space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-xl font-semibold text-foreground">
              All caught up! 🎉
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              No urgent tasks for today. Add new assignments to start planning.
            </p>
          </div>
          <Button asChild className="mt-2">
            <Link
              to="/dashboard"
              data-ocid="planner.empty_state.dashboard_button"
            >
              Go to Dashboard
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4" data-ocid="planner.task_list">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
              Today's Focus Tasks
            </h3>
            <span className="text-xs text-muted-foreground">
              {plan.length} task{plan.length !== 1 ? "s" : ""} queued
            </span>
          </div>

          {plan.map((task, index) => {
            const assignment = getAssignment(task.assignmentId);
            if (!assignment) return null;
            return (
              <PlannerTaskCard
                key={task.assignmentId}
                task={task}
                assignment={assignment}
                rank={index + 1}
                onMarkInProgress={handleMarkInProgress}
              />
            );
          })}
        </div>
      )}

      {/* ── Study Summary ── */}
      {plan.length > 0 && (
        <>
          <Separator />
          <div data-ocid="planner.study_summary">
            <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
              Study Summary
            </h3>
            <div className="flex gap-3 flex-wrap">
              <StatCard
                icon={<Clock className="w-4 h-4" />}
                label="Hours today"
                value={`${totalHours.toFixed(1)}h`}
              />
              <StatCard
                icon={<Target className="w-4 h-4" />}
                label="Tasks"
                value={plan.length}
              />
              <StatCard
                icon={<Brain className="w-4 h-4" />}
                label="Top urgency"
                value={
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${URGENCY_CLASSES[topUrgency]}`}
                  >
                    {topUrgency}
                  </span>
                }
              />
              <StatCard
                icon={<CheckCircle2 className="w-4 h-4" />}
                label="On-time rate"
                value={
                  <Badge
                    variant="outline"
                    className={`text-sm font-bold border-0 bg-transparent ${
                      onTimeRate >= 0.8
                        ? "text-urgency-low"
                        : onTimeRate >= 0.6
                          ? "text-urgency-medium"
                          : "text-urgency-high"
                    }`}
                  >
                    {Math.round(onTimeRate * 100)}%
                  </Badge>
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
