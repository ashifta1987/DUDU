import { colors } from "../tokens";

/**
 * The 39 device face states. This is the shared vocabulary used by the
 * gateway protocol (`face{state}`), the database (`turns.face_state`) and the UI.
 */
export const FACE_STATES = [
  "idle",
  "listening",
  "thinking",
  "talking",
  "happy",
  "excited",
  "love",
  "sad",
  "surprised",
  "wink",
  "angry",
  "cool",
  "shy",
  "curious",
  "proud",
  "focus",
  "question",
  "correct",
  "wrong",
  "breakTime",
  "comeBack",
  "counting",
  "dance",
  "story",
  "laugh",
  "photo",
  "party",
  "scared",
  "clock",
  "reminder",
  "charging",
  "wifi",
  "pairing",
  "update",
  "quiet",
  "boot",
  "sleep",
  "wake",
  "confused",
] as const;

export type FaceState = (typeof FACE_STATES)[number];

export function isFaceState(value: unknown): value is FaceState {
  return typeof value === "string" && (FACE_STATES as readonly string[]).includes(value);
}

/** Eye shape vocabulary rendered by <DuDuFace/>. */
export type EyeShape =
  | "arc" // smiling ∩ arcs — the signature DuDu look
  | "dot" // round open eyes
  | "wide" // big round eyes
  | "line" // closed / sleeping
  | "down" // sad ∪ arcs
  | "wink" // left arc, right line
  | "heart"
  | "star"
  | "slant" // angry / determined
  | "half" // focused / sleepy half-lids
  | "x"; // wrong / dizzy

export interface FaceSpec {
  eyes: EyeShape;
  color: string;
  /** Optional mouth: none | smile | open | flat | o */
  mouth?: "smile" | "open" | "flat" | "o" | "wave";
  /** Short accessible description */
  label: string;
  /** Emoji glyph — only used in admin tables per brand rules. */
  glyph: string;
}

const O = colors.orange;
const B = colors.blue;
const G = colors.success;
const R = colors.danger;
const W = colors.warning;
const N = "#F6F3EE"; // neutral warm white

export const FACE_SPECS: Record<FaceState, FaceSpec> = {
  idle: { eyes: "arc", color: O, label: "Idle", glyph: "🙂" },
  listening: { eyes: "dot", color: O, mouth: "o", label: "Listening", glyph: "👂" },
  thinking: { eyes: "half", color: B, label: "Thinking", glyph: "🤔" },
  talking: { eyes: "arc", color: O, mouth: "open", label: "Talking", glyph: "🗣️" },
  happy: { eyes: "arc", color: O, mouth: "smile", label: "Happy", glyph: "😊" },
  excited: { eyes: "star", color: O, mouth: "open", label: "Excited", glyph: "🤩" },
  love: { eyes: "heart", color: R, mouth: "smile", label: "Love", glyph: "😍" },
  sad: { eyes: "down", color: B, mouth: "flat", label: "Sad", glyph: "😢" },
  surprised: { eyes: "wide", color: O, mouth: "o", label: "Surprised", glyph: "😮" },
  wink: { eyes: "wink", color: O, mouth: "smile", label: "Wink", glyph: "😉" },
  angry: { eyes: "slant", color: R, mouth: "flat", label: "Grumpy", glyph: "😠" },
  cool: { eyes: "half", color: O, mouth: "smile", label: "Cool", glyph: "😎" },
  shy: { eyes: "arc", color: "#F59AB5", mouth: "smile", label: "Shy", glyph: "☺️" },
  curious: { eyes: "dot", color: B, mouth: "o", label: "Curious", glyph: "🧐" },
  proud: { eyes: "arc", color: G, mouth: "smile", label: "Proud", glyph: "🥳" },
  focus: { eyes: "half", color: B, label: "Focus", glyph: "🎯" },
  question: { eyes: "dot", color: B, mouth: "o", label: "Question", glyph: "❓" },
  correct: { eyes: "arc", color: G, mouth: "open", label: "Correct", glyph: "✅" },
  wrong: { eyes: "x", color: W, mouth: "flat", label: "Try again", glyph: "❌" },
  breakTime: { eyes: "arc", color: G, mouth: "smile", label: "Break time", glyph: "☕" },
  comeBack: { eyes: "wide", color: B, mouth: "o", label: "Come back", glyph: "👋" },
  counting: { eyes: "dot", color: B, label: "Counting", glyph: "🔢" },
  dance: { eyes: "arc", color: O, mouth: "open", label: "Dance", glyph: "💃" },
  story: { eyes: "arc", color: "#8B6CF0", mouth: "smile", label: "Story", glyph: "📖" },
  laugh: { eyes: "arc", color: O, mouth: "open", label: "Laugh", glyph: "😂" },
  photo: { eyes: "wide", color: N, label: "Taking photo", glyph: "📸" },
  party: { eyes: "star", color: O, mouth: "open", label: "Party", glyph: "🎉" },
  scared: { eyes: "wide", color: B, mouth: "wave", label: "Scared", glyph: "😨" },
  clock: { eyes: "dot", color: W, label: "Clock", glyph: "⏰" },
  reminder: { eyes: "wide", color: W, mouth: "o", label: "Reminder", glyph: "🔔" },
  charging: { eyes: "line", color: G, label: "Charging", glyph: "🔋" },
  wifi: { eyes: "dot", color: B, label: "Wi‑Fi", glyph: "📶" },
  pairing: { eyes: "dot", color: B, mouth: "smile", label: "Pairing", glyph: "🔗" },
  update: { eyes: "half", color: B, label: "Updating", glyph: "⬇️" },
  quiet: { eyes: "line", color: "#9CA3AF", label: "Quiet hours", glyph: "🤫" },
  boot: { eyes: "dot", color: N, label: "Starting up", glyph: "⚡" },
  sleep: { eyes: "line", color: "#9CA3AF", label: "Sleeping", glyph: "😴" },
  wake: { eyes: "wide", color: O, mouth: "smile", label: "Waking up", glyph: "🌅" },
  confused: { eyes: "x", color: B, mouth: "wave", label: "Confused", glyph: "😕" },
};
