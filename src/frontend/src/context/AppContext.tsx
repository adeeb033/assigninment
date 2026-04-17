/**
 * AppContext — global state management via React Context + useReducer.
 *
 * Architecture:
 *   - AppProvider wraps the entire app with ThemeProvider + AppContext
 *   - All assignment/notification/UI state lives in AppState
 *   - Engines (prediction + priority) compute derived fields on demand
 *   - localStorage is synced on every state change via useEffect
 *
 * Exported hooks:
 *   useApp()                   — { state, dispatch }
 *   useAssignmentsWithScores() — assignments enriched by engines
 *   useDailyPlan()             — today's recommended task list
 *   useUnreadNotificationCount() — count of unseen notifications
 */

import { formatISO } from "date-fns";
import { ThemeProvider } from "next-themes";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

import type {
  AppNotification,
  Assignment,
  AssignmentStatus,
  DailyPlanTask,
  UrgencyLevel,
  UserBehaviorProfile,
} from "../types";

import {
  loadAssignments,
  loadBehaviorProfile,
  loadNotifications,
  saveAssignments,
  saveBehaviorProfile,
  saveNotifications,
} from "../utils/storage";

import {
  SAMPLE_ASSIGNMENTS,
  SAMPLE_BEHAVIOR_PROFILE,
  SAMPLE_NOTIFICATIONS,
} from "../utils/sampleData";

import {
  getUrgencyLevel,
  predictOptimalStartDate,
} from "../utils/predictionEngine";

import {
  computePriorityScore,
  computeRecommendedHoursToday,
  generatePriorityReason,
} from "../utils/priorityEngine";

// ─── State Shape ──────────────────────────────────────────────────────────────

interface ActiveFilters {
  subject: string | null;
  status: AssignmentStatus | null;
  urgency: UrgencyLevel | null;
}

interface AppState {
  assignments: Assignment[];
  behaviorProfile: UserBehaviorProfile;
  notifications: AppNotification[];
  sidebarOpen: boolean;
  activeFilters: ActiveFilters;
  sortBy: "priority" | "deadline" | "difficulty";
}

// ─── Action Types ─────────────────────────────────────────────────────────────

type AppAction =
  | { type: "ADD_ASSIGNMENT"; payload: Assignment }
  | { type: "UPDATE_ASSIGNMENT"; payload: Assignment }
  | { type: "DELETE_ASSIGNMENT"; payload: string } // assignment id
  | { type: "MARK_SEEN_NOTIFICATION"; payload: string } // notification id
  | { type: "ADD_NOTIFICATION"; payload: AppNotification }
  | { type: "DISMISS_ALL_NOTIFICATIONS" }
  | { type: "SET_FILTER"; payload: Partial<ActiveFilters> }
  | { type: "SET_SORT"; payload: AppState["sortBy"] }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "LOAD_STATE"; payload: Partial<AppState> };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "ADD_ASSIGNMENT":
      return { ...state, assignments: [...state.assignments, action.payload] };

    case "UPDATE_ASSIGNMENT":
      return {
        ...state,
        assignments: state.assignments.map((a) =>
          a.id === action.payload.id ? action.payload : a,
        ),
      };

    case "DELETE_ASSIGNMENT":
      return {
        ...state,
        assignments: state.assignments.filter((a) => a.id !== action.payload),
      };

    case "MARK_SEEN_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, seen: true } : n,
        ),
      };

    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };

    case "DISMISS_ALL_NOTIFICATIONS":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, seen: true })),
      };

    case "SET_FILTER":
      return {
        ...state,
        activeFilters: { ...state.activeFilters, ...action.payload },
      };

    case "SET_SORT":
      return { ...state, sortBy: action.payload };

    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case "LOAD_STATE":
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// ─── Initial State ────────────────────────────────────────────────────────────

function buildInitialState(): AppState {
  const storedAssignments = loadAssignments();
  const storedProfile = loadBehaviorProfile();
  const storedNotifications = loadNotifications();

  return {
    // Seed with sample data on first load (when storage is empty)
    assignments:
      storedAssignments.length > 0 ? storedAssignments : SAMPLE_ASSIGNMENTS,
    behaviorProfile: storedProfile ?? SAMPLE_BEHAVIOR_PROFILE,
    notifications:
      storedNotifications.length > 0
        ? storedNotifications
        : SAMPLE_NOTIFICATIONS,
    sidebarOpen: false,
    activeFilters: { subject: null, status: null, urgency: null },
    sortBy: "priority",
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: (action: AppAction) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    appReducer,
    undefined,
    buildInitialState,
  );

  // Sync to localStorage whenever relevant state slices change
  useEffect(() => {
    saveAssignments(state.assignments);
  }, [state.assignments]);

  useEffect(() => {
    saveBehaviorProfile(state.behaviorProfile);
  }, [state.behaviorProfile]);

  useEffect(() => {
    saveNotifications(state.notifications);
  }, [state.notifications]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <AppContext.Provider value={value}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
      </ThemeProvider>
    </AppContext.Provider>
  );
}

// ─── Base Hook ────────────────────────────────────────────────────────────────

/** Access raw app state and dispatch. */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

// ─── Computed Selectors ───────────────────────────────────────────────────────

/**
 * Returns assignments enriched with engine-computed fields:
 *   - urgencyLevel   (from predictionEngine.getUrgencyLevel)
 *   - priorityScore  (from priorityEngine.computePriorityScore)
 *   - suggestedStartDate (from predictionEngine.predictOptimalStartDate)
 *
 * Memoized — only re-runs when assignments or behavior profile change.
 */
export function useAssignmentsWithScores(): Assignment[] {
  const { state } = useApp();

  return useMemo(() => {
    const now = new Date();
    return state.assignments.map((a) => {
      const suggestedStart = predictOptimalStartDate(a, state.behaviorProfile);
      const suggestedStartDate = formatISO(suggestedStart, {
        representation: "date",
      });
      const enriched: Assignment = { ...a, suggestedStartDate };
      const urgencyLevel = getUrgencyLevel(enriched, now);
      const priorityScore = computePriorityScore(
        enriched,
        state.behaviorProfile,
        now,
      );
      return { ...enriched, urgencyLevel, priorityScore };
    });
  }, [state.assignments, state.behaviorProfile]);
}

/**
 * Returns today's recommended DailyPlanTask list.
 *
 * Algorithm:
 *   1. Exclude submitted/completed assignments
 *   2. Sort enriched assignments by priority score (descending)
 *   3. Take top 5 (or all if fewer)
 *   4. Build a DailyPlanTask for each with recommended hours and reason
 *
 * Memoized for performance.
 */
export function useDailyPlan(): DailyPlanTask[] {
  const { state } = useApp();
  const enriched = useAssignmentsWithScores();

  return useMemo(() => {
    const now = new Date();
    const active = enriched.filter((a) => a.status !== "submitted");

    // Sort by priority score, highest first
    const sorted = [...active].sort(
      (a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0),
    );

    // Take up to 5 assignments for the daily plan
    return sorted.slice(0, 5).map((a) => ({
      assignmentId: a.id,
      recommendedHours: computeRecommendedHoursToday(a, now),
      priority: a.priorityScore ?? 0,
      reason: generatePriorityReason(a, state.behaviorProfile, now),
    }));
  }, [enriched, state.behaviorProfile]);
}

/**
 * Returns the count of unseen notifications.
 * Used for the notification bell badge in the header.
 */
export function useUnreadNotificationCount(): number {
  const { state } = useApp();
  return useCallback(
    () => state.notifications.filter((n) => !n.seen).length,
    [state.notifications],
  )();
}
