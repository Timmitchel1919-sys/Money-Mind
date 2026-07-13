import React, { useMemo } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";

type Particle = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  baseOpacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
};

function generateParticles(count: number, seed: string): Particle[] {
  return new Array(count).fill(0).map((_, i) => {
    const s = `${seed}-${i}`;
    return {
      x: random(`${s}-x`) * 100,
      y: random(`${s}-y`) * 100,
      size: 1.2 + random(`${s}-size`) * 3.2,
      speedX: (random(`${s}-vx`) - 0.5) * 0.14,
      speedY: (random(`${s}-vy`) - 0.5) * 0.09,
      baseOpacity: 0.35 + random(`${s}-op`) * 0.65,
      twinklePhase: random(`${s}-phase`) * Math.PI * 2,
      twinkleSpeed: 0.06 + random(`${s}-tspeed`) * 0.08,
    };
  });
}

/**
 * Reusable field of slow, drifting silver/white particles.
 * Deterministic per-frame (seeded RNG) so renders are reproducible.
 */
export const ParticleField: React.FC<{
  intensity?: number; // 0..1, scales size/opacity/glow — used for the 1.5-3.0s buildup
  seed?: string;
  count?: number;
}> = ({ intensity = 1, seed = "money-mind-particles", count = 70 }) => {
  const frame = useCurrentFrame();
  const particles = useMemo(() => generateParticles(count, seed), [count, seed]);
  const clampedIntensity = Math.max(0, Math.min(1.4, intensity));

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {particles.map((p, i) => {
        const px = (((p.x + p.speedX * frame) % 100) + 100) % 100;
        const py = (((p.y + p.speedY * frame) % 100) + 100) % 100;
        const twinkle = 0.55 + 0.45 * Math.sin(frame * p.twinkleSpeed + p.twinklePhase);
        const opacity = p.baseOpacity * clampedIntensity * twinkle;
        const size = p.size * (0.65 + clampedIntensity * 0.5);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${px}%`,
              top: `${py}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(205,213,220,0.45) 55%, rgba(205,213,220,0) 100%)",
              opacity,
              filter: `blur(${0.3 + (1 - clampedIntensity) * 0.5}px)`,
              boxShadow: `0 0 ${4 + clampedIntensity * 7}px rgba(232,238,242,${0.55 * clampedIntensity})`,
              willChange: "transform, opacity",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
