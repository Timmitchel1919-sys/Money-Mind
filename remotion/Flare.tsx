import React from "react";
import { AbsoluteFill, interpolate } from "remotion";

/**
 * Collision flare: an expanding, fading white burst plus a brief full-screen
 * flash. `progress` is 0..1 across the flare's own local window (the caller
 * decides that window relative to the collision frame).
 */
export const Flare: React.FC<{ progress: number; centerX: number; centerY: number }> = ({
  progress,
  centerX,
  centerY,
}) => {
  const clamped = Math.max(0, Math.min(1, progress));

  const burstScale = interpolate(clamped, [0, 0.12, 0.4, 1], [0, 1.3, 2, 2.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const burstOpacity = interpolate(clamped, [0, 0.08, 0.35, 1], [0, 1, 0.55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const flashOpacity = interpolate(clamped, [0, 0.06, 0.22, 0.5], [0, 1, 0.25, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const coreScale = interpolate(clamped, [0, 0.15, 0.5], [0.2, 1, 1.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const coreOpacity = interpolate(clamped, [0, 0.1, 0.45, 0.8], [0, 1, 0.7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (clamped <= 0 || clamped >= 1) {
    return null;
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Outer volumetric burst */}
      <div
        style={{
          position: "absolute",
          left: centerX,
          top: centerY,
          width: 760,
          height: 760,
          borderRadius: "50%",
          transform: `translate(-50%, -50%) scale(${burstScale})`,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 18%, rgba(210,220,230,0.35) 42%, rgba(210,220,230,0) 72%)",
          opacity: burstOpacity,
          filter: "blur(3px)",
        }}
      />
      {/* Hot core */}
      <div
        style={{
          position: "absolute",
          left: centerX,
          top: centerY,
          width: 260,
          height: 260,
          borderRadius: "50%",
          transform: `translate(-50%, -50%) scale(${coreScale})`,
          background: "radial-gradient(circle, #ffffff 0%, #ffffff 45%, rgba(255,255,255,0) 75%)",
          opacity: coreOpacity,
          filter: "blur(1px)",
        }}
      />
      {/* Full-screen flash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#ffffff",
          opacity: flashOpacity,
        }}
      />
    </AbsoluteFill>
  );
};
