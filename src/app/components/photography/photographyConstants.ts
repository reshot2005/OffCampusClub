import { framesPublicPath } from "../../../config/framesAssetBase";

export const PHOTO_TOTAL_FRAMES = 546;
export const PHOTO_FRAMES_PATH = framesPublicPath("/photography-frames/");
export const PHOTO_SCROLL_HEIGHT_VH = 950;

export const PC = {
  bg: "#0a0a0a",
  text: "#FFFFFF",
  accent: "#FFD700",
  secondary: "#FF6B35",
  danger: "#C0392B",
  muted: "#888888",
  dark: "#111111",
} as const;

export type PhotographyChapter = {
  id: string;
  from: number;
  peak: number;
  to: number;
  label: string;
  headline: string[];
  accentIndices: number[];
  sub: string;
  stat?: { number: string; label: string };
  hasCTA?: boolean;
  ctaText?: string;
  position: "bottom-left" | "top-right" | "center-left" | "bottom-right" | "center";
  headlineSize?: string;
  accentColor?: string;
};

export const PHOTO_CHAPTERS: PhotographyChapter[] = [
  {
    id: "eye",
    from: 0.0, peak: 0.06, to: 0.12,
    label: "Chapter I · The Eye",
    headline: ["See", "Before", "You", "Shoot."],
    accentIndices: [0],
    sub: "Every frame is a decision made in 0.1 seconds.",
    position: "bottom-left",
  },
  {
    id: "golden",
    from: 0.14, peak: 0.2, to: 0.28,
    label: "Chapter II · Golden Hour",
    headline: ["Chase", "The", "Light."],
    accentIndices: [2],
    sub: "ISO 400. f/1.8. The moment before it disappears.",
    stat: { number: "1/500s", label: "Shutter Speed" },
    position: "top-right",
  },
  {
    id: "darkroom",
    from: 0.3, peak: 0.38, to: 0.46,
    label: "Chapter III · The Darkroom",
    headline: ["Develop", "Everything."],
    accentIndices: [0],
    sub: "Film. Chemistry. Red light. This is where images are born.",
    stat: { number: "35mm", label: "Film Format" },
    position: "center-left",
  },
  {
    id: "shot",
    from: 0.48, peak: 0.54, to: 0.64,
    label: "Chapter IV · The Shot",
    headline: ["One", "Frame.", "Forever."],
    accentIndices: [1],
    sub: "You cannot retake the moment. Only honour it.",
    position: "bottom-right",
  },
  {
    id: "captured",
    from: 0.65, peak: 0.7, to: 0.8,
    label: "OCC Photography Club",
    headline: ["CAPTURED."],
    accentIndices: [0],
    headlineSize: "clamp(100px, 18vw, 260px)",
    accentColor: "#FFD700",
    sub: "Shutter. Flash. Crowd. Pure stillness.",
    position: "center",
  },
  {
    id: "cta",
    from: 0.82, peak: 0.88, to: 1.0,
    label: "Join OCC Photography Club",
    headline: ["Shoot", "With", "Your", "People."],
    accentIndices: [3],
    sub: "Photo walks. Studio access. Exhibitions. Workshops.",
    hasCTA: true,
    ctaText: "Join the Club",
    position: "center",
  },
];
