import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";

const DEFAULT_LOGO_SRC = staticFile("money-mind-mark.png");

/**
 * Reveals the original, unmodified Money Mind mark (or full lockup) from the
 * collision flare. The <Img> itself is never distorted/cropped/recolored —
 * all "chrome" and "shimmer" effects are separate overlay layers, with the
 * shimmer sweep masked to the logo's own alpha silhouette.
 */
export const LogoReveal: React.FC<{
  revealProgress: number; // 0..1 across the reveal window
  glowPhase: number; // continuous radians, drives the breathing glow
  opacityMultiplier: number; // 0..1, for fade-outs
  src?: string; // defaults to the standalone M mark
  size?: number; // px, defaults to 520
  showBackGlow?: boolean; // radial white halo behind the mark, defaults to true
}> = ({ revealProgress, glowPhase, opacityMultiplier, src, size = 520, showBackGlow = true }) => {
  const LOGO_SRC = src ?? DEFAULT_LOGO_SRC;
  const clamped = Math.max(0, Math.min(1, revealProgress));

  const scale = interpolate(clamped, [0, 1], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const opacity =
    interpolate(clamped, [0, 0.4, 1], [0, 1, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) * opacityMultiplier;

  const breathe = 0.5 + 0.5 * Math.sin(glowPhase);
  const glowOpacity = 0.3 + breathe * 0.35;
  const dropGlow = 10 + breathe * 10;

  // Shimmer sweep travels once across the mark as it settles in, then
  // continues drifting slowly for a subtle "polished metal" feel.
  const shimmerX = interpolate(clamped, [0, 1], [-130, 260]) + Math.sin(glowPhase * 0.5) * 15;

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {/* Soft ambient glow behind the mark */}
        {showBackGlow && (
          <div
            style={{
              position: "absolute",
              inset: -70,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(198,212,222,0.32) 45%, rgba(198,212,222,0) 75%)",
              opacity: glowOpacity,
              filter: "blur(22px)",
            }}
          />
        )}

        {/* Original, untouched logo asset */}
        <Img
          src={LOGO_SRC}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: `drop-shadow(0 0 ${dropGlow}px rgba(255,255,255,0.55)) drop-shadow(0 6px 20px rgba(0,0,0,0.5))`,
          }}
        />

        {/* Chrome shimmer sweep, clipped to the logo's own alpha shape */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            WebkitMaskImage: `url(${LOGO_SRC})`,
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskImage: `url(${LOGO_SRC})`,
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            mixBlendMode: "overlay",
            background: `linear-gradient(115deg, rgba(255,255,255,0) ${shimmerX - 35}%, rgba(255,255,255,0.95) ${shimmerX}%, rgba(255,255,255,0) ${shimmerX + 35}%)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
