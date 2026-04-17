/**
 * App — router + providers only.
 * All page content is rendered inside Layout via each route component.
 */

import { RouterProvider } from "@tanstack/react-router";
import { NotificationScheduler } from "./components/NotificationScheduler";
import { AppProvider } from "./context/AppContext";
import { router } from "./router";

export default function App() {
  return (
    <AppProvider>
      <NotificationScheduler />
      <RouterProvider router={router} />
    </AppProvider>
  );
}
