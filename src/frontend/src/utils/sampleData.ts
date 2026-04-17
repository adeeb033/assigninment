/**
 * Sample seed data for AssignIQ.
 *
 * All deadlines are relative to today so the app always shows relevant
 * urgency states regardless of when it is first opened. The profile
 * simulates a typical college student with moderate procrastination.
 */

import { addDays, formatISO } from "date-fns";
import type {
  AppNotification,
  Assignment,
  UserBehaviorProfile,
} from "../types";

// ─── Date Helpers ─────────────────────────────────────────────────────────────

/** Return an ISO date string N days from today */
function relativeDate(offsetDays: number): string {
  return formatISO(addDays(new Date(), offsetDays), { representation: "date" });
}

// ─── Sample Assignments ───────────────────────────────────────────────────────

export const SAMPLE_ASSIGNMENTS: Assignment[] = [
  {
    id: "assign-1",
    title: "Data Structures Final Exam",
    subject: "Computer Science",
    deadline: relativeDate(3),
    estimatedHours: 8,
    difficulty: 5,
    status: "pending",
    actualHoursSpent: 0,
    submittedAt: null,
    notes:
      "Topics: binary trees, graphs, dynamic programming. Review lecture slides from weeks 10–14.",
    createdAt: relativeDate(-5),
  },
  {
    id: "assign-2",
    title: "Essay: Climate Change Policy",
    subject: "English",
    deadline: relativeDate(7),
    estimatedHours: 5,
    difficulty: 3,
    status: "in-progress",
    actualHoursSpent: 1.5,
    submittedAt: null,
    notes:
      "Outline done. Need to write body paragraphs and conclusion. Cite at least 6 sources.",
    createdAt: relativeDate(-3),
  },
  {
    id: "assign-3",
    title: "Linear Algebra Problem Set",
    subject: "Mathematics",
    deadline: relativeDate(2),
    estimatedHours: 3,
    difficulty: 4,
    status: "pending",
    actualHoursSpent: 0,
    submittedAt: null,
    notes:
      "Problems 1–20 from Chapter 7. Eigenvalues and eigenvectors section.",
    createdAt: relativeDate(-2),
  },
  {
    id: "assign-4",
    title: "History Chapter 12 Reading",
    subject: "History",
    deadline: relativeDate(10),
    estimatedHours: 2,
    difficulty: 2,
    status: "pending",
    actualHoursSpent: 0,
    submittedAt: null,
    notes: "Read pages 245–290. Take notes on post-WWII political landscape.",
    createdAt: relativeDate(-1),
  },
  {
    id: "assign-5",
    title: "Physics Lab Report",
    subject: "Physics",
    deadline: relativeDate(-1),
    estimatedHours: 4,
    difficulty: 3,
    status: "overdue",
    actualHoursSpent: 2,
    submittedAt: null,
    notes: "Pendulum experiment — analysis and error discussion still needed.",
    createdAt: relativeDate(-8),
  },
];

// ─── Sample Behavior Profile ──────────────────────────────────────────────────

/**
 * Simulated profile for a typical college student:
 * - Tends to procrastinate ~2.3 days before starting
 * - Completes easy assignments reliably but struggles with difficulty 4–5
 * - Can sustain ~2 hours of focused study per day
 * - Historical start delays show a pattern of last-minute starts
 */
export const SAMPLE_BEHAVIOR_PROFILE: UserBehaviorProfile = {
  avgProcrastinationDays: 2.3,
  completionRateByDifficulty: {
    1: 0.95,
    2: 0.88,
    3: 0.75,
    4: 0.6,
    5: 0.45,
  },
  preferredWorkHours: 2,
  historicalStartDelays: [1, 3, 0, 2, 4, 1],
};

// ─── Sample Notifications ─────────────────────────────────────────────────────

export const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    type: "overdue",
    message: "Physics Lab Report is overdue — submit as soon as possible.",
    scheduledAt: new Date().toISOString(),
    seen: false,
    assignmentId: "assign-5",
  },
  {
    id: "notif-2",
    type: "start-soon",
    message: "Data Structures Final Exam: recommended start date is today.",
    scheduledAt: new Date().toISOString(),
    seen: false,
    assignmentId: "assign-1",
  },
  {
    id: "notif-3",
    type: "daily-plan",
    message:
      "Your daily study plan is ready. You have 3 high-priority assignments today.",
    scheduledAt: new Date().toISOString(),
    seen: true,
  },
];
