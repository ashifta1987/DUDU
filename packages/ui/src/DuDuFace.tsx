import * as React from "react";
import { colors } from "../tokens";
import { FACE_SPECS, type EyeShape, type FaceSpec, type FaceState } from "./face-states";

export interface DuDuFaceProps extends Omit<React.SVGProps<SVGSVGElement>, "children"> {
  state?: FaceState;
  /** Rendered width in px (height keeps the 4:3 device ratio). */
  size?: number;
  /** Override the accessible label. Pass "" to mark decorative. */
  title?: string;
}

const LX = 40;
const RX = 80;
const EY = 40;
const SW = 7; // stroke width

function Eye({
  shape,
  cx,
  color,
  side,
}: {
  shape: EyeShape;
  cx: number;
  color: string;
  side: "l" | "r";
}) {
  const stroke = { stroke: color, strokeWidth: SW, strokeLinecap: "round" as const, fill: "none" };
  switch (shape) {
    case "arc":
      return (
        <path d={`M${cx - 10} ${EY + 4} Q${cx} ${EY - 10} ${cx + 10} ${EY + 4}`} {...stroke} />
      );
    case "down":
      return <path d={`M${cx - 10} ${EY - 3} Q${cx} ${EY + 9} ${cx + 10} ${EY - 3}`} {...stroke} />;
    case "dot":
      return <circle cx={cx} cy={EY} r={7} fill={color} />;
    case "wide":
      return <circle cx={cx} cy={EY} r={10} fill={color} />;
    case "line":
      return <path d={`M${cx - 10} ${EY + 2} L${cx + 10} ${EY + 2}`} {...stroke} />;
    case "half":
      return (
        <path
          d={`M${cx - 10} ${EY} Q${cx} ${EY + 9} ${cx + 10} ${EY} Z`}
          fill={color}
          stroke={color}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      );
    case "wink":
      return side === "l" ? (
        <path d={`M${cx - 10} ${EY + 4} Q${cx} ${EY - 10} ${cx + 10} ${EY + 4}`} {...stroke} />
      ) : (
        <path d={`M${cx - 10} ${EY + 2} L${cx + 10} ${EY + 2}`} {...stroke} />
      );
    case "slant": {
      const dir = side === "l" ? 1 : -1;
      return (
        <g>
          <path
            d={`M${cx - 10} ${EY - 8 - 4 * dir} L${cx + 10} ${EY - 8 + 4 * dir}`}
            {...stroke}
            strokeWidth={5}
          />
          <circle cx={cx} cy={EY + 3} r={6} fill={color} />
        </g>
      );
    }
    case "heart":
      return (
        <path
          d={`M${cx} ${EY + 9} C${cx - 14} ${EY} ${cx - 10} ${EY - 11} ${cx} ${EY - 4} C${cx + 10} ${EY - 11} ${cx + 14} ${EY} ${cx} ${EY + 9} Z`}
          fill={color}
        />
      );
    case "star": {
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 11 : 4.5;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(EY + r * Math.sin(a)).toFixed(2)}`);
      }
      return <polygon points={pts.join(" ")} fill={color} />;
    }
    case "x":
      return (
        <g {...stroke} strokeWidth={6}>
          <path d={`M${cx - 7} ${EY - 7} L${cx + 7} ${EY + 7}`} />
          <path d={`M${cx + 7} ${EY - 7} L${cx - 7} ${EY + 7}`} />
        </g>
      );
  }
}

function Mouth({ kind, color }: { kind: NonNullable<FaceSpec["mouth"]>; color: string }) {
  const stroke = { stroke: color, strokeWidth: 5, strokeLinecap: "round" as const, fill: "none" };
  switch (kind) {
    case "smile":
      return <path d="M52 62 Q60 70 68 62" {...stroke} />;
    case "open":
      return (
        <path
          d="M50 60 Q60 76 70 60 Z"
          fill={color}
          stroke={color}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      );
    case "flat":
      return <path d="M53 66 L67 66" {...stroke} />;
    case "o":
      return <circle cx={60} cy={65} r={4.5} fill={color} />;
    case "wave":
      return <path d="M50 66 Q55 61 60 66 T70 66" {...stroke} strokeWidth={4} />;
  }
}

/**
 * The DuDu device face: a dark rounded rectangle with two smiling arcs,
 * coloured and shaped by device state.
 */
export function DuDuFace({ state = "idle", size = 120, title, className, ...rest }: DuDuFaceProps) {
  const spec = FACE_SPECS[state] ?? FACE_SPECS.idle;
  const label = title ?? `DuDu face: ${spec.label}`;
  const decorative = label === "";
  return (
    <svg
      viewBox="0 0 120 90"
      width={size}
      height={(size * 90) / 120}
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      data-state={state}
      {...rest}
    >
      <rect x="2" y="2" width="116" height="86" rx="22" fill={colors.face} />
      <rect
        x="2"
        y="2"
        width="116"
        height="86"
        rx="22"
        fill="none"
        stroke="#2A2F35"
        strokeWidth="2"
      />
      <Eye shape={spec.eyes} cx={LX} color={spec.color} side="l" />
      <Eye shape={spec.eyes} cx={RX} color={spec.color} side="r" />
      {spec.mouth ? <Mouth kind={spec.mouth} color={spec.color} /> : null}
    </svg>
  );
}

export default DuDuFace;
