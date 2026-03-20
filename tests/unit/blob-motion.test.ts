import { describe, expect, it } from "vitest";
import {
  createInitialBlobMotionStates,
  getBlobRenderStyle,
  stepBlobMotionStates
} from "../../lib/domain/blob-motion";

describe("blob motion helper", () => {
  it("initializes blobs inside bounds", () => {
    const states = createInitialBlobMotionStates(
      [
        { id: "a", sizePx: 48 },
        { id: "b", sizePx: 72 },
        { id: "c", sizePx: 96 }
      ],
      { width: 800, height: 360 }
    );

    for (const state of states) {
      expect(state.x).toBeGreaterThanOrEqual(state.edgePadding);
      expect(state.x).toBeLessThanOrEqual(800 - state.edgePadding);
      expect(state.y).toBeGreaterThanOrEqual(state.edgePadding);
      expect(state.y).toBeLessThanOrEqual(360 - state.edgePadding);
    }
  });

  it("keeps blobs within bounds after stepping motion", () => {
    const initial = createInitialBlobMotionStates(
      [
        { id: "x", sizePx: 56 },
        { id: "y", sizePx: 84 }
      ],
      { width: 420, height: 280 }
    );

    let states = initial;
    for (let i = 0; i < 120; i += 1) {
      states = stepBlobMotionStates(states, { width: 420, height: 280 }, 1 / 60);
    }

    for (const state of states) {
      expect(state.x).toBeGreaterThanOrEqual(state.edgePadding);
      expect(state.x).toBeLessThanOrEqual(420 - state.edgePadding);
      expect(state.y).toBeGreaterThanOrEqual(state.edgePadding);
      expect(state.y).toBeLessThanOrEqual(280 - state.edgePadding);
    }
  });

  it("returns an organic border radius style for each blob", () => {
    const [state] = createInitialBlobMotionStates([{ id: "organic-blob", sizePx: 68 }], {
      width: 520,
      height: 320
    });
    const render = getBlobRenderStyle(state);

    expect(render.borderRadius).toContain("/");
    expect(render.borderRadius).toContain("%");
    expect(Number.isFinite(render.rotationDeg)).toBe(true);
  });

  it("applies droplet-like rejection when blobs overlap", () => {
    const states = createInitialBlobMotionStates(
      [
        { id: "drop-a", sizePx: 92 },
        { id: "drop-b", sizePx: 88 }
      ],
      { width: 540, height: 360 }
    );

    states[1].x = states[0].x + 2;
    states[1].y = states[0].y + 2;
    const distanceBefore = Math.hypot(states[1].x - states[0].x, states[1].y - states[0].y);

    const stepped = stepBlobMotionStates(states, { width: 540, height: 360 }, 1 / 60);
    const distanceAfter = Math.hypot(stepped[1].x - stepped[0].x, stepped[1].y - stepped[0].y);

    expect(distanceAfter).toBeGreaterThan(distanceBefore);
  });

  it("applies slight same-campaign attraction within magnetic range", () => {
    const base = createInitialBlobMotionStates(
      [
        { id: "mag-a", sizePx: 64, groupKey: "campaign-a" },
        { id: "mag-b", sizePx: 64, groupKey: "campaign-a" }
      ],
      { width: 540, height: 360 }
    );

    base[0].x = 180;
    base[0].y = 180;
    base[1].x = 330;
    base[1].y = 180;
    base[0].vx = 0;
    base[0].vy = 0;
    base[1].vx = 0;
    base[1].vy = 0;

    const grouped = base.map((state) => ({ ...state }));
    const ungrouped = base.map((state) => ({ ...state, groupKey: null }));

    const steppedGrouped = stepBlobMotionStates(grouped, { width: 540, height: 360 }, 1 / 60);
    const steppedUngrouped = stepBlobMotionStates(ungrouped, { width: 540, height: 360 }, 1 / 60);

    const groupedDistance = Math.hypot(
      steppedGrouped[1].x - steppedGrouped[0].x,
      steppedGrouped[1].y - steppedGrouped[0].y
    );
    const ungroupedDistance = Math.hypot(
      steppedUngrouped[1].x - steppedUngrouped[0].x,
      steppedUngrouped[1].y - steppedUngrouped[0].y
    );

    expect(groupedDistance).toBeLessThan(ungroupedDistance);
  });
});
