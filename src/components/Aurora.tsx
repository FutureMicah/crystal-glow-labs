import { useEffect, useRef } from "react";

/** Living volumetric cloud background that parallaxes with pointer / gyro. */
export function Aurora() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 40;
      ty = (e.clientY / window.innerHeight - 0.5) * 40;
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      tx = ((e.gamma ?? 0) / 45) * 30;
      ty = ((e.beta ?? 0) / 90) * 30;
    };
    const loop = () => {
      x += (tx - x) * 0.05;
      y += (ty - y) * 0.05;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("deviceorientation", onTilt);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div ref={ref} className="absolute -inset-[20%]">
        <div
          className="absolute left-[8%] top-[6%] size-[52vmax] rounded-full blur-[90px] animate-drift"
          style={{ background: "radial-gradient(circle, var(--champagne), transparent 65%)", opacity: 0.55 }}
        />
        <div
          className="absolute right-[4%] top-[24%] size-[46vmax] rounded-full blur-[100px] animate-drift-slow"
          style={{ background: "radial-gradient(circle, var(--rosegold), transparent 66%)", opacity: 0.4 }}
        />
        <div
          className="absolute bottom-[2%] left-[26%] size-[56vmax] rounded-full blur-[110px] animate-drift"
          style={{ background: "radial-gradient(circle, var(--platinum), transparent 68%)", opacity: 0.5 }}
        />
      </div>
      <Motes />
    </div>
  );
}

function Motes() {
  const motes = Array.from({ length: 18 }, (_, i) => {
    const left = (i * 37) % 100;
    const top = (i * 53) % 100;
    const dur = 8 + ((i * 7) % 11);
    const size = 2 + (i % 4);
    return { left, top, dur, size, delay: (i % 9) * 0.7 };
  });
  return (
    <div className="absolute inset-0">
      {motes.map((m, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: m.size,
            height: m.size,
            background: "var(--rosegold)",
            opacity: 0.35,
            filter: "blur(0.5px)",
            animationDuration: `${m.dur}s`,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
