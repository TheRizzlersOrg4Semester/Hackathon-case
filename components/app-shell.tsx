import Link from "next/link";
import { PropsWithChildren } from "react";
import LiquidEther from "@/components/LiquidEther";
import { GooeyNav } from "@/components/gooey-nav";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/request-campaign", label: "Request Campaign" },
  { href: "/my-donations", label: "My Donations" }
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
          <Link aria-label="PulseFund home" className="brand-logo" href="/">
            <span aria-hidden="true" className="brand-logo__mark">
              <span className="brand-logo__pulse" />
              <span className="brand-logo__orbit brand-logo__orbit--one" />
              <span className="brand-logo__orbit brand-logo__orbit--two" />
            </span>
            <span className="brand-logo__wordmark">
              <span className="brand-logo__name">PulseFund</span>
              <span className="brand-logo__tag">Community funding</span>
            </span>
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
      <footer className="relative z-20 border-t border-white/10 bg-transparent">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
          <p>PulseFund MVP demo. Privacy, analytics, and tax handling are intentionally lightweight.</p>
          <div className="flex flex-wrap gap-4">
            <Link className="text-slate-100 hover:text-cyan-200" href="/privacy">
              Privacy
            </Link>
            <Link className="text-slate-100 hover:text-cyan-200" href="/admin">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
