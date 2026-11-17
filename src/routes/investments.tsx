import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel, Tilt } from "@/components/glass";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  useInvestments,
  useLiveNow,
  getInvestmentProgress,
  formatRemaining,
  getRemainingMs,
  type Investment,
} from "@/lib/investment";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/investments")({
  head: () => ({
    meta: [
      { title: "My Investments — Crystal Glow Labs" },
      {
        name: "description",
        content: "Track your active and completed investment packages with live progress.",
      },
    ],
  }),
  component: InvestmentsPage,
});

function InvestmentsPage() {
  const { investments, balance } = useInvestments();
  const now = useLiveNow(1000); // re-render every second for smooth progress

  const active = investments.filter((i) => i.status === "active");
  const completed = investments.filter((i) => i.status === "completed");

  return (
    <div className="space-y-6 animate-rise">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Portfolio growth
          </p>
          <h1 className="text-2xl sm:text-3xl">My Investments</h1>
        </div>
        <Link to="/plans">
          <Button>New Investment</Button>
        </Link>
      </header>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Panel className="p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Available</p>
          <p className="num mt-1 text-2xl">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Active</p>
          <p className="num mt-1 text-2xl">{active.length}</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Completed</p>
          <p className="num mt-1 text-2xl">{completed.length}</p>
        </Panel>
      </div>

      {/* Active Investments with live progress bars */}
      <section>
        <h2 className="mb-3 text-lg">Active Investments</h2>
        {active.length === 0 ? (
          <Panel className="p-8 text-center">
            <p className="text-muted-foreground">No active investments yet.</p>
            <Link to="/plans" className="mt-4 inline-block">
              <Button variant="secondary">Browse Plans</Button>
            </Link>
          </Panel>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {active.map((inv, index) => (
              <InvestmentCard key={inv.id} inv={inv} now={now} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg">Completed</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {completed.map((inv, index) => (
              <InvestmentCard key={inv.id} inv={inv} now={now} index={index} completed />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InvestmentCard({
  inv,
  now,
  index,
  completed = false,
}: {
  inv: Investment;
  now: number;
  index: number;
  completed?: boolean;
}) {
  const progress = getInvestmentProgress(inv, now);
  const remaining = formatRemaining(getRemainingMs(inv, now));

  return (
    <Tilt max={5} className="cinematic-stagger" style={{ "--stagger": index } as React.CSSProperties}>
      <Panel className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-medium">{inv.packageName}</h3>
            <p className="text-sm text-muted-foreground">
              ${inv.amount.toLocaleString()} · {inv.increase}% ROI
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              completed
                ? "bg-success/15 text-success"
                : "bg-rosegold/15 text-rosegold",
            )}
          >
            {completed ? "Completed" : "Active"}
          </span>
        </div>

        {/* Live Progress Bar */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {completed ? "Finished" : "Progress"}
            </span>
            <span className="num font-medium">{progress.toFixed(1)}%</span>
          </div>
          <Progress
            value={progress}
            className={cn(
              "h-2.5",
              completed ? "[&>div]:bg-success" : "[&>div]:bg-gradient-to-r [&>div]:from-rosegold/70 [&>div]:to-rosegold",
            )}
          />
          <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
            <span>{completed ? "Profit credited" : remaining}</span>
            <span className="num text-success">
              +${inv.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Invested</p>
            <p className="num">${inv.amount.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total return</p>
            <p className="num text-success">
              ${(inv.amount + inv.profit).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </Panel>
    </Tilt>
  );
}
