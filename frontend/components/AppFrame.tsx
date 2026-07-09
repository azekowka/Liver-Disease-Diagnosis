"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

// The landing page (/) is chromeless and full-bleed; every tool page gets the app shell.
export default function AppFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isLanding = path === "/";
  if (isLanding) return <>{children}</>;
  return (
    <div className="app">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}
