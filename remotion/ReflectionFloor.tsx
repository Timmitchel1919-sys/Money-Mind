import React from "react";
import { AbsoluteFill } from "remotion";

/** Subtle black-glass floor haze + ambient glow, always present in the background. */
export const FloorAmbience: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: height * 0.42,
          background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(180,190,198,0.05) 55%, rgba(210,218,224,0.09) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.5,
          top: height * 0.98,
          width: width * 0.55,
          height: height * 0.18,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)",
          filter: "blur(18px)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Mirrors its children below a floor line with reduced opacity, blur, and a downward fade mask. */
export const ReflectionMirror: React.FC<{
  floorY: number;
  centerX: number;
  opacity?: number;
  blurPx?: number;
  children: React.ReactNode;
}> = ({ floorY, centerX, opacity = 0.2, blurPx = 8, children }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        filter: `blur(${blurPx}px)`,
        transform: "scaleY(-1)",
        transformOrigin: `${centerX}px ${floorY}px`,
        WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 65%)",
        maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 65%)",
        pointerEvents: "none",
      }}
    >
      {children}
    </div>
  );
};
