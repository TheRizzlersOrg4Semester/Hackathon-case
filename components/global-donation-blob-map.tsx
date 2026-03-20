"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createInitialBlobMotionStates,
  getBlobRenderStyle,
  stepBlobMotionStates,
  type BlobMotionState
} from "@/lib/domain/blob-motion";
import {
  buildBlobSurfaceBackground,
  buildBlobSurfaceShadow,
  hasRenderableCampaignImageUrl
} from "@/lib/domain/blob-colors";
import { mapGlobalDonationBlobs, type LandingDonation } from "@/lib/domain/landing";

type GlobalDonationBlobMapProps = {
  donations: LandingDonation[];
  celebrationActive?: boolean;
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

const DRAG_THRESHOLD_PX = 6;
const THROW_MULTIPLIER = 2.4;
const MAX_THROW_SPEED = 1200;
const SPLASH_RADIUS = 260;
const SPLASH_FORCE = 380;
const MOMENTUM_HOLD_SECONDS = 2.2;
const MAX_GLOBAL_BLOBS = 42;

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

export function GlobalDonationBlobMap({ donations, celebrationActive = false }: GlobalDonationBlobMapProps) {
  const allBlobs = useMemo(() => mapGlobalDonationBlobs(donations), [donations]);
  const blobs = useMemo(() => allBlobs.slice(0, MAX_GLOBAL_BLOBS), [allBlobs]);
  const campaignIdentityItems = useMemo(() => {
    const seen = new Set<string>();
    const items: Array<{ slug: string; title: string; imageUrl: string | null }> = [];

    for (const donation of donations) {
      if (seen.has(donation.campaignSlug)) {
        continue;
      }

      seen.add(donation.campaignSlug);
      items.push({
        slug: donation.campaignSlug,
        title: donation.campaignTitle,
        imageUrl: donation.campaignImageUrl
      });
    }

    return items.slice(0, 8);
  }, [donations]);
  const [activeId, setActiveId] = useState<string | null>(blobs[0]?.id ?? null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [motionStates, setMotionStates] = useState<BlobMotionState[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const boundsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const offsetRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 });
  const dragStateRef = useRef<DragState | null>(null);
  const clickSuppressionRef = useRef<string | null>(null);
  const [campaignImageErrors, setCampaignImageErrors] = useState<Record<string, true>>({});

  const currentId = selectedId ?? activeId;
  const focusedBlob = blobs.find((blob) => blob.id === currentId) ?? blobs[0];
  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const setBlobPosition = (
    blobId: string,
    clientX: number,
    clientY: number,
    velocityX = 0,
    velocityY = 0
  ) => {
    if (!containerRef.current) {
      return;
    }
    const rectLeft = offsetRef.current.left;
    const rectTop = offsetRef.current.top;
    const width = boundsRef.current.width;
    const height = boundsRef.current.height;
    if (width <= 0 || height <= 0) {
      return;
    }

    setMotionStates((previous) =>
      previous.map((state) => {
        if (state.id !== blobId) {
          return state;
        }

        return {
          ...state,
          x: clamp(clientX - rectLeft, state.edgePadding, width - state.edgePadding),
          y: clamp(clientY - rectTop, state.edgePadding, height - state.edgePadding),
          vx: velocityX,
          vy: velocityY
        };
      })
    );
  };

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
      boundsRef.current = { width: rect.width, height: rect.height };
      offsetRef.current = { left: rect.left, top: rect.top };
      setMotionStates(
        createInitialBlobMotionStates(
          blobs.map((blob) => ({
            id: blob.id,
            sizePx: blob.sizePx,
            groupKey: blob.magnetGroupKey
          })),
          {
            width: rect.width,
            height: rect.height
          }
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

      const previousTimestamp = lastTimestampRef.current ?? timestamp;
      const dt = (timestamp - previousTimestamp) / 1000;
      lastTimestampRef.current = timestamp;
      const width = boundsRef.current.width;
      const height = boundsRef.current.height;
      if (width <= 0 || height <= 0) {
        animationFrameRef.current = window.requestAnimationFrame(step);
        return;
      }

      setMotionStates((previous) => {
        const draggedBlob = draggingId ? previous.find((state) => state.id === draggingId) : null;
        const stepped = stepBlobMotionStates(previous, { width, height }, dt);

        if (!draggedBlob) {
          return stepped;
        }

        return stepped.map((state) =>
          state.id === draggedBlob.id
            ? {
                ...draggedBlob,
                vx: 0,
                vy: 0
              }
            : state
        );
      });

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
  }, [draggingId, motionStates.length, reducedMotion]);

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

      dragState.velocityX = rawVelocityX * 0.42;
      dragState.velocityY = rawVelocityY * 0.42;
      dragState.lastPointerX = nextPointerX;
      dragState.lastPointerY = nextPointerY;
      dragState.lastTimestamp = now;

      if (
        !dragState.moved &&
        Math.hypot(nextPointerX - dragState.startPointerX, nextPointerY - dragState.startPointerY) > DRAG_THRESHOLD_PX
      ) {
        dragState.moved = true;
      }

      setBlobPosition(
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

      if (!containerRef.current) {
        dragStateRef.current = null;
        setDraggingId(null);
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const releaseX = dragState.lastPointerX - dragState.pointerOffsetX - rect.left;
      const releaseY = dragState.lastPointerY - dragState.pointerOffsetY - rect.top;
      const thrownVx = clamp(dragState.velocityX * THROW_MULTIPLIER, -MAX_THROW_SPEED, MAX_THROW_SPEED);
      const thrownVy = clamp(dragState.velocityY * THROW_MULTIPLIER, -MAX_THROW_SPEED, MAX_THROW_SPEED);

      setMotionStates((previous) =>
        previous.map((state) => {
          if (state.id === dragState.blobId) {
            return {
              ...state,
              x: clamp(releaseX, state.edgePadding, rect.width - state.edgePadding),
              y: clamp(releaseY, state.edgePadding, rect.height - state.edgePadding),
              vx: thrownVx,
              vy: thrownVy,
              excitement: 4.4,
              momentumHold: MOMENTUM_HOLD_SECONDS,
              phaseSpeed: clamp(state.phaseSpeed + Math.hypot(thrownVx, thrownVy) / 500, 0.8, 2.2),
              orbitAmplitude: clamp(state.orbitAmplitude + Math.hypot(thrownVx, thrownVy) / 40, 6, 24),
              wobbleX: clamp(state.wobbleX + Math.abs(thrownVx) / 120, 3, 12),
              wobbleY: clamp(state.wobbleY + Math.abs(thrownVy) / 120, 2, 11),
              rotationSpeed: clamp(state.rotationSpeed + Math.hypot(thrownVx, thrownVy) / 1000, 0.1, 1.2)
            };
          }

          const dx = state.x - releaseX;
          const dy = state.y - releaseY;
          const distance = Math.hypot(dx, dy);
          const splashRange = SPLASH_RADIUS + state.sizePx * 0.35;

          if (distance === 0 || distance > splashRange) {
            return state;
          }

          const strength = (1 - distance / splashRange) * SPLASH_FORCE;
          return {
            ...state,
            excitement: clamp(Math.max(state.excitement, 1.6), 1, 4.8),
            momentumHold: Math.max(state.momentumHold, 0.9),
            vx: state.vx + (dx / distance) * strength + thrownVx * 0.08,
            vy: state.vy + (dy / distance) * strength + thrownVy * 0.08
          };
        })
      );

      if (dragState.moved) {
        clickSuppressionRef.current = dragState.blobId;
      }

      dragStateRef.current = null;
      setDraggingId(null);
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
      <section className="landing-panel ui-section-stack">
        <h2 className="type-section text-white">Global donation blob map</h2>
        <p className="type-body-sm text-muted">No donations available yet. Seed data or new donations will populate this view.</p>
      </section>
    );
  }

  return (
    <section className={`landing-panel ui-section-stack ${celebrationActive ? "celebration-panel" : ""}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="type-section text-white">Global donation blob map</h2>
          <p className="type-body-sm max-w-2xl text-muted">
            Grab a blob, yeet it across the field, and watch the whole puddle turn into a tiny jelly riot.
          </p>
          {campaignIdentityItems.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {campaignIdentityItems.map((campaign) => (
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs text-slate-100"
                  key={campaign.slug}
                >
                  {campaign.imageUrl ? (
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 rounded-full border border-white/35 bg-white/20"
                      style={{ backgroundImage: `url(${campaign.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
                    />
                  ) : (
                    <span aria-hidden="true" className="h-4 w-4 rounded-full border border-white/35 bg-white/20" />
                  )}
                  {campaign.title}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <Link className="ui-button-secondary" href="/campaigns">
          Explore all campaigns
        </Link>
      </div>

      <div className={`relative overflow-hidden rounded-3xl border border-white/20 bg-slate-950/45 p-4 md:p-6 ${celebrationActive ? "celebration-map-shell" : ""}`}>
        <div className="landing-map-glow" />
        <div className="landing-map-aurora" />
        {celebrationActive ? <div aria-hidden="true" className="celebration-map-glimmer" /> : null}
        <div className="landing-map-grid" />
        <div className="landing-map-noise" />
        <div className="landing-map-vignette" />
        <div
          className="relative h-[420px] w-full md:h-[520px]"
          ref={containerRef}
          role="img"
          aria-label="Donation activity map"
        >
          {blobs.map((blob, index) => {
            const motionState = motionStates[index];
            const isDragging = draggingId === blob.id;
            const canRenderCampaignImage =
              hasRenderableCampaignImageUrl(blob.campaignImageUrl) && !campaignImageErrors[blob.id];
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
                      transform: "translate(-50%, -50%) scale(1.06)"
                    }
                  : fallbackStyle;

            return (
              <button
                aria-label={`${blob.donorDisplayName}, ${formatCurrency(blob.amount)}, ${formatDonationType(blob.donationType)}, ${blob.campaignTitle}`}
                aria-pressed={selectedId === blob.id}
                className={`donor-blob ${celebrationActive ? "is-celebrating" : ""} ${blob.colorClass} ${selectedId === blob.id ? "is-selected" : ""} ${isDragging ? "is-dragging" : ""}`}
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

                  setSelectedId((previous) => (previous === blob.id ? null : blob.id));
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
                  boundsRef.current = { width: rect.width, height: rect.height };
                  offsetRef.current = { left: rect.left, top: rect.top };
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
                  setDraggingId(blob.id);
                  setBlobPosition(blob.id, centerX, centerY);
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                style={{
                  ...motionStyle,
                  borderRadius: render?.borderRadius,
                  width: `${blob.sizePx}px`,
                  height: `${blob.sizePx}px`,
                  background: buildBlobSurfaceBackground(blob.resolvedColorHex, celebrationActive),
                  boxShadow: buildBlobSurfaceShadow(blob.resolvedColorHex, selectedId === blob.id, celebrationActive)
                }}
                type="button"
              >
                {canRenderCampaignImage ? (
                  <span aria-hidden="true" className="blob-campaign-badge">
                    <span className="blob-campaign-badge__glow" />
                    <span className="blob-campaign-badge__image">
                      <img
                        alt=""
                        className="blob-campaign-badge__img"
                        onError={() =>
                          setCampaignImageErrors((previous) => ({
                            ...previous,
                            [blob.id]: true
                          }))
                        }
                        src={blob.campaignImageUrl ?? ""}
                      />
                    </span>
                  </span>
                ) : (
                  <span aria-hidden="true" className="blob-identity-fallback">
                    <span className="blob-identity-fallback__campaign">{blob.campaignTitle}</span>
                    <span className="blob-identity-fallback__donor">{blob.donorDisplayName}</span>
                  </span>
                )}
                <span className="sr-only">{blob.donorDisplayName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {focusedBlob ? (
        <div className="grid gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white backdrop-blur md:grid-cols-6">
          <p className="font-medium">{focusedBlob.donorDisplayName}</p>
          <p>{formatCurrency(focusedBlob.amount)}</p>
          <p>{formatDonationType(focusedBlob.donationType)}</p>
          <p>{focusedBlob.campaignTitle}</p>
          <p className="flex items-center gap-2 text-slate-200">
            <span
              className="inline-flex h-3 w-3 rounded-full border border-white/40"
              style={{ background: focusedBlob.resolvedColorHex }}
            />
            Blob tone
          </p>
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
            {allBlobs.slice(0, 16).map((blob) => (
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
