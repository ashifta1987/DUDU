/**
 * DuDu™ brand & design tokens.
 * Single source of truth — mirrored into the Tailwind v4 theme in apps/web/src/app/globals.css.
 */

export const colors = {
  ink: "#1F2328",
  ground: "#F6F3EE",
  surface: "#FFFFFF",
  line: "#ECE7DE",
  muted: "#6B7280",

  orange: "#F26B1D",
  orangeTint: "#FBE4D6",
  orangeDark: "#C9540F",

  blue: "#1E6FE0",
  blueTint: "#E3EDFB",

  success: "#17A34A",
  successTint: "#E6F6EA",
  danger: "#D8262B",
  dangerTint: "#FDECEC",
  warning: "#FFB347",

  /** Device face background */
  face: "#16191D",
} as const;

export const radii = {
  card: "20px",
  cardLg: "24px",
  cardSm: "18px",
  button: "14px",
  buttonSm: "12px",
  buttonLg: "16px",
  pill: "999px",
} as const;

export const fonts = {
  sans: "Inter",
  child: "Baloo 2",
} as const;

export const sizing = {
  /** Minimum touch target (px) */
  touch: 44,
  /** Child companion minimum button height (px) */
  childButton: 56,
  /** Child companion minimum text size (px) */
  childText: 16,
} as const;

export const tokens = { colors, radii, fonts, sizing } as const;
export type ColorToken = keyof typeof colors;
export default tokens;
