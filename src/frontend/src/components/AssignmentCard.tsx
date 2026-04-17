/**
 * AssignmentCard — A single assignment card in the dashboard grid.
 * Linear-inspired design: urgency-coded left border, star difficulty,
 * countdown chip, priority score indicator, and status action buttons.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";
import { Star } from "lucide-react";
import type { Assignment, AssignmentStatus, UrgencyLevel } from "../types";

// ─── Urgency config using pre-defined utility classes (no arbitrary oklch) ───

const URGENCY_CONFIG: Record<
  UrgencyLevel,
  {
    label: string;
    borderClass: string;
    textClass: string;
    badgeBg: string;
  }
> = {
  critical: {
    label: "Critical",
    borderClass: "border-urgency-critical",
    textClass: "text-urgency-critical",
    badgeBg:
      "bg-urgency-critical text-urgency-critical border-urgency-critical",
  },
  high: {
    label: "High",
    borderClass: "border-urgency-high",
    textClass: "text-urgency-high",
    badgeBg: "bg-urgency-high text-urgency-high border-urgency-high",
  },
  medium: {
    label: "Medium",
    borderClass: "border-urgency-medium",
    textClass: "text-urgency-medium",
    badgeBg: "bg-urgency-medium text-urgency-medium border-urgency-medium",
  },
  low: {
    label: "Low",
    borderClass: "border-urgency-low",
    textClass: "text-urgency-low",
    badgeBg: "bg-urgency-low text-urgency-low border-urgency-low",
  },
};

const STATUS_COLORS: Record<AssignmentStatus, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  "in-progress": "bg-primary/10 text-primary border-primary/30",
  submitted: "bg-urgency-low text-urgency-low border-urgency-low",
  overdue: "bg-urgency-critical text-urgency-critical border-urgency-critical",
};

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  pending: "Pending",
  "in-progress": "In Progress",
  submitted: "Submitted",
  overdue: "Overdue",
};

// ─── Priority Score Ring ──────────────────────────────────────────────────────

function PriorityRing({ score }: { score: number }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (score / 100);
  const empty = circumference - filled;

  return (
    <div
      className="flex flex-col items-center gap-0.5"
      aria-label={`Priority score: ${score} out of 100`}
    >
      <div className="relative w-9 h-9">
        <svg
          viewBox="0 0 36 36"
          className="w-9 h-9 -rotate-90"
          role="img"
          aria-hidden="true"
        >
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-muted opacity-30"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-primary"
            strokeWidth="3"
            strokeDasharray={`${filled} ${empty}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-[10px] text-foreground">
          {score}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground leading-none">
        score
      </span>
    </div>
  );
}

// ─── Difficulty Stars ─────────────────────────────────────────────────────────

function DifficultyStars({
  level,
  onClick,
}: { level: number; onClick?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5 items-center">
      {([1, 2, 3, 4, 5] as const).map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 transition-colors ${
            n <= level
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted-foreground"
          } ${onClick ? "cursor-pointer hover:scale-110" : ""}`}
          onClick={onClick ? () => onClick(n) : undefined}
        />
      ))}
    </div>
  );
}

// ─── Countdown Chip ───────────────────────────────────────────────────────────

function CountdownChip({ deadline }: { deadline: string }) {
  const date = parseISO(deadline);
  const overdue = isPast(new Date(`${deadline}T23:59:00`));

  if (overdue) {
    return (
      <span className="text-[11px] font-medium text-urgency-critical bg-urgency-critical px-1.5 py-0.5 rounded-full">
        OVERDUE
      </span>
    );
  }

  const distance = formatDistanceToNow(date, { addSuffix: true });
  return (
    <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full whitespace-nowrap">
      {distance}
    </span>
  );
}

// ─── AssignmentCard ───────────────────────────────────────────────────────────

interface AssignmentCardProps {
  assignment: Assignment;
  index: number;
  onUpdateStatus: (id: string, status: AssignmentStatus) => void;
}

export function AssignmentCard({
  assignment,
  index,
  onUpdateStatus,
}: AssignmentCardProps) {
  const urgency = assignment.urgencyLevel ?? "low";
  const cfg = URGENCY_CONFIG[urgency];
  const score = assignment.priorityScore ?? 0;

  const deadlineFormatted = format(
    parseISO(assignment.deadline),
    "MMM d, yyyy",
  );
  const startDate = assignment.suggestedStartDate
    ? format(parseISO(assignment.suggestedStartDate), "MMM d")
    : null;

  return (
    <Card
      data-ocid={`assignment.item.${index}`}
      className={`
        bg-card border border-border border-l-4 ${cfg.borderClass}
        transition-smooth hover:shadow-lg hover:-translate-y-0.5
        cursor-default group relative overflow-hidden
      `}
    >
      <CardContent className="p-4 space-y-3">
        {/* ── Header Row ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Subject pill */}
            <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
              {assignment.subject}
            </span>
            {/* Urgency badge */}
            <Badge
              data-ocid={`assignment.urgency_badge.${index}`}
              variant="outline"
              className={`text-[11px] px-1.5 py-0 border font-semibold ${cfg.badgeBg}`}
            >
              {cfg.label}
            </Badge>
          </div>
          <PriorityRing score={score} />
        </div>

        {/* ── Title ── */}
        <h3 className="font-display font-semibold text-[15px] leading-snug text-foreground line-clamp-2">
          {assignment.title}
        </h3>

        {/* ── Deadline Row ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            Due{" "}
            <span className="text-foreground font-medium">
              {deadlineFormatted}
            </span>
          </span>
          <CountdownChip deadline={assignment.deadline} />
        </div>

        {/* ── Difficulty + Hours Row ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Difficulty
            </span>
            <DifficultyStars level={assignment.difficulty} />
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Est. Hours
            </span>
            <span className="text-sm font-medium text-foreground">
              {assignment.estimatedHours}h
            </span>
          </div>
        </div>

        {/* ── Status + Suggested Start ── */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge
            data-ocid={`assignment.status_badge.${index}`}
            variant="outline"
            className={`text-[11px] border ${STATUS_COLORS[assignment.status]}`}
          >
            {STATUS_LABELS[assignment.status]}
          </Badge>
          {startDate && (
            <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Start by{" "}
              <span className="font-medium text-foreground">{startDate}</span>
            </span>
          )}
        </div>

        {/* ── Action Buttons ── */}
        {assignment.status !== "submitted" && (
          <div className="flex gap-2 pt-1 border-t border-border/50 flex-wrap">
            {assignment.status === "pending" && (
              <Button
                data-ocid={`assignment.mark_inprogress_button.${index}`}
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2.5 flex-1"
                onClick={() => onUpdateStatus(assignment.id, "in-progress")}
              >
                Mark In Progress
              </Button>
            )}
            {(assignment.status === "pending" ||
              assignment.status === "in-progress") && (
              <Button
                data-ocid={`assignment.mark_submitted_button.${index}`}
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2.5 flex-1 border-urgency-low text-urgency-low hover:bg-urgency-low"
                onClick={() => onUpdateStatus(assignment.id, "submitted")}
              >
                Mark Submitted
              </Button>
            )}
            {assignment.status === "overdue" && (
              <Button
                data-ocid={`assignment.mark_submitted_button.${index}`}
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2.5 w-full border-urgency-low text-urgency-low hover:bg-urgency-low"
                onClick={() => onUpdateStatus(assignment.id, "submitted")}
              >
                Mark Submitted
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
