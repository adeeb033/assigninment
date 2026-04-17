/**
 * ═══════════════════════════════════════════════════════════════════
 * PREDICTION ENGINE
 * ═══════════════════════════════════════════════════════════════════
 * Pure utility module that computes optimal start dates and urgency
 * classifications for assignments. All functions are side-effect free
 * and fully unit-testable.
 *
 * Core design principle: every formula is documented inline so the
 * reasoning is transparent to students and developers alike.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { Assignment, UrgencyLevel, UserBehaviorProfile } from "../types";

// ─── Difficulty Factor ────────────────────────────────────────────────────────

/**
 * Maps difficulty (1–5) to a time multiplier for study estimates.
 *
 * Formula: linear interpolation from 1.0× (easy) to 2.0× (hardest)
 *   factor = 1.0 + ((difficulty - 1) / 4) * 1.0
 *
 * Intuition: a difficulty-5 assignment takes twice as long per estimated
 * hour compared to a difficulty-1 assignment, due to re-reading, confusion
 * time, and higher cognitive load.
 *
 * Examples:
 *   difficulty 1 → 1.00×
 *   difficulty 2 → 1.25×
 *   difficulty 3 → 1.50×
 *   difficulty 4 → 1.75×
 *   difficulty 5 → 2.00×
 */
export function getDifficultyFactor(difficulty: number): number {
  // Clamp to valid range to be safe
  const d = Math.max(1, Math.min(5, difficulty));
  return 1.0 + ((d - 1) / 4) * 1.0;
}

// ─── Workday Utilities ────────────────────────────────────────────────────────

/**
 * Count workdays (Monday–Friday) between two dates (exclusive of end date).
 *
 * Used to calculate how many productive days a student actually has —
 * most students do not study on weekends or treat them as reduced-capacity days.
 *
 * Algorithm: iterate day by day from start to end, counting only Mon–Fri.
 * Note: getDay() returns 0=Sunday, 6=Saturday.
 */
export function countWorkdays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endNormalized = new Date(end);
  endNormalized.setHours(0, 0, 0, 0);

  while (current < endNormalized) {
    const dayOfWeek = current.getDay();
    // 1 = Monday … 5 = Friday (not 0=Sunday or 6=Saturday)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Add N workdays (Mon–Fri) to a given date, skipping weekends.
 *
 * Example: adding 3 workdays to Friday → result is Wednesday (skips Sat+Sun).
 * Used to project forward from today when computing the start date.
 */
export function addWorkdays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = Math.round(days);

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    // Only count Mon–Fri
    if (day >= 1 && day <= 5) {
      remaining--;
    }
  }

  return result;
}

/**
 * Subtract N workdays (Mon–Fri) from a given date, skipping weekends backwards.
 * Used to walk back from the deadline to find the optimal start date.
 */
function subtractWorkdays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = Math.round(days);

  while (remaining > 0) {
    result.setDate(result.getDate() - 1);
    const day = result.getDay();
    if (day >= 1 && day <= 5) {
      remaining--;
    }
  }

  return result;
}

// ─── Optimal Start Date Prediction ───────────────────────────────────────────

/**
 * Predict the optimal start date for an assignment.
 *
 * This is the core scheduling algorithm. It works backwards from the deadline
 * to determine how early a student should start, accounting for:
 *   1. Raw time required (estimatedHours / daily work capacity)
 *   2. Cognitive difficulty multiplier (harder = more calendar days needed)
 *   3. Personal procrastination buffer (adds safety days based on past behavior)
 *
 * Step-by-step formula:
 *
 *   1. dailyCapacity = profile.preferredWorkHours  (default: 2 hrs/day)
 *      → How many hours the student can realistically work per day
 *
 *   2. rawBufferDays = estimatedHours / dailyCapacity
 *      → Minimum calendar days needed if studying at full capacity
 *      → Example: 8 hours / 2 per day = 4 days minimum
 *
 *   3. difficultyAdjustedDays = rawBufferDays × getDifficultyFactor(difficulty)
 *      → Harder assignments need more days for the same estimated hours
 *      → Example: 4 days × 2.0 (difficulty 5) = 8 adjusted days
 *
 *   4. procrastinationBuffer = profile.avgProcrastinationDays
 *      → Extra safety days added for the student's historical delay tendency
 *      → Example: 2.3 days of typical procrastination added
 *
 *   5. totalBufferDays = difficultyAdjustedDays + procrastinationBuffer
 *      → Total workdays to count backwards from the deadline
 *
 *   6. startDate = subtractWorkdays(deadline, totalBufferDays)
 *      → Walk backwards skipping weekends
 *
 *   7. If startDate is in the past, return today (can't start before now)
 *
 * @returns Optimal start Date object
 */
export function predictOptimalStartDate(
  assignment: Assignment,
  profile: UserBehaviorProfile,
): Date {
  const deadline = new Date(assignment.deadline);
  deadline.setHours(23, 59, 0, 0);

  const dailyCapacity =
    profile.preferredWorkHours > 0 ? profile.preferredWorkHours : 2;

  // Step 2: raw days at full capacity
  const rawBufferDays = assignment.estimatedHours / dailyCapacity;

  // Step 3: adjust for difficulty
  const difficultyAdjustedDays =
    rawBufferDays * getDifficultyFactor(assignment.difficulty);

  // Step 4: add procrastination buffer
  const totalBufferDays =
    difficultyAdjustedDays + profile.avgProcrastinationDays;

  // Step 6: walk backwards from deadline
  let startDate = subtractWorkdays(deadline, Math.ceil(totalBufferDays));

  // Step 7: don't suggest a start date in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate < today) {
    startDate = today;
  }

  return startDate;
}

// ─── Deadline Proximity ───────────────────────────────────────────────────────

/**
 * Compute the number of days until the deadline from `now` (default: today).
 *
 * Returns a positive number if the deadline is in the future.
 * Returns 0 if the deadline is today.
 * Returns a negative number if the deadline has passed (overdue).
 *
 * Formula: (deadlineMs - nowMs) / msPerDay  (rounded to 2 decimal places)
 *
 * Note: we use raw milliseconds rather than calendar day counting to avoid
 * timezone edge cases. Partial days count — a deadline at 11pm is still
 * "today" not "tomorrow".
 */
export function daysUntilDeadline(deadline: string, now?: Date): number {
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(23, 59, 0, 0);
  const referenceDate = now ?? new Date();
  const diffMs = deadlineDate.getTime() - referenceDate.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

// ─── Urgency Classification ───────────────────────────────────────────────────

/**
 * Classify an assignment's urgency based on deadline proximity relative
 * to the effort required.
 *
 * The key insight: urgency is not just "how many days left" — it's whether
 * there's enough time given how long the assignment takes to complete.
 *
 * Thresholds (days until deadline vs. estimated hours):
 *
 *   CRITICAL: days < estimatedHours / 2
 *     → You don't even have half the time you need at 1 hr/day pace
 *     → Also used when assignment is already overdue (days < 0)
 *     → Example: 8h assignment with < 4 days left = CRITICAL
 *
 *   HIGH: days < estimatedHours × 1.5
 *     → Time is tight; need to start now or risk not finishing
 *     → Example: 8h assignment with < 12 days = HIGH
 *
 *   MEDIUM: days < estimatedHours × 3
 *     → Upcoming but manageable with steady effort
 *     → Example: 8h assignment with < 24 days = MEDIUM
 *
 *   LOW: otherwise
 *     → Plenty of runway, plan ahead but no immediate action required
 */
export function getUrgencyLevel(
  assignment: Assignment,
  now?: Date,
): UrgencyLevel {
  const days = daysUntilDeadline(assignment.deadline, now);

  // Overdue is always critical
  if (days < 0) return "critical";

  const h = assignment.estimatedHours;

  if (days < h / 2) return "critical";
  if (days < h * 1.5) return "high";
  if (days < h * 3) return "medium";
  return "low";
}
