export type BlobColorOption = {
  label: string;
  value: string;
};

export const DONATION_BLOB_COLOR_OPTIONS: BlobColorOption[] = [
  { label: "Arctic Mint", value: "#78F3D6" },
  { label: "Lagoon Blue", value: "#4DD2FF" },
  { label: "Cobalt Bloom", value: "#4B7CFF" },
  { label: "Indigo Haze", value: "#6B6DFF" },
  { label: "Orchid Pulse", value: "#B06BFF" },
  { label: "Aurora Violet", value: "#8B5CF6" },
  { label: "Rose Quartz", value: "#F46D9B" },
  { label: "Ruby Bloom", value: "#FF5F7E" },
  { label: "Sunset Coral", value: "#FF7A59" },
  { label: "Amber Silk", value: "#FFA84E" },
  { label: "Golden Mist", value: "#FFC764" },
  { label: "Lime Spark", value: "#BEEA64" },
  { label: "Emerald Tide", value: "#2FD39A" },
  { label: "Teal Current", value: "#1EC7B5" },
  { label: "Ocean Steel", value: "#2D8BBE" },
  { label: "Midnight Navy", value: "#4667D6" }
];

const DEFAULT_BLOB_PALETTE = DONATION_BLOB_COLOR_OPTIONS.map((option) => option.value);

function normalizeHex(input: string): string {
  return input.trim().toUpperCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex).replace("#", "");
  const value = normalized.length === 3 ? normalized.split("").map((char) => `${char}${char}`).join("") : normalized;

  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);

  return { r, g, b };
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const nextR = Math.round(r + (255 - r) * amount);
  const nextG = Math.round(g + (255 - g) * amount);
  const nextB = Math.round(b + (255 - b) * amount);

  return `#${[nextR, nextG, nextB]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function isSupportedBlobColor(input?: string | null): boolean {
  if (!input) {
    return false;
  }

  const normalized = normalizeHex(input);
  return DONATION_BLOB_COLOR_OPTIONS.some((option) => normalizeHex(option.value) === normalized);
}

export function resolveBlobColor(input: string | null | undefined, index: number): string {
  if (isSupportedBlobColor(input)) {
    return normalizeHex(input as string);
  }

  return DEFAULT_BLOB_PALETTE[index % DEFAULT_BLOB_PALETTE.length];
}

export function buildBlobSurfaceBackground(hex: string): string {
  const base = normalizeHex(hex);
  const highlight = lighten(base, 0.58);
  const mid = lighten(base, 0.2);

  return `radial-gradient(circle at 28% 22%, ${highlight} 0%, ${mid} 34%, ${base} 68%, ${rgba(base, 0.92)} 100%)`;
}

export function buildBlobSurfaceShadow(hex: string, isSelected: boolean): string {
  const base = normalizeHex(hex);
  const glow = rgba(base, isSelected ? 0.58 : 0.35);
  const edge = rgba(base, 0.22);

  return [
    `0 12px 30px ${rgba("#030712", 0.48)}`,
    `0 0 0 1px ${edge}`,
    `0 0 ${isSelected ? "22px" : "14px"} ${glow}`,
    `inset 0 -12px 18px ${rgba("#020617", 0.18)}`,
    `inset 0 10px 14px rgba(255, 255, 255, 0.16)`
  ].join(", ");
}

export function buildBlobSwatchBackground(hex: string): string {
  const base = normalizeHex(hex);
  const highlight = lighten(base, 0.5);
  return `radial-gradient(circle at 32% 24%, ${highlight}, ${base} 72%)`;
}

export function hasRenderableCampaignImageUrl(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
