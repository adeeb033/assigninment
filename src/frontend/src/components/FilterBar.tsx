/**
 * FilterBar — Horizontal filter and sort controls above the dashboard card grid.
 * Filters: subject, status, urgency. Sort: priority score | deadline | difficulty.
 * Mobile: collapsed behind a "Filters" button with active filter count badge.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { useApp } from "../context/AppContext";
import type { AssignmentStatus, UrgencyLevel } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortOption = "priority" | "deadline" | "difficulty";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "priority", label: "Priority Score" },
  { value: "deadline", label: "Deadline" },
  { value: "difficulty", label: "Difficulty" },
];

const STATUS_OPTIONS: { value: AssignmentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "overdue", label: "Overdue" },
];

const URGENCY_OPTIONS: { value: UrgencyLevel; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

// ─── FilterBar ────────────────────────────────────────────────────────────────

interface FilterBarProps {
  subjects: string[];
}

export function FilterBar({ subjects }: FilterBarProps) {
  const { state, dispatch } = useApp();
  const { activeFilters, sortBy } = state;
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCount = [
    activeFilters.subject,
    activeFilters.status,
    activeFilters.urgency,
  ].filter(Boolean).length;

  const hasActiveFilters = activeCount > 0;

  function clearFilters() {
    dispatch({
      type: "SET_FILTER",
      payload: { subject: null, status: null, urgency: null },
    });
  }

  const controls = (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Subject filter */}
      <Select
        value={activeFilters.subject ?? "all"}
        onValueChange={(v) =>
          dispatch({
            type: "SET_FILTER",
            payload: { subject: v === "all" ? null : v },
          })
        }
      >
        <SelectTrigger
          data-ocid="filter.subject_select"
          className="h-8 text-xs w-36 bg-card"
        >
          <SelectValue placeholder="All Subjects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Subjects</SelectItem>
          {subjects.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        value={activeFilters.status ?? "all"}
        onValueChange={(v) =>
          dispatch({
            type: "SET_FILTER",
            payload: { status: v === "all" ? null : (v as AssignmentStatus) },
          })
        }
      >
        <SelectTrigger
          data-ocid="filter.status_select"
          className="h-8 text-xs w-36 bg-card"
        >
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Urgency filter */}
      <Select
        value={activeFilters.urgency ?? "all"}
        onValueChange={(v) =>
          dispatch({
            type: "SET_FILTER",
            payload: { urgency: v === "all" ? null : (v as UrgencyLevel) },
          })
        }
      >
        <SelectTrigger
          data-ocid="filter.urgency_select"
          className="h-8 text-xs w-36 bg-card"
        >
          <SelectValue placeholder="All Urgencies" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Urgencies</SelectItem>
          {URGENCY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear all */}
      {hasActiveFilters && (
        <Button
          data-ocid="filter.clear_button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
          onClick={clearFilters}
        >
          <X className="w-3 h-3" />
          Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <div data-ocid="filter.bar" className="space-y-2">
      {/* Desktop: inline */}
      <div className="hidden sm:flex items-center justify-between gap-3 flex-wrap">
        {controls}
        {/* Sort group */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              data-ocid={`filter.sort_${opt.value}_button`}
              onClick={() => dispatch({ type: "SET_SORT", payload: opt.value })}
              className={`
                px-3 py-1 rounded-md text-xs font-medium transition-colors
                ${
                  sortBy === opt.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: collapsed */}
      <div className="flex sm:hidden items-center justify-between gap-2">
        <Button
          data-ocid="filter.mobile_toggle_button"
          variant="outline"
          size="sm"
          className="gap-2 h-8 text-xs"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {hasActiveFilters && (
            <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full">
              {activeCount}
            </Badge>
          )}
        </Button>

        {/* Mobile sort */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              data-ocid={`filter.mobile_sort_${opt.value}_button`}
              onClick={() => dispatch({ type: "SET_SORT", payload: opt.value })}
              className={`
                px-2 py-1 rounded-md text-[10px] font-medium transition-colors
                ${
                  sortBy === opt.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              {opt.value === "priority"
                ? "Priority"
                : opt.value === "deadline"
                  ? "Deadline"
                  : "Diff."}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile expanded filters */}
      {mobileOpen && <div className="sm:hidden pt-1">{controls}</div>}
    </div>
  );
}
