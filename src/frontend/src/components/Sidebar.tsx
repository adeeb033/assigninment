/**
 * Sidebar — collapsible left panel.
 *
 * Desktop (md+): always visible, 240px, flex-shrink-0.
 * Mobile: slides in from left as overlay + backdrop when sidebarOpen=true.
 *
 * Sections:
 *   - Quick Filters (All / Pending / In Progress / Overdue / Due Soon)
 *   - By Subject (unique subjects derived from assignments)
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addDays, isAfter, isBefore, parseISO } from "date-fns";
import { Check, X } from "lucide-react";
import { useApp, useAssignmentsWithScores } from "../context/AppContext";
import type { AssignmentStatus } from "../types";

// ─── Filter button ─────────────────────────────────────────────────────────────

function FilterButton({
  label,
  isActive,
  count,
  onClick,
  ocid,
  countVariant = "default",
}: {
  label: string;
  isActive: boolean;
  count?: number;
  onClick: () => void;
  ocid: string;
  countVariant?: "default" | "destructive";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-ocid={ocid}
      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors text-left group
        ${
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        }`}
      aria-pressed={isActive}
    >
      <span className="flex items-center gap-2 min-w-0">
        {isActive && <Check className="w-3 h-3 shrink-0" />}
        {!isActive && <span className="w-3" />}
        <span className="truncate">{label}</span>
      </span>
      {count !== undefined && count > 0 && (
        <Badge
          variant={countVariant === "destructive" ? "destructive" : "secondary"}
          className="ml-1 h-4 min-w-[18px] text-[10px] px-1 leading-none"
        >
          {count}
        </Badge>
      )}
    </button>
  );
}

// ─── Section header ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2.5 pt-4 pb-1 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground select-none">
      {children}
    </p>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { state, dispatch } = useApp();
  const assignments = useAssignmentsWithScores();
  const { sidebarOpen, activeFilters } = state;

  const now = new Date();
  const threeDaysLater = addDays(now, 3);

  // ── Counts ────────────────────────────────────────────────────────────────────
  const counts: Record<AssignmentStatus, number> = {
    pending: 0,
    "in-progress": 0,
    submitted: 0,
    overdue: 0,
  };
  let dueSoonCount = 0;

  for (const a of assignments) {
    counts[a.status] = (counts[a.status] ?? 0) + 1;
    const dl = parseISO(a.deadline);
    if (
      a.status !== "submitted" &&
      a.status !== "overdue" &&
      isAfter(dl, now) &&
      isBefore(dl, threeDaysLater)
    ) {
      dueSoonCount++;
    }
  }

  // ── Unique subjects ────────────────────────────────────────────────────────────
  const subjectCounts: Record<string, number> = {};
  for (const a of assignments) {
    subjectCounts[a.subject] = (subjectCounts[a.subject] ?? 0) + 1;
  }
  const subjects = Object.entries(subjectCounts).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  // ── Dispatch helpers ──────────────────────────────────────────────────────────
  function setStatus(status: AssignmentStatus | null) {
    dispatch({ type: "SET_FILTER", payload: { status, subject: null } });
    if (sidebarOpen) dispatch({ type: "TOGGLE_SIDEBAR" });
  }

  function setSubject(subject: string | null) {
    dispatch({ type: "SET_FILTER", payload: { subject, status: null } });
    if (sidebarOpen) dispatch({ type: "TOGGLE_SIDEBAR" });
  }

  function clearAll() {
    dispatch({
      type: "SET_FILTER",
      payload: { subject: null, status: null, urgency: null },
    });
    if (sidebarOpen) dispatch({ type: "TOGGLE_SIDEBAR" });
  }

  // ── Sidebar content ───────────────────────────────────────────────────────────
  const content = (
    <div className="flex flex-col h-full overflow-y-auto py-3">
      {/* Mobile close button */}
      <div className="flex items-center justify-between px-3 pb-2 md:hidden">
        <span className="font-display text-sm font-semibold text-foreground">
          Filters
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          aria-label="Close sidebar"
          data-ocid="sidebar.close_button"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* ── Quick Filters ── */}
      <SectionLabel>Quick Filters</SectionLabel>
      <div className="px-1.5 space-y-0.5">
        <FilterButton
          label="All Assignments"
          isActive={!activeFilters.status && !activeFilters.subject}
          onClick={clearAll}
          ocid="sidebar.filter.all"
        />
        <FilterButton
          label="Pending"
          isActive={activeFilters.status === "pending"}
          count={counts.pending}
          onClick={() => setStatus("pending")}
          ocid="sidebar.filter.pending"
        />
        <FilterButton
          label="In Progress"
          isActive={activeFilters.status === "in-progress"}
          count={counts["in-progress"]}
          onClick={() => setStatus("in-progress")}
          ocid="sidebar.filter.in_progress"
        />
        <FilterButton
          label="Overdue"
          isActive={activeFilters.status === "overdue"}
          count={counts.overdue}
          countVariant="destructive"
          onClick={() => setStatus("overdue")}
          ocid="sidebar.filter.overdue"
        />
        <FilterButton
          label="Due Soon"
          isActive={false}
          count={dueSoonCount}
          onClick={() => {
            dispatch({
              type: "SET_FILTER",
              payload: { urgency: "critical", status: null, subject: null },
            });
            if (sidebarOpen) dispatch({ type: "TOGGLE_SIDEBAR" });
          }}
          ocid="sidebar.filter.due_soon"
        />
      </div>

      {/* ── By Subject ── */}
      {subjects.length > 0 && (
        <>
          <SectionLabel>By Subject</SectionLabel>
          <div className="px-1.5 space-y-0.5">
            {subjects.map(([subject, count]) => (
              <FilterButton
                key={subject}
                label={subject}
                isActive={activeFilters.subject === subject}
                count={count}
                onClick={() =>
                  activeFilters.subject === subject
                    ? setSubject(null)
                    : setSubject(subject)
                }
                ocid="sidebar.subject.item"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar (always visible) ───────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-card h-[calc(100vh-3.5rem)] sticky top-14 overflow-hidden"
        data-ocid="sidebar"
        aria-label="Filters"
      >
        {content}
      </aside>

      {/* ── Mobile overlay ──────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            onKeyDown={(e) => {
              if (e.key === "Escape") dispatch({ type: "TOGGLE_SIDEBAR" });
            }}
            role="button"
            tabIndex={-1}
            aria-hidden="true"
            data-ocid="sidebar.backdrop"
          />
          {/* Panel */}
          <aside
            className="fixed top-14 left-0 bottom-0 z-40 w-64 bg-card border-r border-border md:hidden overflow-hidden"
            data-ocid="sidebar.mobile"
            aria-label="Filters"
          >
            {content}
          </aside>
        </>
      )}
    </>
  );
}
