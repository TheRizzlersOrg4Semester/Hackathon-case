"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  createInitialBlobMotionStates,
  getBlobRenderStyle,
  stepBlobMotionStates,
  type BlobMotionState
} from "@/lib/domain/blob-motion";
import { mapGlobalDonationBlobs, type LandingDonation } from "@/lib/domain/landing";
import { useEffect, useRef } from "react";

type GlobalDonationBlobMapProps = {
  donations: LandingDonation[];
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDonationType(donationType: "ONE_TIME" | "RECURRING"): string {
  return donationType === "RECURRING" ? "Recurring donation" : "One-time donation";
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("da-DK", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function GlobalDonationBlobMap({ donations }: GlobalDonationBlobMapProps) {
  const blobs = useMemo(() => mapGlobalDonationBlobs(donations), [donations]);
  const [activeId, setActiveId] = useState<string | null>(blobs[0]?.id ?? null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [motionStates, setMotionStates] = useState<BlobMotionState[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const currentId = selectedId ?? activeId;
  const focusedBlob = blobs.find((blob) => blob.id === currentId) ?? blobs[0];
  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!containerRef.current || blobs.length === 0) {
      setMotionStates([]);
      return;
    }

    const refreshLayout = () => {
      if (!containerRef.current) {
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      setMotionStates(
        createInitialBlobMotionStates(
          blobs.map((blob) => ({ id: blob.id, sizePx: blob.sizePx })),
          { width: rect.width, height: rect.height }
        )
      );
    };

    refreshLayout();
    window.addEventListener("resize", refreshLayout);
    return () => {
      window.removeEventListener("resize", refreshLayout);
    };
  }, [blobs]);

  useEffect(() => {
    if (reducedMotion || motionStates.length === 0 || !containerRef.current) {
      return;
    }

    const step = (timestamp: number) => {
      if (!containerRef.current) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const previousTimestamp = lastTimestampRef.current ?? timestamp;
      const dt = (timestamp - previousTimestamp) / 1000;
      lastTimestampRef.current = timestamp;

      setMotionStates((previous) =>
        stepBlobMotionStates(previous, { width: rect.width, height: rect.height }, dt)
      );

      animationFrameRef.current = window.requestAnimationFrame(step);
    };

    animationFrameRef.current = window.requestAnimationFrame(step);
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = null;
      lastTimestampRef.current = null;
    };
  }, [motionStates.length, reducedMotion]);

  if (blobs.length === 0) {
    return (
      <section className="landing-panel space-y-3">
        <h2 className="text-2xl font-semibold text-white">Global donation blob map</h2>
        <p className="text-sm text-slate-200">No donations available yet. Seed data or new donations will populate this view.</p>
      </section>
    );
  }

  return (
    <section className="landing-panel space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Global donation blob map</h2>
          <p className="max-w-2xl text-sm text-slate-200">
            Every donation across active campaigns appears as a living node. Larger blobs represent larger contributions.
          </p>
        </div>
        <Link className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur" href="/campaigns">
          Explore all campaigns
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-slate-950/45 p-4 md:p-6">
        <div className="landing-map-glow" />
        <div className="landing-map-grid" />
        <div
          className="relative h-[420px] w-full md:h-[520px]"
          ref={containerRef}
          role="img"
          aria-label="Donation activity map"
        >
          {blobs.map((blob, index) => {
            const motionState = motionStates[index];
            const fallbackStyle = {
              left: `${blob.leftPercent}%`,
              top: `${blob.topPercent}%`,
              transform: "translate(-50%, -50%)"
            } as const;
            const render = motionState ? getBlobRenderStyle(motionState) : null;

            const motionStyle =
              motionState && !reducedMotion
                ? {
                    left: `${render!.leftPercent}px`,
                    top: `${render!.topPercent}px`,
                    transform: `translate(calc(-50% + ${render!.orbitX}px), calc(-50% + ${render!.orbitY}px)) rotate(${render!.rotationDeg}deg) scale(${render!.scale})`
                  }
                : fallbackStyle;

            return (
            <button
              aria-label={`${blob.donorDisplayName}, ${formatCurrency(blob.amount)}, ${formatDonationType(blob.donationType)}, ${blob.campaignTitle}`}
              aria-pressed={selectedId === blob.id}
              className={`donor-blob ${blob.colorClass} ${selectedId === blob.id ? "is-selected" : ""}`}
              key={blob.id}
              onBlur={() => {
                if (!selectedId) {
                  setActiveId(null);
                }
              }}
              onClick={() => setSelectedId((prev) => (prev === blob.id ? null : blob.id))}
              onFocus={() => setActiveId(blob.id)}
              onMouseEnter={() => setActiveId(blob.id)}
              onMouseLeave={() => {
                if (!selectedId) {
                  setActiveId(null);
                }
              }}
              style={{
                ...motionStyle,
                borderRadius: render?.borderRadius,
                width: `${blob.sizePx}px`,
                height: `${blob.sizePx}px`
              }}
              type="button"
            >
              <span className="sr-only">{blob.donorDisplayName}</span>
            </button>
            );
          })}
        </div>
      </div>

      {focusedBlob ? (
        <div className="grid gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white backdrop-blur md:grid-cols-5">
          <p className="font-medium">{focusedBlob.donorDisplayName}</p>
          <p>{formatCurrency(focusedBlob.amount)}</p>
          <p>{formatDonationType(focusedBlob.donationType)}</p>
          <p>{focusedBlob.campaignTitle}</p>
          <p>{formatTimestamp(focusedBlob.createdAt)}</p>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-white/20 bg-slate-950/45">
        <table className="min-w-full text-left text-sm text-slate-100">
          <caption className="sr-only">Accessible donation detail table</caption>
          <thead className="bg-white/10">
            <tr>
              <th className="px-3 py-2 font-semibold">Donor</th>
              <th className="px-3 py-2 font-semibold">Amount</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Campaign</th>
              <th className="px-3 py-2 font-semibold">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {blobs.slice(0, 16).map((blob) => (
              <tr className="border-t border-white/10" key={`fallback-${blob.id}`}>
                <td className="px-3 py-2">{blob.donorDisplayName}</td>
                <td className="px-3 py-2">{formatCurrency(blob.amount)}</td>
                <td className="px-3 py-2">{formatDonationType(blob.donationType)}</td>
                <td className="px-3 py-2">{blob.campaignTitle}</td>
                <td className="px-3 py-2">{formatTimestamp(blob.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
