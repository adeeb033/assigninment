/**
 * localStorage persistence layer for AssignIQ.
 *
 * All keys are namespaced under `assigniq:` to avoid collisions.
 * Functions never throw — if storage is unavailable or data is corrupt,
 * they return sensible defaults so the app degrades gracefully.
 */

import type {
  AppNotification,
  Assignment,
  UserBehaviorProfile,
} from "../types";

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  ASSIGNMENTS: "assigniq:assignments",
  PROFILE: "assigniq:profile",
  NOTIFICATIONS: "assigniq:notifications",
} as const;

// ─── Generic Helpers ──────────────────────────────────────────────────────────

function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or private browsing — fail silently
  }
}

// ─── Assignments ──────────────────────────────────────────────────────────────

/** Load saved assignments from localStorage. Returns [] if none stored. */
export function loadAssignments(): Assignment[] {
  return getItem<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS) ?? [];
}

/** Persist the full assignments array to localStorage. */
export function saveAssignments(assignments: Assignment[]): void {
  setItem(STORAGE_KEYS.ASSIGNMENTS, assignments);
}

// ─── Behavior Profile ─────────────────────────────────────────────────────────

/** Default profile for new users with no behavioral history. */
const DEFAULT_PROFILE: UserBehaviorProfile = {
  avgProcrastinationDays: 2.3,
  completionRateByDifficulty: { 1: 0.95, 2: 0.88, 3: 0.75, 4: 0.6, 5: 0.45 },
  preferredWorkHours: 2,
  historicalStartDelays: [1, 3, 0, 2, 4, 1],
};

/** Load the user's behavior profile. Returns the default profile if none is stored. */
export function loadBehaviorProfile(): UserBehaviorProfile {
  return getItem<UserBehaviorProfile>(STORAGE_KEYS.PROFILE) ?? DEFAULT_PROFILE;
}

/** Persist the behavior profile to localStorage. */
export function saveBehaviorProfile(profile: UserBehaviorProfile): void {
  setItem(STORAGE_KEYS.PROFILE, profile);
}

// ─── Notifications ────────────────────────────────────────────────────────────

/** Load saved notifications from localStorage. Returns [] if none stored. */
export function loadNotifications(): AppNotification[] {
  return getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS) ?? [];
}

/** Persist the full notifications array to localStorage. */
export function saveNotifications(notifications: AppNotification[]): void {
  setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
}
