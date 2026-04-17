/**
 * NotificationScheduler — headless component that fires notification side-effects.
 *
 * Captures a one-time snapshot of initial state (via ref) and runs scheduling
 * logic once on mount. Using refs avoids the react-hooks/exhaustive-deps issue
 * while still reading the most current initial data.
 *
 * Schedules:
 *   1. 'overdue' notifications for any overdue assignments with no existing notif.
 *   2. 'start-soon' notifications based on suggestedStartDate.
 *   3. 'daily-plan' notification once per calendar day.
 */

import { formatISO, parseISO, subDays } from "date-fns";
import { useEffect, useRef } from "react";
import { useApp, useAssignmentsWithScores } from "../context/AppContext";
import type { AppNotification } from "../types";

function makeId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function NotificationScheduler() {
  const { state, dispatch } = useApp();
  const enriched = useAssignmentsWithScores();

  // Capture the latest values in a ref so we can read them from the effect
  // without adding them as dependencies (we only want to run once on mount).
  const snapshotRef = useRef({ state, dispatch, enriched });
  snapshotRef.current = { state, dispatch, enriched };

  useEffect(() => {
    const { state: s, dispatch: d, enriched: asgns } = snapshotRef.current;
    const now = new Date();
    const todayStr = formatISO(now, { representation: "date" });

    // ── 1. Overdue notifications ──────────────────────────────────────────────
    const existingOverdueIds = new Set(
      s.notifications
        .filter((n) => n.type === "overdue" && n.assignmentId)
        .map((n) => n.assignmentId as string),
    );

    for (const a of asgns) {
      if (a.status === "overdue" && !existingOverdueIds.has(a.id)) {
        d({
          type: "ADD_NOTIFICATION",
          payload: {
            id: makeId(),
            type: "overdue",
            message: `${a.title} is overdue — submit as soon as possible.`,
            scheduledAt: now.toISOString(),
            seen: false,
            assignmentId: a.id,
          } satisfies AppNotification,
        });
      }
    }

    // ── 2. Start-soon notifications ───────────────────────────────────────────
    const existingStartIds = new Set(
      s.notifications
        .filter((n) => n.type === "start-soon" && n.assignmentId)
        .map((n) => n.assignmentId as string),
    );

    for (const a of asgns) {
      if (existingStartIds.has(a.id) || !a.suggestedStartDate) continue;

      const notifyAt = subDays(parseISO(a.suggestedStartDate), 1);
      const delayMs = notifyAt.getTime() - now.getTime();
      // Demo mode: fire immediately if notify time is within 1 hour
      const effectiveDelay = delayMs < 60 * 60 * 1000 ? 0 : delayMs;

      const assignmentId = a.id;
      const deadline = a.deadline;
      const title = a.title;

      setTimeout(() => {
        d({
          type: "ADD_NOTIFICATION",
          payload: {
            id: makeId(),
            type: "start-soon",
            message: `Time to start "${title}" — deadline is ${deadline}.`,
            scheduledAt: new Date().toISOString(),
            seen: false,
            assignmentId,
          } satisfies AppNotification,
        });
      }, effectiveDelay);
    }

    // ── 3. Daily-plan notification ────────────────────────────────────────────
    const alreadyToday = s.notifications.some(
      (n) => n.type === "daily-plan" && n.scheduledAt.startsWith(todayStr),
    );

    if (!alreadyToday) {
      const highCount = asgns.filter(
        (a) => (a.priorityScore ?? 0) >= 60 && a.status !== "submitted",
      ).length;

      d({
        type: "ADD_NOTIFICATION",
        payload: {
          id: makeId(),
          type: "daily-plan",
          message: `Your daily study plan is ready. You have ${highCount} high-priority assignment${highCount !== 1 ? "s" : ""} today.`,
          scheduledAt: now.toISOString(),
          seen: false,
        } satisfies AppNotification,
      });
    }
  }, []); // mount-only — snapshot ref captures current values

  return null;
}
