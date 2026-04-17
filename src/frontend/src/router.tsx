/**
 * TanStack Router configuration.
 *
 * Routes:
 *   /            → redirect to /dashboard
 *   /dashboard   → DashboardPage
 *   /planner     → PlannerPage
 *   /settings    → SettingsPage
 *
 * All routes render inside Layout (Navbar + Sidebar + main).
 */

import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";

import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { PlannerPage } from "./pages/PlannerPage";
import { SettingsPage } from "./pages/SettingsPage";

// ─── Root Route — Layout wrapper ──────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

// ─── Index Route (redirect to /dashboard) ─────────────────────────────────────

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});

// ─── Feature Routes ───────────────────────────────────────────────────────────

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const plannerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/planner",
  component: PlannerPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

// ─── Route Tree ───────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  plannerRoute,
  settingsRoute,
]);

// ─── Router Instance ──────────────────────────────────────────────────────────

export const router = createRouter({ routeTree });

// Register router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
