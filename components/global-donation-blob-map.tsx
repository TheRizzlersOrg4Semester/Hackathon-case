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

type DragState = {
  blobId: string;
  pointerId: number;
  pointerOffsetX: number;
  pointerOffsetY: number;
  startPointerX: number;
  startPointerY: number;
  lastPointerX: number;
  lastPointerY: number;
  lastTimestamp: number;
  velocityX: number;
  velocityY: number;
  moved: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

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
  const dragStateRef = useRef<DragState | null>(null);
  const clickSuppressionRef = useRef<string | null>(null);

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

  const updateDraggedBlobPosition = (
    blobId: string,
    clientX: number,
    clientY: number,
    velocityX?: number,
    velocityY?: number
  ) => {
    if (!containerRef.current) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    setMotionStates((previous) =>
      previous.map((state) => {
        if (state.id !== blobId) {
          return state;
        }

        const x = clamp(clientX - rect.left, state.edgePadding, rect.width - state.edgePadding);
        const y = clamp(clientY - rect.top, state.edgePadding, rect.height - state.edgePadding);
        return {
          ...state,
          x,
          y,
          vx: velocityX ?? 0,
          vy: velocityY ?? 0
        };
      })
    );
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      event.preventDefault();

      const now = event.timeStamp || performance.now();
      const dt = Math.max((now - dragState.lastTimestamp) / 1000, 0.001);
      const nextPointerX = event.clientX;
      const nextPointerY = event.clientY;
      const rawVelocityX = (nextPointerX - dragState.lastPointerX) / dt;
      const rawVelocityY = (nextPointerY - dragState.lastPointerY) / dt;

      dragState.velocityX = rawVelocityX * 0.28;
      dragState.velocityY = rawVelocityY * 0.28;
      dragState.lastPointerX = nextPointerX;
      dragState.lastPointerY = nextPointerY;
      dragState.lastTimestamp = now;

      if (
        !dragState.moved &&
        Math.hypot(nextPointerX - dragState.startPointerX, nextPointerY - dragState.startPointerY) > 6
      ) {
        dragState.moved = true;
      }

      updateDraggedBlobPosition(
        dragState.blobId,
        nextPointerX - dragState.pointerOffsetX,
        nextPointerY - dragState.pointerOffsetY
      );
    };

    const finishDrag = (pointerId: number) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== pointerId) {
        return;
      }

      updateDraggedBlobPosition(
        dragState.blobId,
        dragState.lastPointerX - dragState.pointerOffsetX,
        dragState.lastPointerY - dragState.pointerOffsetY,
        dragState.velocityX,
        dragState.velocityY
      );

      if (dragState.moved) {
        clickSuppressionRef.current = dragState.blobId;
      }

      dragStateRef.current = null;
    };

    const handleWindowPointerUp = (event: PointerEvent) => {
      finishDrag(event.pointerId);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, []);

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
            const isDragging = dragStateRef.current?.blobId === blob.id;
            const fallbackStyle = {
              left: `${blob.leftPercent}%`,
              top: `${blob.topPercent}%`,
              transform: "translate(-50%, -50%)"
            } as const;
            const render = motionState ? getBlobRenderStyle(motionState) : null;

            const motionStyle =
              motionState && !reducedMotion && !isDragging
                ? {
                    left: `${render!.leftPercent}px`,
                    top: `${render!.topPercent}px`,
                    transform: `translate(calc(-50% + ${render!.orbitX}px), calc(-50% + ${render!.orbitY}px)) rotate(${render!.rotationDeg}deg) scale(${render!.scale})`
                  }
                : motionState
                  ? {
                      left: `${motionState.x}px`,
                      top: `${motionState.y}px`,
                      transform: "translate(-50%, -50%)"
                    }
                  : fallbackStyle;

            return (
            <button
              aria-label={`${blob.donorDisplayName}, ${formatCurrency(blob.amount)}, ${formatDonationType(blob.donationType)}, ${blob.campaignTitle}`}
              aria-pressed={selectedId === blob.id}
              className={`donor-blob ${blob.colorClass} ${selectedId === blob.id ? "is-selected" : ""} ${isDragging ? "is-dragging" : ""}`}
              key={blob.id}
              onBlur={() => {
                if (!selectedId) {
                  setActiveId(null);
                }
              }}
              onClick={() => {
                if (clickSuppressionRef.current === blob.id) {
                  clickSuppressionRef.current = null;
                  return;
                }

                setSelectedId((prev) => (prev === blob.id ? null : blob.id));
              }}
              onFocus={() => setActiveId(blob.id)}
              onMouseEnter={() => setActiveId(blob.id)}
              onMouseLeave={() => {
                if (!selectedId) {
                  setActiveId(null);
                }
              }}
              onPointerDown={(event) => {
                if (!containerRef.current) {
                  return;
                }

                const rect = containerRef.current.getBoundingClientRect();
                const state = motionStates[index];
                const centerX = rect.left + (state?.x ?? (blob.leftPercent / 100) * rect.width);
                const centerY = rect.top + (state?.y ?? (blob.topPercent / 100) * rect.height);

                dragStateRef.current = {
                  blobId: blob.id,
                  pointerId: event.pointerId,
                  pointerOffsetX: event.clientX - centerX,
                  pointerOffsetY: event.clientY - centerY,
                  startPointerX: event.clientX,
                  startPointerY: event.clientY,
                  lastPointerX: event.clientX,
                  lastPointerY: event.clientY,
                  lastTimestamp: event.timeStamp || performance.now(),
                  velocityX: 0,
                  velocityY: 0,
                  moved: false
                };

                clickSuppressionRef.current = null;
                setActiveId(blob.id);
                updateDraggedBlobPosition(blob.id, centerX, centerY, 0, 0);
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
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
