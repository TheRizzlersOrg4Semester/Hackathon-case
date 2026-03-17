export type BlobMotionSeed = {
  id: string;
  sizePx: number;
};

export type BlobMotionState = {
  id: string;
  sizePx: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  phaseSpeed: number;
  pulseAmplitude: number;
  orbitAmplitude: number;
  orbitFrequency: number;
  orbitPhase: number;
  noiseOffset: number;
  edgePadding: number;
  curveBias: number;
  driftBias: number;
  wobbleX: number;
  wobbleY: number;
  wobblePhase: number;
  wobbleSpeed: number;
  rotationPhase: number;
  rotationSpeed: number;
  shapeBase: number[];
  shapeMorphAmplitude: number;
};

export type MotionBounds = {
  width: number;
  height: number;
};

const MIN_CONTAINER_WIDTH = 280;
const MIN_CONTAINER_HEIGHT = 220;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function getRandomFromSeed(seed: string, salt: string): number {
  return hashSeed(`${seed}:${salt}`);
}

function getSpeedForBlob(sizePx: number): number {
  // Larger blobs should feel heavier/slower.
  return clamp(28 + (110 - sizePx) * 0.35, 12, 42);
}

function buildShapeBase(id: string): number[] {
  return [
    40 + getRandomFromSeed(id, "shape0") * 24,
    40 + getRandomFromSeed(id, "shape1") * 24,
    40 + getRandomFromSeed(id, "shape2") * 24,
    40 + getRandomFromSeed(id, "shape3") * 24,
    40 + getRandomFromSeed(id, "shape4") * 24,
    40 + getRandomFromSeed(id, "shape5") * 24,
    40 + getRandomFromSeed(id, "shape6") * 24,
    40 + getRandomFromSeed(id, "shape7") * 24
  ];
}

function createInitialPoint(index: number, total: number, width: number, height: number, margin: number) {
  // Deterministic phyllotaxis-like distribution to reduce obvious clumping.
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const radius = Math.sqrt((index + 0.5) / Math.max(total, 1)) * Math.min(width, height) * 0.44;
  const angle = index * goldenAngle;

  const centerX = width / 2;
  const centerY = height / 2;
  const rawX = centerX + Math.cos(angle) * radius;
  const rawY = centerY + Math.sin(angle) * radius;

  return {
    x: clamp(rawX, margin, width - margin),
    y: clamp(rawY, margin, height - margin)
  };
}

export function createInitialBlobMotionStates(seeds: BlobMotionSeed[], bounds: MotionBounds): BlobMotionState[] {
  const width = Math.max(bounds.width, MIN_CONTAINER_WIDTH);
  const height = Math.max(bounds.height, MIN_CONTAINER_HEIGHT);

  return seeds.map((seed, index) => {
    const margin = seed.sizePx / 2 + 8;
    const point = createInitialPoint(index, seeds.length, width, height, margin);

    const direction = getRandomFromSeed(seed.id, "direction") * Math.PI * 2;
    const baseSpeed = getSpeedForBlob(seed.sizePx);

    return {
      id: seed.id,
      sizePx: seed.sizePx,
      x: point.x,
      y: point.y,
      vx: Math.cos(direction) * baseSpeed,
      vy: Math.sin(direction) * baseSpeed,
      phase: getRandomFromSeed(seed.id, "phase") * Math.PI * 2,
      phaseSpeed: 0.8 + getRandomFromSeed(seed.id, "phaseSpeed") * 0.8,
      pulseAmplitude: 0.012 + getRandomFromSeed(seed.id, "pulseAmplitude") * 0.022,
      orbitAmplitude: 6 + getRandomFromSeed(seed.id, "orbitAmplitude") * 12,
      orbitFrequency: 0.45 + getRandomFromSeed(seed.id, "orbitFrequency") * 0.55,
      orbitPhase: getRandomFromSeed(seed.id, "orbitPhase") * Math.PI * 2,
      noiseOffset: getRandomFromSeed(seed.id, "noiseOffset") * Math.PI * 2,
      edgePadding: margin,
      curveBias: -1 + getRandomFromSeed(seed.id, "curveBias") * 2,
      driftBias: -1 + getRandomFromSeed(seed.id, "driftBias") * 2,
      wobbleX: 3 + getRandomFromSeed(seed.id, "wobbleX") * 6,
      wobbleY: 2 + getRandomFromSeed(seed.id, "wobbleY") * 5,
      wobblePhase: getRandomFromSeed(seed.id, "wobblePhase") * Math.PI * 2,
      wobbleSpeed: 0.8 + getRandomFromSeed(seed.id, "wobbleSpeed") * 0.8,
      rotationPhase: getRandomFromSeed(seed.id, "rotationPhase") * Math.PI * 2,
      rotationSpeed: 0.1 + getRandomFromSeed(seed.id, "rotationSpeed") * 0.35,
      shapeBase: buildShapeBase(seed.id),
      shapeMorphAmplitude: 1.1 + getRandomFromSeed(seed.id, "shapeMorphAmplitude") * 2.1
    };
  });
}

function applyHydrophobicRepulsion(states: BlobMotionState[], dt: number) {
  // Pairwise rejection impulse + overlap correction for droplet-like separation.
  for (let i = 0; i < states.length; i += 1) {
    for (let j = i + 1; j < states.length; j += 1) {
      const a = states[i];
      const b = states[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 0.001;
      const minDistance = (a.sizePx + b.sizePx) * 0.52;

      if (distance < minDistance) {
        const overlap = minDistance - distance;
        const nx = dx / distance;
        const ny = dy / distance;
        const invMassA = 1 / Math.max(a.sizePx, 1);
        const invMassB = 1 / Math.max(b.sizePx, 1);
        const invMassSum = invMassA + invMassB || 1;

        // Positional correction keeps blobs from visually sitting inside each other.
        const correction = overlap * 0.9;
        a.x -= nx * correction * (invMassA / invMassSum);
        a.y -= ny * correction * (invMassA / invMassSum);
        b.x += nx * correction * (invMassB / invMassSum);
        b.y += ny * correction * (invMassB / invMassSum);

        // Velocity impulse rejects blobs at collision like hydrophobic droplets.
        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const normalVelocity = rvx * nx + rvy * ny;
        if (normalVelocity < 0) {
          const restitution = 0.92;
          const impulse = (-(1 + restitution) * normalVelocity) / invMassSum;
          a.vx -= impulse * nx * invMassA;
          a.vy -= impulse * ny * invMassA;
          b.vx += impulse * nx * invMassB;
          b.vy += impulse * ny * invMassB;
        }

        // Continuous repulsion keeps near-touches from clumping.
        const repel = (overlap / minDistance) * 38 * dt;
        a.vx -= nx * repel * (invMassA / invMassSum);
        a.vy -= ny * repel * (invMassA / invMassSum);
        b.vx += nx * repel * (invMassB / invMassSum);
        b.vy += ny * repel * (invMassB / invMassSum);
      }
    }
  }
}

function keepBlobInBounds(state: BlobMotionState, width: number, height: number) {
  const minX = state.edgePadding;
  const maxX = width - state.edgePadding;
  const minY = state.edgePadding;
  const maxY = height - state.edgePadding;

  if (state.x < minX) {
    state.x = minX;
    state.vx = Math.abs(state.vx) * 0.9;
  } else if (state.x > maxX) {
    state.x = maxX;
    state.vx = -Math.abs(state.vx) * 0.9;
  }

  if (state.y < minY) {
    state.y = minY;
    state.vy = Math.abs(state.vy) * 0.9;
  } else if (state.y > maxY) {
    state.y = maxY;
    state.vy = -Math.abs(state.vy) * 0.9;
  }
}

export function stepBlobMotionStates(
  previousStates: BlobMotionState[],
  bounds: MotionBounds,
  dtSeconds: number
): BlobMotionState[] {
  const width = Math.max(bounds.width, MIN_CONTAINER_WIDTH);
  const height = Math.max(bounds.height, MIN_CONTAINER_HEIGHT);
  const dt = clamp(dtSeconds, 0.008, 0.05);

  const states = previousStates.map((state) => ({ ...state }));

  applyHydrophobicRepulsion(states, dt);

  for (const state of states) {
    const maxSpeed = getSpeedForBlob(state.sizePx);
    const t = state.phase;

    // Flow-field-style steering creates softer, less scheduled motion.
    const flowX =
      Math.sin(state.y * 0.012 + t * 0.83 + state.noiseOffset) +
      0.5 * Math.cos(state.x * 0.009 - t * 0.57 + state.orbitPhase);
    const flowY =
      Math.cos(state.x * 0.011 + t * 0.79 + state.noiseOffset * 0.8) +
      0.5 * Math.sin(state.y * 0.01 - t * 0.52 + state.orbitPhase);
    const curveX = Math.sin(t * 0.63 + state.orbitPhase) * state.curveBias;
    const curveY = Math.cos(t * 0.57 + state.orbitPhase * 0.9) * state.driftBias;
    state.vx += (flowX * 0.82 + curveX) * dt * 7.4;
    state.vy += (flowY * 0.82 + curveY) * dt * 7.4;

    // Gentle damping keeps motion smooth and prevents runaway velocity.
    state.vx *= 0.992;
    state.vy *= 0.992;

    const speed = Math.hypot(state.vx, state.vy) || 0.001;
    if (speed > maxSpeed) {
      const ratio = maxSpeed / speed;
      state.vx *= ratio;
      state.vy *= ratio;
    }

    state.x += state.vx * dt;
    state.y += state.vy * dt;
    keepBlobInBounds(state, width, height);
    state.phase += dt * state.phaseSpeed;
  }

  return states;
}

export function getBlobRenderStyle(state: BlobMotionState) {
  const orbitX = Math.cos(state.phase * state.orbitFrequency + state.orbitPhase) * state.orbitAmplitude;
  const orbitY = Math.sin(state.phase * state.orbitFrequency * 0.85 + state.orbitPhase) * state.orbitAmplitude * 0.8;
  const wobbleX = Math.sin(state.phase * state.wobbleSpeed + state.wobblePhase) * state.wobbleX;
  const wobbleY = Math.cos(state.phase * state.wobbleSpeed * 0.84 + state.wobblePhase) * state.wobbleY;
  const pulse = 1 + Math.sin(state.phase * 2.2 + state.orbitPhase) * state.pulseAmplitude;
  const rotationDeg = Math.sin(state.phase * state.rotationSpeed + state.rotationPhase) * 8;
  const morphPhase = state.phase * (0.7 + state.rotationSpeed);
  const shape = state.shapeBase.map((value, index) =>
    clamp(
      value +
        Math.sin(morphPhase + index * 0.78 + state.wobblePhase * 0.7) *
          state.shapeMorphAmplitude,
      34,
      68
    )
  );
  const borderRadius = `${shape[0]}% ${shape[1]}% ${shape[2]}% ${shape[3]}% / ${shape[4]}% ${shape[5]}% ${shape[6]}% ${shape[7]}%`;

  return {
    leftPercent: state.x,
    topPercent: state.y,
    scale: pulse,
    orbitX: orbitX + wobbleX,
    orbitY: orbitY + wobbleY,
    rotationDeg,
    borderRadius
  };
}
