import React from "react";
import { useVideoConfig } from "remotion";

export type BeamVariant = "silver" | "white";

const GRADIENTS: Record<BeamVariant, string> = {
  silver:
    "linear-gradient(90deg, rgba(150,160,170,0) 0%, rgba(190,198,206,0.35) 25%, rgba(222,228,234,0.75) 55%, rgba(245,248,250,0.95) 82%, rgba(255,255,255,1) 100%)",
  white:
    "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.78) 55%, rgba(255,255,255,0.96) 82%, rgba(255,255,255,1) 100%)",
};

/**
 * A single directional light beam. `travel` (0..1) moves the beam's leading
 * tip from its off-screen origin toward `centerX`; `intensity` (0..1) drives
 * bloom/thickness/opacity so the parent can ramp it up as beams accelerate.
 */
export const Beam: React.FC<{
  side: "left" | "right";
  travel: number;
  intensity: number;
  variant: BeamVariant;
  centerX: number;
}> = ({ side, travel, intensity, variant, centerX }) => {
  const { width, height } = useVideoConfig();
  const clampedTravel = Math.max(0, Math.min(1, travel));
  const clampedIntensity = Math.max(0, Math.min(1, intensity));

  const length = width * 0.72;
  const thickness = 34 + clampedIntensity * 70;

  const originX = side === "left" ? -length : width + length;
  // Tip approaches (but doesn't overshoot) the collision point.
  const targetX = side === "left" ? centerX - length * 0.92 : centerX - length * 0.08;
  const x = originX + (targetX - originX) * clampedTravel;

  return (
    <div
      style={{
        position: "absolute",
        top: height / 2 - thickness / 2,
        left: x,
        width: length,
        height: thickness,
        background: GRADIENTS[variant],
        transform: side === "right" ? "scaleX(-1)" : undefined,
        filter: `blur(${5 + clampedIntensity * 12}px)`,
        opacity: Math.min(1, 0.35 + clampedIntensity * 0.65),
        mixBlendMode: "screen",
        willChange: "transform, opacity, filter",
      }}
    />
  );
};
