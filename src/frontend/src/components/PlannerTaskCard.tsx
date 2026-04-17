/**
 * PlannerTaskCard — Rich card for each task in the Daily Planner.
 *
 * Displays rank badge, title, subject, urgency, priority score,
 * recommended study block, AI reasoning, deadline countdown,
 * difficulty stars, procrastination nudge, and action button.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Clock,
  Star,
  TrendingUp,
} from "lucide-react";
import type { Assignment, DailyPlanTask, UrgencyLevel } from "../types";
import { daysUntilDeadline } from "../utils/predictionEngine";

// ─── Rank Badge Colors ────────────────────────────────────────────────────────

type RankStyle = { bg: string; text: string; border: string; label: string };

const RANK_STYLES: Record<number, RankStyle> = {
  1: {
    bg: "bg-yellow-500/15",
    text: "text-yellow-500",
    border: "border-yellow-500/40",
    label: "#1",
  },
  2: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    label: "#2",
  },
  3: {
    bg: "bg-amber-700/15",
    text: "text-amber-600",
    border: "border-amber-700/40",
    label: "#3",
  },
};

const DEFAULT_RANK_STYLE: RankStyle = {
  bg: "bg-muted",
  text: "text-muted-foreground",
  border: "border-border",
  label: "#?",
};

function getRankStyle(rank: number): RankStyle {
  return RANK_STYLES[rank] ?? { ...DEFAULT_RANK_STYLE, label: `#${rank}` };
}

// ─── Urgency Badge Mapping ────────────────────────────────────────────────────

const URGENCY_CLASSES: Record<UrgencyLevel, string> = {
  critical: "bg-urgency-critical text-urgency-critical border-urgency-critical",
  high: "bg-urgency-high text-urgency-high border-urgency-high",
  medium: "bg-urgency-medium text-urgency-medium border-urgency-medium",
  low: "bg-urgency-low text-urgency-low border-urgency-low",
};

function UrgencyBadge({ level }: { level: UrgencyLevel }) {
  const cls = URGENCY_CLASSES[level];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${cls}`}
    >
      {level}
    </span>
  );
}

// ─── Difficulty Stars ─────────────────────────────────────────────────────────

function DifficultyStars({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Difficulty ${level} out of 5`}
    >
      {([1, 2, 3, 4, 5] as const).map((n) => (
        <Star
          key={n}
          className={`w-3 h-3 ${
            n <= level
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Deadline Countdown ───────────────────────────────────────────────────────

function DeadlineCountdown({ deadline }: { deadline: string }) {
  const days = daysUntilDeadline(deadline);

  if (days < 0) {
    const overdueDays = Math.abs(Math.round(days));
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-urgency-critical">
        <AlertTriangle className="w-3 h-3" />
        OVERDUE by {overdueDays} day{overdueDays !== 1 ? "s" : ""}
      </span>
    );
  }

  if (days < 1) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-urgency-critical">
        <Calendar className="w-3 h-3" />
        Due today
      </span>
    );
  }

  const daysRounded = Math.round(days);
  const color =
    daysRounded <= 1
      ? "text-urgency-critical"
      : daysRounded <= 3
        ? "text-urgency-high"
        : daysRounded <= 7
          ? "text-urgency-medium"
          : "text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}
    >
      <Calendar className="w-3 h-3" />
      Due in {daysRounded} day{daysRounded !== 1 ? "s" : ""}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PlannerTaskCardProps {
  task: DailyPlanTask;
  assignment: Assignment;
  rank: number;
  onMarkInProgress: (assignment: Assignment) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PlannerTaskCard({
  task,
  assignment,
  rank,
  onMarkInProgress,
}: PlannerTaskCardProps) {
  const rankStyle = getRankStyle(rank);
  const urgencyLevel = assignment.urgencyLevel ?? "medium";

  // Check if suggested start date is in the past and assignment is pending
  const procrastinationNudgeDays = (() => {
    if (assignment.status !== "pending" || !assignment.suggestedStartDate)
      return null;
    const startDate = new Date(assignment.suggestedStartDate);
    const now = new Date();
    if (startDate >= now) return null;
    const diff = Math.round(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff > 0 ? diff : null;
  })();

  const isAlreadyInProgress = assignment.status === "in-progress";

  return (
    <Card
      data-ocid={`planner.task.item.${rank}`}
      className="bg-card border-border hover:shadow-md transition-smooth overflow-hidden"
    >
      <CardContent className="p-0">
        {/* Top accent strip by urgency */}
        <div
          className={`h-1 w-full ${
            urgencyLevel === "critical"
              ? "bg-urgency-critical"
              : urgencyLevel === "high"
                ? "bg-urgency-high"
                : urgencyLevel === "medium"
                  ? "bg-urgency-medium"
                  : "bg-urgency-low"
          }`}
        />

        <div className="p-4 space-y-3">
          {/* ── Row 1: Rank + Title + Subject ── */}
          <div className="flex items-start gap-3">
            {/* Rank Badge */}
            <div
              className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold border ${rankStyle.bg} ${rankStyle.text} ${rankStyle.border}`}
              aria-label={`Priority rank ${rank}`}
            >
              {rankStyle.label}
            </div>

            {/* Title + Subject */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0 font-medium shrink-0"
                >
                  <BookOpen className="w-2.5 h-2.5 mr-1" />
                  {assignment.subject}
                </Badge>
              </div>
              <h3 className="font-display font-semibold text-foreground text-sm leading-snug break-words">
                {assignment.title}
              </h3>
            </div>
          </div>

          {/* ── Row 2: Urgency + Priority Score + Study Block ── */}
          <div className="flex items-center gap-2 flex-wrap">
            <UrgencyBadge level={urgencyLevel} />

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <TrendingUp className="w-3 h-3" />
              Score: {task.priority}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/25">
              <Clock className="w-3 h-3" />
              Study {task.recommendedHours}h today
            </span>
          </div>

          {/* ── Row 3: AI Reasoning ── */}
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            "{task.reason}"
          </p>

          {/* ── Row 4: Deadline + Difficulty ── */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <DeadlineCountdown deadline={assignment.deadline} />
            <DifficultyStars level={assignment.difficulty} />
          </div>

          {/* ── Row 5: Procrastination Nudge (conditional) ── */}
          {procrastinationNudgeDays !== null && (
            <div className="rounded-lg px-3 py-2.5 bg-urgency-high/10 border border-urgency-high/25 text-xs text-urgency-high flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-urgency-high" />
              <span>
                You were recommended to start{" "}
                <strong>{procrastinationNudgeDays}</strong> day
                {procrastinationNudgeDays !== 1 ? "s" : ""} ago. Don't wait —
                even 30 minutes today helps.
              </span>
            </div>
          )}

          {/* ── Row 6: Action Button ── */}
          <div className="pt-1">
            {isAlreadyInProgress ? (
              <Badge
                variant="outline"
                className="text-xs font-medium text-primary border-primary/30 bg-primary/5"
              >
                Already In Progress
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-3 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-smooth"
                onClick={() => onMarkInProgress(assignment)}
                data-ocid={`planner.task.mark_in_progress.${rank}`}
                disabled={
                  assignment.status === "submitted" ||
                  assignment.status === "overdue"
                }
              >
                Mark In Progress
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
