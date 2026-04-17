/**
 * DashboardPage — Primary page of AssignIQ.
 * Shows a filtered, sorted grid of AssignmentCards with skeleton loading,
 * filter/sort controls, and an "Add Assignment" slide-over.
 */

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AddAssignmentSheet } from "../components/AddAssignmentSheet";
import { AssignmentCard } from "../components/AssignmentCard";
import { FilterBar } from "../components/FilterBar";
import { useApp, useAssignmentsWithScores } from "../context/AppContext";
import type { AssignmentStatus } from "../types";

// ─── Skeleton Grid ────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div
      data-ocid="dashboard.loading_state"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton items
          key={i}
          className="bg-card border border-border border-l-4 border-l-muted rounded-xl p-4 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-3 w-12 rounded-full" />
            </div>
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          <Skeleton className="h-5 w-4/5 rounded" />
          <Skeleton className="h-4 w-3/5 rounded" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((__, j) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton items
              <Skeleton key={j} className="h-3.5 w-3.5 rounded-sm" />
            ))}
          </div>
          <div className="flex gap-2 pt-1 border-t border-border/50">
            <Skeleton className="h-7 flex-1 rounded-md" />
            <Skeleton className="h-7 flex-1 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div
      data-ocid="dashboard.empty_state"
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-muted-foreground" />
      </div>
      {hasFilters ? (
        <>
          <h3 className="font-display text-lg font-semibold text-foreground mb-1">
            No assignments match
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Try clearing your filters to see all assignments.
          </p>
        </>
      ) : (
        <>
          <h3 className="font-display text-lg font-semibold text-foreground mb-1">
            No assignments yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-5">
            Add your first assignment to get AI-powered urgency predictions and
            a personalized study plan.
          </p>
          <AddAssignmentSheet
            trigger={
              <Button
                data-ocid="dashboard.add_first_button"
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add your first assignment
              </Button>
            }
          />
        </>
      )}
    </div>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────────

export function DashboardPage() {
  const allAssignments = useAssignmentsWithScores();
  const { state, dispatch } = useApp();
  const [showSkeleton, setShowSkeleton] = useState(true);

  // 300ms skeleton delay on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Unique subjects for filter dropdown
  const subjects = useMemo(
    () => [...new Set(allAssignments.map((a) => a.subject))].sort(),
    [allAssignments],
  );

  // Apply filters
  const filtered = useMemo(() => {
    return allAssignments.filter((a) => {
      if (
        state.activeFilters.subject &&
        a.subject !== state.activeFilters.subject
      )
        return false;
      if (state.activeFilters.status && a.status !== state.activeFilters.status)
        return false;
      if (
        state.activeFilters.urgency &&
        a.urgencyLevel !== state.activeFilters.urgency
      )
        return false;
      return true;
    });
  }, [allAssignments, state.activeFilters]);

  // Apply sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (state.sortBy === "priority")
        return (b.priorityScore ?? 0) - (a.priorityScore ?? 0);
      if (state.sortBy === "deadline")
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return b.difficulty - a.difficulty;
    });
  }, [filtered, state.sortBy]);

  const hasActiveFilters = Boolean(
    state.activeFilters.subject ||
      state.activeFilters.status ||
      state.activeFilters.urgency,
  );

  function handleUpdateStatus(id: string, status: AssignmentStatus) {
    const assignment = allAssignments.find((a) => a.id === id);
    if (!assignment) return;
    dispatch({
      type: "UPDATE_ASSIGNMENT",
      payload: {
        ...assignment,
        status,
        submittedAt:
          status === "submitted"
            ? new Date().toISOString()
            : assignment.submittedAt,
      },
    });
  }

  return (
    <div
      data-ocid="dashboard.page"
      className="px-4 md:px-8 py-6 max-w-5xl space-y-6"
    >
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            {" · "}
            <span className="font-medium text-foreground">
              {allAssignments.length}
            </span>
            {" assignment"}
            {allAssignments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <AddAssignmentSheet
          trigger={
            <Button
              data-ocid="dashboard.add_assignment_button"
              className="gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Assignment
            </Button>
          }
        />
      </div>

      {/* ── Filter / Sort Bar ── */}
      <FilterBar subjects={subjects} />

      {/* ── Assignment Grid ── */}
      {showSkeleton ? (
        <SkeletonGrid />
      ) : sorted.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} />
      ) : (
        <div
          data-ocid="dashboard.assignments_grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {sorted.map((assignment, index) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              index={index + 1}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
