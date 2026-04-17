/**
 * Layout — shared shell wrapping all pages.
 *
 * Structure:
 *   <Navbar />          fixed top header (h-14)
 *   <div>               flex row below the navbar
 *     <Sidebar />       left panel (desktop: sticky 240px, mobile: overlay)
 *     <main />          scrollable page content
 *   </div>
 *   <Toaster />         sonner toast container (bottom-right)
 *
 * All pages should render inside this layout via <Outlet />.
 */

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed top navbar */}
      <Navbar />

      {/* Content area below navbar */}
      <div className="flex pt-14">
        {/* Sidebar */}
        <Sidebar />

        {/* Main page content */}
        <main
          className="flex-1 min-w-0 overflow-x-hidden"
          data-ocid="layout.main"
        >
          {children}
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
