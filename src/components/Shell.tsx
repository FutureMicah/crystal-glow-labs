import { Link, useRouterState } from "@tanstack/react-router";
import { CreditCard, LayoutGrid, Repeat2, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Aurora } from "./Aurora";

const NAV = [
  { to: "/", label: "Portfolio", icon: LayoutGrid },
  { to: "/cards", label: "Cards", icon: CreditCard },
  { to: "/swap", label: "Swap", icon: Repeat2 },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh">
      <Aurora />

      {/* Desktop side navigation */}
      <aside className="fixed left-0 top-0 z-30 hidden h-dvh w-60 flex-col justify-between p-5 lg:flex">
        <div className="glass iridescent-edge flex h-full flex-col rounded-3xl p-5">
          <Link to="/" className="mb-8 flex items-center gap-2">
            <Sparkles className="size-4 text-rosegold" aria-hidden />
            <span className="font-display text-2xl tracking-[0.35em] text-metal">AURUM</span>
          </Link>
          <nav className="flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "press flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  path === to
                    ? "glass-strong text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
          <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
            Frosted crystal edition · v1.0
          </p>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-[1600px] px-4 pb-28 pt-5 sm:px-6 lg:pb-10 lg:pl-64 lg:pr-8">
        {children}
      </main>

      {/* Mobile / tablet bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="glass-strong iridescent-edge mx-auto flex max-w-md items-center justify-around rounded-full p-1.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className={cn(
                "press flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-3 py-2 text-[11px]",
                path === to
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
