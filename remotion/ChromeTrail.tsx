import React, { useMemo } from "react";
import { random } from "remotion";
import { buildSpiralRingPoints, pointsToPath } from "./spiral";

const VIEW_PAD = 1.7;

/**
 * The single traveling light: draws its spiral-into-ring chrome trail
 * progressively (by revealed point count, not stroke-dasharray, so it stays
 * frame-exact under Remotion's server-side rendering), plus a glowing head
 * particle and a field of small orbiting chrome specks once the ring forms.
 */
export const ChromeTrail: React.FC<{
  drawProgress: number; // 0..1, how much of the spiral/ring path is revealed
  maxRadius: number;
  headScale: number; // 0..1+, head particle size (camera-approach depth cue)
  headOpacity: number; // 0..1, fades the head out once the ring is fully formed
  orbitIntensity: number; // 0..1
  gradientSpin: number; // degrees, rotates the chrome highlight sweep
  frame: number;
  seed?: string;
}> = ({ drawProgress, maxRadius, headScale, headOpacity, orbitIntensity, gradientSpin, frame, seed = "mm-trail" }) => {
  const points = useMemo(() => buildSpiralRingPoints({ maxRadius, count: 320, turns: 3.2 }), [maxRadius]);

  const clamped = Math.max(0, Math.min(1, drawProgress));
  const visibleCount = Math.max(2, Math.round(clamped * points.length));
  const visiblePoints = points.slice(0, visibleCount);
  const path = pointsToPath(visiblePoints);
  const head = visiblePoints[visiblePoints.length - 1];

  const size = maxRadius * VIEW_PAD * 2;
  const half = size / 2;

  const orbiters = useMemo(() => {
    return new Array(14).fill(0).map((_, i) => {
      const s = `${seed}-orbit-${i}`;
      return {
        baseAngle: random(`${s}-a`) * Math.PI * 2,
        speed: (0.006 + random(`${s}-s`) * 0.01) * (random(`${s}-dir`) > 0.5 ? 1 : -1),
        radiusJitter: 1.04 + random(`${s}-r`) * 0.24,
        dotSize: 1.6 + random(`${s}-sz`) * 2.6,
      };
    });
  }, [seed]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-half} ${-half} ${size} ${size}`}
      style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", overflow: "visible" }}
    >
      <defs>
        <linearGradient
          id="chromeStroke"
          gradientUnits="userSpaceOnUse"
          x1={-maxRadius}
          y1={-maxRadius}
          x2={maxRadius}
          y2={maxRadius}
          gradientTransform={`rotate(${gradientSpin} 0 0)`}
        >
          <stop offset="0%" stopColor="#4b4f54" />
          <stop offset="18%" stopColor="#eef2f5" />
          <stop offset="34%" stopColor="#8b9299" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="66%" stopColor="#9aa1a8" />
          <stop offset="82%" stopColor="#e2e7eb" />
          <stop offset="100%" stopColor="#55585d" />
        </linearGradient>
        <radialGradient id="headGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#e4e9ec" />
          <stop offset="100%" stopColor="#9aa1a8" />
        </radialGradient>
        <filter id="chromeBloom" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={maxRadius * 0.012} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {visiblePoints.length > 1 && (
        <path
          d={path}
          fill="none"
          stroke="url(#chromeStroke)"
          strokeWidth={Math.max(2, maxRadius * 0.045)}
          strokeLinecap="round"
          filter="url(#chromeBloom)"
        />
      )}

      {orbitIntensity > 0.01 &&
        orbiters.map((o, i) => {
          const angle = o.baseAngle + frame * o.speed;
          const r = maxRadius * o.radiusJitter;
          const x = r * Math.cos(angle);
          const y = r * Math.sin(angle);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={o.dotSize * (0.5 + orbitIntensity * 0.6)}
              fill="#eef2f5"
              opacity={orbitIntensity * 0.85}
              style={{ filter: "blur(0.4px)" }}
            />
          );
        })}

      {headOpacity > 0.01 && head && (
        <g opacity={headOpacity}>
          <circle cx={head.x} cy={head.y} r={maxRadius * 0.16 * headScale} fill="#ffffff" opacity={0.18} style={{ filter: `blur(${maxRadius * 0.03}px)` }} />
          <circle cx={head.x} cy={head.y} r={maxRadius * 0.09 * headScale} fill="url(#headGrad)" filter="url(#chromeBloom)" />
        </g>
      )}
    </svg>
  );
};
