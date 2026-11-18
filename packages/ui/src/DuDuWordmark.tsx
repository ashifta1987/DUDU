import * as React from "react";
import { colors } from "../tokens";

export interface DuDuWordmarkProps extends React.SVGProps<SVGSVGElement> {
  height?: number;
  /** Ink colour for the letters (defaults to brand ink). */
  ink?: string;
}

/** "DuDu" wordmark with the orange smile under the second "u". */
export function DuDuWordmark({ height = 28, ink = colors.ink, ...rest }: DuDuWordmarkProps) {
  const width = (height * 124) / 44;
  return (
    <svg viewBox="0 0 124 44" width={width} height={height} role="img" aria-label="DuDu" {...rest}>
      <text
        x="0"
        y="32"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={900}
        fontSize="34"
        letterSpacing="-1"
        fill={ink}
      >
        DuDu
      </text>
      <path
        d="M98 38 Q107 45 116 38"
        stroke={colors.orange}
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default DuDuWordmark;
