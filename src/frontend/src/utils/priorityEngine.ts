/**
 * ═══════════════════════════════════════════════════════════════════
 * PRIORITY ENGINE
 * ═══════════════════════════════════════════════════════════════════
 * Pure utility module that computes a 0–100 priority score for each
 * assignment, recommended daily study hours, and human-readable
 * explanations for why each assignment needs attention.
 *
 * Score decomposition (max 100 pts total):
 *   A. Urgency Score          ……  0–40 pts
 *   B. Difficulty-Effort Score …  0–30 pts
 *   C. Historical Risk Score  ……  0–20 pts
 *   D. Overdue/Late-Start Penalty  +10 pts flat
 * ═══════════════════════════════════════════════════════════════════
 */

import type { Assignment, UserBehaviorProfile } from "../types";
import { daysUntilDeadline } from "./predictionEngine";

// ─── Priority Score ───────────────────────────────────────────────────────────

/**
 * Compute a priority score from 0–100 for a single assignment.
 *
 * ── Component A: Urgency Score (max 40 pts) ──────────────────────────────────
 *   ratio = estimatedHours / max(daysUntilDeadline, 0.5)
 *     → "hours of work per day remaining" — a ratio of 8 means all 8 hours
 *       in a single day, which is considered fully maxed-out urgency.
 *   urgencyScore = min(ratio / 8, 1.0) × 40
 *     → Scaled so ratio ≥ 8 → 40 pts, ratio = 4 → 20 pts, etc.
 *     → Floor at 0.5 days prevents division by near-zero (due today/overdue).
 *
 * ── Component B: Difficulty-Adjusted Effort Score (max 30 pts) ───────────────
 *   Captures that a hard assignment due soon is worse than an easy one.
 *   effortScore = (difficulty / 5) × min(40 / max(daysUntilDeadline, 1), 1) × 30
 *     → (difficulty/5): normalized difficulty contribution (0.2 to 1.0)
 *     → min(40/days, 1): proximity factor that maxes at ≤40 days out
 *       (chosen because 40 days is roughly a semester module cycle)
 *     → Combined with difficulty gives a higher score when both factors peak
 *
 * ── Component C: Historical Completion Risk Score (max 20 pts) ───────────────
 *   Rewards past struggle — if you historically fail at this difficulty,
 *   the app boosts its priority to help you start earlier.
 *   completionRate = profile.completionRateByDifficulty[difficulty] ?? 0.7
 *   riskScore = (1 - completionRate) × 20
 *     → completionRate = 0.45 (difficulty 5) → 11 pts risk boost
 *     → completionRate = 0.95 (difficulty 1) →  1 pt  risk boost
 *
 * ── Component D: Overdue / Missed-Start Penalty (+10 pts flat) ───────────────
 *   Two triggers:
 *   1. Assignment is overdue (status === 'overdue')
 *   2. Suggested start date is in the past AND status is 'pending'
 *      → Student should have started but hasn't yet
 *
 * Final: total = min(A + B + C + D, 100)  — hard-capped at 100
 */
export function computePriorityScore(
  assignment: Assignment,
  profile: UserBehaviorProfile,
  now?: Date,
): number {
  const days = daysUntilDeadline(assignment.deadline, now);

  // ── A. Urgency Score (max 40) ────────────────────────────────────────────
  // Use 0.5 as the floor to handle "due today/overdue" without infinity
  const daysFloor = Math.max(days, 0.5);
  const ratio = assignment.estimatedHours / daysFloor;
  // ratio/8 normalizes: ratio=8 (8hrs in 1 day) → 100% → 40 pts
  const urgencyScore = Math.min(ratio / 8, 1.0) * 40;

  // ── B. Difficulty-Adjusted Effort Score (max 30) ─────────────────────────
  // Proximity factor: 40/days normalizes around a ~40-day semester window
  const proximityFactor = Math.min(40 / Math.max(days, 1), 1.0);
  const effortScore = (assignment.difficulty / 5) * proximityFactor * 30;

  // ── C. Historical Completion Risk Score (max 20) ─────────────────────────
  const completionRate =
    profile.completionRateByDifficulty[assignment.difficulty] ?? 0.7;
  const riskScore = (1 - completionRate) * 20;

  // ── D. Overdue / Late-Start Penalty (+10 flat) ───────────────────────────
  let penalty = 0;

  if (assignment.status === "overdue") {
    // Already past the deadline — flat +10
    penalty = 10;
  } else if (assignment.status === "pending" && assignment.suggestedStartDate) {
    const startDate = new Date(assignment.suggestedStartDate);
    const reference = now ?? new Date();
    if (startDate < reference) {
      // Should have started already but hasn't — add urgency
      penalty = 10;
    }
  }

  const total = urgencyScore + effortScore + riskScore + penalty;
  return Math.round(Math.min(total, 100));
}

// ─── Daily Hours Recommendation ───────────────────────────────────────────────

/**
 * Compute recommended hours to dedicate to this assignment today.
 *
 * Formula:
 *   remainingHours = estimatedHours - actualHoursSpent
 *   daysLeft = max(daysUntilDeadline(deadline), 1)
 *   recommended = remainingHours / daysLeft
 *   result = min(recommended, 4)  ← cap at 4 hrs (sustainable daily focus limit)
 *
 * Rationale for 4-hour cap: cognitive science suggests diminishing returns
 * after ~4 hours of focused work per task. Studying longer often produces
 * poorer results than spreading over multiple sessions.
 *
 * Returns 0 if the assignment is already complete (actualHoursSpent ≥ estimatedHours).
 */
export function computeRecommendedHoursToday(
  assignment: Assignment,
  now?: Date,
): number {
  const remainingHours = Math.max(
    assignment.estimatedHours - assignment.actualHoursSpent,
    0,
  );

  if (remainingHours === 0) return 0;

  const days = daysUntilDeadline(assignment.deadline, now);
  const daysLeft = Math.max(days, 1);

  const recommended = remainingHours / daysLeft;
  return Math.round(Math.min(recommended, 4) * 10) / 10; // 1 decimal place
}

// ─── Human-Readable Priority Reason ──────────────────────────────────────────

/**
 * Generate a short, actionable explanation for why this assignment should be
 * worked on today. Used in the Daily Planner UI.
 *
 * Priority of messaging (first matching condition wins):
 *   1. Overdue → "Overdue by N day(s) — submit as soon as possible"
 *   2. Due today → "Due today — final push needed"
 *   3. Due tomorrow → "Due tomorrow — complete it today"
 *   4. Start date was in the past (missed start) → "Start date was yesterday — time to begin"
 *   5. High priority score → "Deadline in N days, difficulty D/5 — high effort needed now"
 *   6. Default → "Deadline in N days — stay on schedule"
 */
export function generatePriorityReason(
  assignment: Assignment,
  profile: UserBehaviorProfile,
  now?: Date,
): string {
  const days = daysUntilDeadline(assignment.deadline, now);
  const daysRounded = Math.round(Math.abs(days));
  const score = computePriorityScore(assignment, profile, now);

  if (days < 0) {
    return `Overdue by ${daysRounded} day${daysRounded !== 1 ? "s" : ""} — submit as soon as possible`;
  }

  if (days < 1) {
    return "Due today — final push needed";
  }

  if (days < 2) {
    return "Due tomorrow — complete it today";
  }

  if (assignment.suggestedStartDate) {
    const startDate = new Date(assignment.suggestedStartDate);
    const reference = now ?? new Date();
    if (startDate < reference && assignment.status === "pending") {
      const daysLate = Math.round(
        (reference.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysLate <= 1
        ? "Start date was yesterday — time to begin"
        : `Should have started ${daysLate} days ago — begin immediately`;
    }
  }

  if (score >= 60) {
    return `Deadline in ${Math.round(days)} days, difficulty ${assignment.difficulty}/5 — high effort needed now`;
  }

  return `Deadline in ${Math.round(days)} days — stay on schedule`;
}
