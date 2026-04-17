/**
 * AddAssignmentSheet — Slide-over panel for creating a new assignment.
 * Uses shadcn Sheet, Select, Popover (calendar), Input, Textarea.
 * Shows a live preview panel with computed urgency, start date, and priority.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { format, formatISO } from "date-fns";
import { CalendarIcon, Plus, Star } from "lucide-react";
import { type ReactNode, useState } from "react";
import { DayPicker } from "react-day-picker";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import type { AppNotification, Assignment, AssignmentStatus } from "../types";
import {
  getUrgencyLevel,
  predictOptimalStartDate,
} from "../utils/predictionEngine";
import { computePriorityScore } from "../utils/priorityEngine";

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECTS = [
  "CS",
  "Math",
  "English",
  "History",
  "Physics",
  "Biology",
  "Economics",
  "Other",
];

const URGENCY_COLORS = {
  critical: "text-urgency-critical bg-urgency-critical border-urgency-critical",
  high: "text-urgency-high bg-urgency-high border-urgency-high",
  medium: "text-urgency-medium bg-urgency-medium border-urgency-medium",
  low: "text-urgency-low bg-urgency-low border-urgency-low",
};

// ─── Star Selector ────────────────────────────────────────────────────────────

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className="flex gap-1"
      role="radiogroup"
      aria-label="Difficulty rating"
    >
      {([1, 2, 3, 4, 5] as const).map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Difficulty ${n}`}
          onClick={() => onChange(n)}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          data-ocid={`add_assignment.difficulty_star.${n}`}
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              n <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted-foreground hover:fill-amber-200 hover:text-amber-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Live Preview ─────────────────────────────────────────────────────────────

interface PreviewPanelProps {
  title: string;
  subject: string;
  deadline: Date | undefined;
  estimatedHours: number;
  difficulty: number;
}

function PreviewPanel({
  title,
  subject,
  deadline,
  estimatedHours,
  difficulty,
}: PreviewPanelProps) {
  const { state } = useApp();

  if (!title.trim() || !deadline) return null;

  const safeHours = estimatedHours > 0 ? estimatedHours : 2;
  const safeDifficulty = Math.max(1, Math.min(5, difficulty)) as
    | 1
    | 2
    | 3
    | 4
    | 5;

  const draft: Assignment = {
    id: "preview",
    title,
    subject,
    deadline: formatISO(deadline, { representation: "date" }),
    estimatedHours: safeHours,
    difficulty: safeDifficulty,
    status: "pending" as AssignmentStatus,
    actualHoursSpent: 0,
    submittedAt: null,
    notes: "",
    createdAt: new Date().toISOString(),
  };

  const now = new Date();
  const urgency = getUrgencyLevel(draft, now);
  const startDate = predictOptimalStartDate(draft, state.behaviorProfile);
  const score = computePriorityScore(draft, state.behaviorProfile, now);
  const urgencyColor = URGENCY_COLORS[urgency];

  return (
    <div
      data-ocid="add_assignment.preview_panel"
      className="mt-4 p-3 rounded-lg bg-muted/50 border border-border space-y-2"
    >
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
        AI Preview
      </p>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${urgencyColor}`}
        >
          {urgency.charAt(0).toUpperCase() + urgency.slice(1)} urgency
        </span>
        <span className="text-[11px] text-muted-foreground">
          Priority score:{" "}
          <span className="font-bold text-foreground">{score}</span>/100
        </span>
      </div>
      <p className="text-[12px] text-muted-foreground">
        Suggested start:{" "}
        <span className="font-semibold text-foreground">
          {format(startDate, "MMM d, yyyy")}
        </span>
      </p>
    </div>
  );
}

// ─── Form State ───────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  subject: string;
  deadline: Date | undefined;
  estimatedHours: string;
  difficulty: number;
  notes: string;
}

const DEFAULT_FORM: FormState = {
  title: "",
  subject: "",
  deadline: undefined,
  estimatedHours: "2",
  difficulty: 0,
  notes: "",
};

interface FormErrors {
  title?: string;
  subject?: string;
  deadline?: string;
  difficulty?: string;
}

// ─── AddAssignmentSheet ───────────────────────────────────────────────────────

interface AddAssignmentSheetProps {
  trigger?: ReactNode;
}

export function AddAssignmentSheet({ trigger }: AddAssignmentSheetProps) {
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [calendarOpen, setCalendarOpen] = useState(false);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.subject) newErrors.subject = "Subject is required";
    if (!form.deadline) newErrors.deadline = "Deadline is required";
    if (!form.difficulty || form.difficulty < 1)
      newErrors.difficulty = "Select a difficulty";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validate()) return;

    const deadline = formatISO(form.deadline!, { representation: "date" });
    const difficulty = Math.max(1, Math.min(5, form.difficulty)) as
      | 1
      | 2
      | 3
      | 4
      | 5;
    const estimatedHours = Math.max(
      0.5,
      Number.parseFloat(form.estimatedHours) || 2,
    );
    const now = new Date();

    const newAssignment: Assignment = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      subject: form.subject,
      deadline,
      estimatedHours,
      difficulty,
      status: "pending",
      actualHoursSpent: 0,
      submittedAt: null,
      notes: form.notes.trim(),
      createdAt: now.toISOString(),
    };

    const startDate = predictOptimalStartDate(
      newAssignment,
      state.behaviorProfile,
    );
    const startDateISO = formatISO(startDate, { representation: "date" });

    dispatch({ type: "ADD_ASSIGNMENT", payload: newAssignment });

    // Schedule a start-soon notification for 1 day before suggested start
    const notifyDate = new Date(startDate);
    notifyDate.setDate(notifyDate.getDate() - 1);
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      type: "start-soon",
      message: `Time to start "${newAssignment.title}" — deadline is ${format(new Date(deadline), "MMM d")}`,
      scheduledAt: formatISO(notifyDate),
      seen: false,
      assignmentId: newAssignment.id,
    };
    dispatch({ type: "ADD_NOTIFICATION", payload: notification });

    toast.success("Assignment added!", {
      description: `Start by ${format(startDate, "MMM d, yyyy")}`,
    });

    setForm(DEFAULT_FORM);
    setErrors({});
    setOpen(false);

    void startDateISO; // used in toast
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild data-ocid="add_assignment.open_modal_button">
        {trigger ?? (
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            Add Assignment
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        data-ocid="add_assignment.sheet"
        side="right"
        className="w-full sm:max-w-md overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="font-display">New Assignment</SheetTitle>
          <SheetDescription>
            Fill in the details — AI will compute urgency and suggest a start
            date.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 px-1 pb-6">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Title <span className="text-urgency-critical">*</span>
            </Label>
            <Input
              id="title"
              data-ocid="add_assignment.title_input"
              placeholder="e.g. CS 401: Final Project Proposal"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              className={errors.title ? "border-urgency-critical" : ""}
            />
            {errors.title && (
              <p
                data-ocid="add_assignment.title_field_error"
                className="text-[11px] text-urgency-critical"
              >
                {errors.title}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label>
              Subject <span className="text-urgency-critical">*</span>
            </Label>
            <Select
              value={form.subject}
              onValueChange={(v) => setField("subject", v)}
            >
              <SelectTrigger
                data-ocid="add_assignment.subject_select"
                className={errors.subject ? "border-urgency-critical" : ""}
              >
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subject && (
              <p
                data-ocid="add_assignment.subject_field_error"
                className="text-[11px] text-urgency-critical"
              >
                {errors.subject}
              </p>
            )}
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <Label>
              Deadline <span className="text-urgency-critical">*</span>
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  data-ocid="add_assignment.deadline_input"
                  className={`w-full justify-start text-left font-normal ${
                    !form.deadline ? "text-muted-foreground" : ""
                  } ${errors.deadline ? "border-urgency-critical" : ""}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {form.deadline
                    ? format(form.deadline, "PPP")
                    : "Pick a deadline"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                  mode="single"
                  selected={form.deadline}
                  onSelect={(day) => {
                    setField("deadline", day);
                    setCalendarOpen(false);
                  }}
                  disabled={{ before: new Date() }}
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
            {errors.deadline && (
              <p
                data-ocid="add_assignment.deadline_field_error"
                className="text-[11px] text-urgency-critical"
              >
                {errors.deadline}
              </p>
            )}
          </div>

          {/* Estimated Hours */}
          <div className="space-y-1.5">
            <Label htmlFor="hours">Estimated Hours</Label>
            <Input
              id="hours"
              type="number"
              min={0.5}
              step={0.5}
              data-ocid="add_assignment.hours_input"
              value={form.estimatedHours}
              onChange={(e) => setField("estimatedHours", e.target.value)}
            />
          </div>

          {/* Difficulty */}
          <div className="space-y-1.5">
            <Label>
              Difficulty <span className="text-urgency-critical">*</span>
            </Label>
            <StarSelector
              value={form.difficulty}
              onChange={(v) => setField("difficulty", v)}
            />
            {errors.difficulty && (
              <p
                data-ocid="add_assignment.difficulty_field_error"
                className="text-[11px] text-urgency-critical"
              >
                {errors.difficulty}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              data-ocid="add_assignment.notes_textarea"
              placeholder="Any relevant details, links, or reminders..."
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={3}
            />
          </div>

          {/* AI Preview */}
          <PreviewPanel
            title={form.title}
            subject={form.subject}
            deadline={form.deadline}
            estimatedHours={Number.parseFloat(form.estimatedHours) || 2}
            difficulty={form.difficulty}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              data-ocid="add_assignment.cancel_button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setForm(DEFAULT_FORM);
                setErrors({});
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="add_assignment.submit_button"
              className="flex-1"
              onClick={handleSave}
            >
              Add Assignment
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
