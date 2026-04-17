/**
 * Navbar — fixed top header, full width, z-50.
 * Contains: logo, nav links (desktop), dark-mode toggle, notification bell, mobile hamburger.
 */

import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@tanstack/react-router";
import { GraduationCap, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useApp } from "../context/AppContext";
import { NotificationBell } from "./NotificationBell";

// ─── Nav link with active-state styling ──────────────────────────────────────

function NavLink({
  to,
  label,
  ocid,
}: {
  to: string;
  label: string;
  ocid: string;
}) {
  const router = useRouter();
  const isActive = router.state.location.pathname === to;

  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className={`text-sm font-medium transition-colors ${
        isActive
          ? "text-foreground bg-muted"
          : "text-muted-foreground hover:text-foreground hover:bg-transparent"
      }`}
    >
      <Link to={to} data-ocid={ocid}>
        {label}
      </Link>
    </Button>
  );
}

// ─── Dark mode toggle ─────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      data-ocid="navbar.theme_toggle"
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-smooth" />
      ) : (
        <Moon className="w-4 h-4 transition-smooth" />
      )}
    </Button>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar() {
  const { dispatch } = useApp();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border shadow-sm flex items-center px-4 gap-3"
      data-ocid="navbar"
    >
      {/* Logo */}
      <Link
        to="/dashboard"
        className="flex items-center gap-2 mr-4 shrink-0"
        aria-label="AssignIQ — go to dashboard"
        data-ocid="navbar.logo_link"
      >
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-primary" />
        </div>
        <span className="font-display font-bold text-base text-foreground tracking-tight">
          AssignIQ
        </span>
      </Link>

      {/* Desktop nav links */}
      <nav
        className="hidden md:flex items-center gap-1 flex-1"
        aria-label="Main navigation"
        data-ocid="navbar.nav"
      >
        <NavLink
          to="/dashboard"
          label="Dashboard"
          ocid="navbar.dashboard_link"
        />
        <NavLink
          to="/planner"
          label="Today's Plan"
          ocid="navbar.planner_link"
        />
        <NavLink to="/settings" label="Settings" ocid="navbar.settings_link" />
      </nav>

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell />

        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden"
          onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          aria-label="Toggle navigation menu"
          data-ocid="navbar.hamburger_button"
        >
          <Menu className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
