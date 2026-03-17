"use client";

import React, { useMemo, useState } from "react";
import type { DonationType } from "@prisma/client";
import {
  createInitialBlobMotionStates,
  getBlobRenderStyle,
  stepBlobMotionStates,
  type BlobMotionState
} from "@/lib/domain/blob-motion";
import { mapDonationsToBlobs, type PublicDonationData } from "@/lib/domain/donor-blobs";
import { useEffect, useRef } from "react";

type DonorBlobVisualizationProps = {
  donations: PublicDonationData[];
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDonationType(type: DonationType): string {
  return type === "RECURRING" ? "Recurring donation" : "One-time donation";
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("da-DK", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function DonorBlobVisualization({ donations }: DonorBlobVisualizationProps) {
  const blobs = useMemo(() => mapDonationsToBlobs(donations), [donations]);
  const [activeBlobId, setActiveBlobId] = useState<string | null>(blobs[0]?.id ?? null);
  const [selectedBlobId, setSelectedBlobId] = useState<string | null>(null);
  const [motionStates, setMotionStates] = useState<BlobMotionState[]>([]);
  const containerRef = useRef<HTMLUListElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const displayedBlobId = selectedBlobId ?? activeBlobId;
  const displayedBlob = blobs.find((blob) => blob.id === displayedBlobId) ?? blobs[0];
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
      const nextStates = createInitialBlobMotionStates(
        blobs.map((blob) => ({
          id: blob.id,
          sizePx: blob.sizePx
        })),
        {
          width: rect.width,
          height: rect.height
        }
      );
      setMotionStates(nextStates);
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
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-100">Donor blob constellation</h2>
        <p className="rounded-2xl border border-white/15 bg-white/10 p-5 text-sm text-slate-200">
          No donations available for visualization yet.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-100">Donor blob constellation</h2>
        <p className="max-w-2xl text-sm text-slate-300">
          Each donation appears as a node in this campaign field. Larger contributions create larger blobs.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-slate-950/45 p-4 shadow-2xl md:p-6">
        <div className="campaign-map-glow" />
        <div className="campaign-map-grid" />
        <ul
          aria-label="Donation blobs"
          className="relative min-h-[300px] md:min-h-[360px]"
          ref={containerRef}
        >
          {blobs.map((blob, index) => {
            const motionState = motionStates[index];
            const fallbackStyle = {
              left: `${8 + ((index * 17) % 84)}%`,
              top: `${10 + ((index * 29) % 72)}%`,
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
            <li key={blob.id}>
              <button
                aria-label={`${blob.donorDisplayName}, ${formatCurrency(blob.amount)}, ${formatDonationType(blob.donationType)}`}
                aria-pressed={selectedBlobId === blob.id}
                className={`donor-blob ${blob.colorClass} ${selectedBlobId === blob.id ? "is-selected" : ""}`}
                onBlur={() => {
                  if (!selectedBlobId) {
                    setActiveBlobId(null);
                  }
                }}
                onClick={() => setSelectedBlobId((previous) => (previous === blob.id ? null : blob.id))}
                onFocus={() => setActiveBlobId(blob.id)}
                onMouseEnter={() => setActiveBlobId(blob.id)}
                onMouseLeave={() => {
                  if (!selectedBlobId) {
                    setActiveBlobId(null);
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
            </li>
            );
          })}
        </ul>
      </div>

      {displayedBlob ? (
        <div
          aria-live="polite"
          className="grid gap-2 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-slate-100 backdrop-blur md:grid-cols-2"
          data-testid="blob-detail-panel"
        >
          <p className="font-semibold text-white">{displayedBlob.donorDisplayName}</p>
          <p className="font-semibold text-white">{formatCurrency(displayedBlob.amount)}</p>
          <p className="text-slate-200">{formatDonationType(displayedBlob.donationType)}</p>
          <p className="text-slate-300">{formatTimestamp(displayedBlob.createdAt)}</p>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-white/20 bg-slate-950/45">
        <table className="min-w-full text-left text-sm text-slate-100">
          <caption className="sr-only">Accessible donation details table</caption>
          <thead className="border-b border-white/15 bg-white/10">
            <tr>
              <th className="px-3 py-2 font-semibold">Donor</th>
              <th className="px-3 py-2 font-semibold">Amount</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {blobs.map((blob) => (
              <tr className="border-b border-white/10 last:border-b-0" key={`row-${blob.id}`}>
                <td className="px-3 py-2">{blob.donorDisplayName}</td>
                <td className="px-3 py-2">{formatCurrency(blob.amount)}</td>
                <td className="px-3 py-2">{formatDonationType(blob.donationType)}</td>
                <td className="px-3 py-2 text-slate-300">{formatTimestamp(blob.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
