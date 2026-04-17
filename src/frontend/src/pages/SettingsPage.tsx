/**
 * Settings Page — Behavior profile configuration and app preferences.
 *
 * Layout is provided by the root route. No Layout wrapper here.
 */

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Brain, RefreshCw, Save, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";

// ─── Difficulty label map ──────────────────────────────────────────────────────

const DIFF_LABELS: Record<number, string> = {
  1: "Very Easy",
  2: "Easy",
  3: "Moderate",
  4: "Hard",
  5: "Expert",
};

export function SettingsPage() {
  const { state, dispatch } = useApp();
  const { theme, setTheme } = useTheme();
  const profile = state.behaviorProfile;

  const [procrastDays, setProcrastDays] = useState(
    profile.avgProcrastinationDays.toString(),
  );
  const [workHours, setWorkHours] = useState(
    profile.preferredWorkHours.toString(),
  );
  const [completionRates, setCompletionRates] = useState<
    Record<string, string>
  >({
    1: (profile.completionRateByDifficulty[1] ?? 0.95).toString(),
    2: (profile.completionRateByDifficulty[2] ?? 0.88).toString(),
    3: (profile.completionRateByDifficulty[3] ?? 0.75).toString(),
    4: (profile.completionRateByDifficulty[4] ?? 0.6).toString(),
    5: (profile.completionRateByDifficulty[5] ?? 0.45).toString(),
  });

  function handleSaveProfile() {
    const parsed = {
      avgProcrastinationDays: Number.parseFloat(procrastDays) || 2.3,
      preferredWorkHours: Math.min(
        8,
        Math.max(1, Number.parseFloat(workHours) || 2),
      ),
      completionRateByDifficulty: Object.fromEntries(
        Object.entries(completionRates).map(([k, v]) => [
          Number(k),
          Math.min(1, Math.max(0, Number.parseFloat(v) || 0.7)),
        ]),
      ),
      historicalStartDelays: profile.historicalStartDelays,
    };

    dispatch({ type: "LOAD_STATE", payload: { behaviorProfile: parsed } });
    toast.success("Behavior profile saved", {
      description:
        "Your preferences have been updated. Priority scores will recalculate.",
    });
  }

  function handleReset() {
    localStorage.clear();
    window.location.reload();
  }

  return (
    <div data-ocid="settings.page" className="px-4 md:px-8 py-6 max-w-2xl">
      {/* ── Page Header ── */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure your behavior profile to improve AI predictions.
        </p>
      </div>

      <div className="space-y-5">
        {/* ── Appearance ── */}
        <Card
          className="bg-card border-border"
          data-ocid="settings.appearance_card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Appearance</CardTitle>
            <CardDescription>Display preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Toggle between light and dark theme.
                </p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
                aria-label="Toggle dark mode"
                data-ocid="settings.dark_mode_toggle"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Study Habits ── */}
        <Card
          className="bg-card border-border"
          data-ocid="settings.study_habits_card"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <CardTitle className="font-display text-base">
                Study Habits
              </CardTitle>
            </div>
            <CardDescription>
              Calibrate your daily capacity and patterns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="work-hours"
                className="text-sm font-medium text-foreground"
              >
                Daily study capacity (hours)
              </Label>
              <Input
                id="work-hours"
                type="number"
                min="1"
                max="8"
                step="0.5"
                value={workHours}
                onChange={(e) => setWorkHours(e.target.value)}
                className="max-w-xs"
                data-ocid="settings.work_hours_input"
              />
              <p className="text-xs text-muted-foreground">
                How many hours per day can you realistically study? (1–8)
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="procrast-days"
                className="text-sm font-medium text-foreground"
              >
                Average procrastination delay (days)
              </Label>
              <Input
                id="procrast-days"
                type="number"
                min="0"
                max="14"
                step="0.5"
                value={procrastDays}
                onChange={(e) => setProcrastDays(e.target.value)}
                className="max-w-xs"
                data-ocid="settings.procrastination_days_input"
              />
              <p className="text-xs text-muted-foreground">
                Extra buffer days. Higher = earlier recommended start dates.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Completion Rates ── */}
        <Card
          className="bg-card border-border"
          data-ocid="settings.completion_rates_card"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <CardTitle className="font-display text-base">
                Completion Rate by Difficulty
              </CardTitle>
            </div>
            <CardDescription>
              Historical success rate per difficulty (0.0–1.0). Influences risk
              scoring.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {([1, 2, 3, 4, 5] as const).map((diff) => {
                const rate = Math.min(
                  1,
                  Math.max(0, Number.parseFloat(completionRates[diff]) || 0),
                );
                return (
                  <div
                    key={diff}
                    className="space-y-1.5"
                    data-ocid={`settings.completion_rate.${diff}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          Difficulty {diff}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {DIFF_LABELS[diff]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          value={completionRates[diff]}
                          onChange={(e) =>
                            setCompletionRates((prev) => ({
                              ...prev,
                              [diff]: e.target.value,
                            }))
                          }
                          className="w-20 h-7 text-xs text-right"
                          data-ocid={`settings.completion_rate_input.${diff}`}
                        />
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {Math.round(rate * 100)}%
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${rate * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <div className="flex items-center justify-between pb-8">
          <Button
            variant="outline"
            onClick={handleReset}
            data-ocid="settings.reset_button"
            className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset to Sample Data
          </Button>

          <Button
            onClick={handleSaveProfile}
            data-ocid="settings.save_button"
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
