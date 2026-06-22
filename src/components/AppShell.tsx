import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

const links = [
  { to: "/", label: "إدخال جديد" },
  { to: "/records", label: "السجلات" },
  { to: "/violations", label: "تقرير المخالفات" },
  { to: "/inputs", label: "تقرير الإدخالات" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background">
      <header
        className="no-print sticky top-0 z-10"
        style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 text-primary-foreground">
            <div className="w-9 h-9 rounded-lg bg-white/15 grid place-items-center font-bold text-lg">ج</div>
            <div>
              <div className="font-bold text-lg leading-tight">نظام مخالفات جمصة</div>
              <div className="text-xs opacity-80">إدخال وتوزيع المخالفات</div>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`nav-link ${pathname === l.to ? "active" : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
