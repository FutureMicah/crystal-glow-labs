import { useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  strong,
  iridescent,
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  iridescent?: boolean;
}) {
  return (
    <div
      className={cn(
        strong ? "glass-strong" : "glass",
        iridescent && "iridescent-edge",
        "rounded-2xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Pointer-reactive 3D tilt wrapper with specular sheen. */
export function Tilt({
  children,
  className,
  max = 10,
  style,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(1200px) rotateY(${(px - 0.5) * max * 2}deg) rotateX(${(0.5 - py) * max * 2}deg) translateZ(0)`;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  };
  const reset = () => {
    const el = ref.current;
    if (el) el.style.transform = "perspective(1200px)";
  };

  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={reset}
      className={cn(
        "relative transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] will-change-transform",
        className,
      )}
      style={{ transform: "perspective(1200px)", ...style }}
    >
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-60"
        style={{
          background:
            "radial-gradient(600px circle at var(--mx,50%) var(--my,0%), color-mix(in oklab, white 45%, transparent), transparent 45%)",
        }}
      />
    </div>
  );
}
