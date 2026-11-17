import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Panel, Tilt } from "@/components/glass";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PACKAGES,
  createInvestment,
  useInvestments,
  type InvestmentPackage,
} from "@/lib/investment";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Investment Plans — Crystal Glow Labs" },
      {
        name: "description",
        content: "Choose a premium investment package and start earning.",
      },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const { balance } = useInvestments();
  const [selected, setSelected] = useState<InvestmentPackage | null>(null);
  const [amount, setAmount] = useState("");

  const handleInvest = () => {
    if (!selected) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    const result = createInvestment(selected.id, value);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`Invested $${value.toLocaleString()} in ${selected.name}`);
    setSelected(null);
    setAmount("");
  };

  return (
    <div className="space-y-6 animate-rise">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Earn with elegance
          </p>
          <h1 className="text-2xl sm:text-3xl">Investment Plans</h1>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Available Balance
          </p>
          <p className="num text-xl text-rosegold">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {PACKAGES.map((pkg, index) => (
          <Tilt key={pkg.id} max={6} className="cinematic-stagger" style={{ "--stagger": index } as React.CSSProperties}>
            <Panel
              iridescent={selected?.id === pkg.id}
              className={cn(
                "flex h-full flex-col p-6 transition-shadow",
                selected?.id === pkg.id && "ring-1 ring-rosegold/40",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-medium">{pkg.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pkg.duration} day{pkg.duration > 1 ? "s" : ""} · ROI
                  </p>
                </div>
                <div className="text-right">
                  <p className="num text-2xl text-rosegold">{pkg.increase}%</p>
                  {pkg.bonus > 0 && (
                    <p className="text-xs text-success">+{pkg.bonus}% bonus</p>
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min</span>
                  <span className="num">${pkg.minAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max</span>
                  <span className="num">${pkg.maxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected return</span>
                  <span className="num text-success">
                    +{(pkg.increase + pkg.bonus).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Visual duration indicator */}
              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>Duration</span>
                  <span>{pkg.duration * 24}h</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rosegold/80 to-rosegold"
                    style={{ width: `${Math.min(100, (pkg.duration / 2) * 100)}%` }}
                  />
                </div>
              </div>

              <Button
                className="mt-6 w-full"
                variant={selected?.id === pkg.id ? "default" : "secondary"}
                onClick={() => {
                  setSelected(pkg);
                  setAmount(String(pkg.minAmount));
                }}
              >
                {selected?.id === pkg.id ? "Selected" : "Select Plan"}
              </Button>
            </Panel>
          </Tilt>
        ))}
      </div>

      {/* Invest sheet */}
      {selected && (
        <Panel strong className="sticky bottom-24 z-20 p-6 lg:bottom-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Investing in <span className="text-foreground">{selected.name}</span>
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={selected.minAmount}
                  max={selected.maxAmount}
                  className="num text-lg"
                  placeholder={String(selected.minAmount)}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Expected profit:{" "}
                <span className="text-success">
                  $
                  {(
                    (Number(amount) || 0) *
                    ((selected.increase + selected.bonus) / 100)
                  ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button onClick={handleInvest}>Confirm Investment</Button>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
