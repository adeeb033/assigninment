// ─── Core Domain Types ───────────────────────────────────────────────────────

/** Urgency classification based on deadline proximity vs. estimated effort */
export type UrgencyLevel = "critical" | "high" | "medium" | "low";

/** Lifecycle state of an assignment */
export type AssignmentStatus =
  | "pending"
  | "in-progress"
  | "submitted"
  | "overdue";

/**
 * Core assignment entity.
 * Fields with `?` are computed at runtime by the prediction/priority engines
 * and stored back onto the assignment for convenience.
 */
export interface Assignment {
  id: string;
  title: string;
  subject: string;
  deadline: string; // ISO date string (YYYY-MM-DD)
  estimatedHours: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  status: AssignmentStatus;
  actualHoursSpent: number;
  submittedAt: string | null; // ISO date string when submitted
  notes: string;
  createdAt: string; // ISO date string

  // Computed by engines — enriched before rendering
  urgencyLevel?: UrgencyLevel;
  priorityScore?: number; // 0–100
  suggestedStartDate?: string; // ISO date string
}

/**
 * Behavioral profile derived from historical assignment performance.
 * Drives procrastination buffers and risk scoring in the engines.
 */
export interface UserBehaviorProfile {
  /** Average number of days a user delays starting an assignment */
  avgProcrastinationDays: number;
  /** Completion rate per difficulty level (0–1 where 1 = 100% completion) */
  completionRateByDifficulty: Record<number, number>;
  /** Daily study capacity in hours (how many hours per day the user can realistically work) */
  preferredWorkHours: number;
  /** Historical data: how many days after suggested start date the user actually started */
  historicalStartDelays: number[];
}

/** A single task within a daily study plan */
export interface DailyPlanTask {
  assignmentId: string;
  recommendedHours: number;
  priority: number; // 0–100 priority score
  reason: string; // Human-readable explanation for why this is in today's plan
}

/** A structured daily plan containing ordered tasks */
export interface DailyPlan {
  date: string; // ISO date string
  tasks: DailyPlanTask[];
}

/** Classification of notification trigger types */
export type NotificationType =
  | "start-soon"
  | "due-tomorrow"
  | "overdue"
  | "daily-plan";

/** In-app notification entity */
export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  scheduledAt: string; // ISO date string
  seen: boolean;
  assignmentId?: string; // Optional reference to the related assignment
}
