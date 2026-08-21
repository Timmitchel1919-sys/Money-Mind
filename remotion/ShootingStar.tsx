import React from "react";
import { useVideoConfig } from "remotion";

/**
 * A fast streaking point of light that flies in diagonally from off-screen
 * and arrives exactly at (centerX, centerY) — the same point where
 * ChromeTrail's spiral path originates, so the star's tail hands off
 * seamlessly into the chrome trail with no visible pop.
 */
export const ShootingStar: React.FC<{
  progress: number; // 0..1 across the flight
  opacity: number; // caller-controlled fade in/out for the handoff
  centerX: number;
  centerY: number;
}> = ({ progress, opacity, centerX, centerY }) => {
  const { width, height } = useVideoConfig();
  const clamped = Math.max(0, Math.min(1, progress));

  const originX = centerX - width * 0.62;
  const originY = centerY - height * 0.5;

  const eased = 1 - Math.pow(1 - clamped, 3);
  const x = originX + (centerX - originX) * eased;
  const y = originY + (centerY - originY) * eased;

  const angleDeg = (Math.atan2(centerY - originY, centerX - originX) * 180) / Math.PI;
  const scale = Math.min(width, height) / 1440;
  const tailLength = (14 + Math.min(1, clamped / 0.12) * 250) * scale;
  const headSize = (6 + eased * 8) * scale;

  if (opacity <= 0.001) {
    return null;
  }

  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, opacity, pointerEvents: "none" }}>
      <div style={{ position: "absolute", transform: `rotate(${angleDeg}deg)`, transformOrigin: "0 0" }}>
        <div
          style={{
            position: "absolute",
            left: -tailLength,
            top: -headSize * 0.28,
            width: tailLength,
            height: headSize * 0.55,
            background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(206,214,220,0.4) 55%, rgba(255,255,255,0.95) 100%)",
            filter: `blur(${headSize * 0.22}px)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -headSize / 2,
            top: -headSize / 2,
            width: headSize,
            height: headSize,
            borderRadius: "50%",
            background: "radial-gradient(circle, #ffffff 0%, #e7ecef 55%, rgba(231,236,239,0) 100%)",
            boxShadow: `0 0 ${headSize * 2.4}px rgba(255,255,255,0.85)`,
          }}
        />
      </div>
    </div>
  );
};
