import Link from "next/link";
import { PropsWithChildren } from "react";
import LiquidEther from "@/components/LiquidEther";
import { GooeyNav } from "@/components/gooey-nav";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/history/user", label: "My Donations" },
  { href: "/admin/campaigns", label: "Admin" }
];

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-transparent">
      <div className="pointer-events-none fixed inset-0 z-0">
        <LiquidEther
          colors={["#0b1f3b", "#134a66", "#2dd4bf"]}
          mouseForce={18}
          cursorSize={75}
          isViscous
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce
          autoDemo
          autoSpeed={0.25}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <header className="relative z-10 border-b border-white/10 bg-transparent">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link className="font-semibold text-slate-100" href="/">
            PulseFund
          </Link>
          <nav aria-label="Main navigation">
            <GooeyNav
              items={navLinks}
              particleCount={15}
              particleDistances={[90, 10]}
              particleR={100}
              initialActiveIndex={0}
              animationTime={600}
              timeVariance={300}
              colors={[1, 2, 3, 1, 2, 3, 1, 4]}
            />
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
