import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ChromeTrail } from "./ChromeTrail";
import { ShootingStar } from "./ShootingStar";
import { FloorAmbience, ReflectionMirror } from "./ReflectionFloor";
import { ParticleField } from "./ParticleField";
import { LogoReveal } from "./LogoReveal";

const FULL_LOGO_SRC = staticFile("money-mind-logo.png");

// Timeline (60fps, 600 frames / 10.0s total):
//   0    - 90   (0.0-1.5s) a shooting star streaks in from off-screen and arrives at center
//   80   - 240  (1.33-4.0s) its tail hands off into the spiral, which closes into a chrome ring
//   240  - 360  (4.0-6.0s) the ring holds, rotating, with orbiting chrome particles
//   360  - 420  (6.0-7.0s) mechanical contraction: the ring compresses and brightens
//   420  - 480  (7.0-8.0s) cross-dissolve: ring fades out as the logo fades in
//   480  - 520  (8.0-8.67s) logo settles, breathing glow
//   560  - 600  (9.33-10.0s) smooth fade to black
const STAR_END = 90;
const SPIRAL_START = 80;
const SPIRAL_END = 240;
const RING_HOLD_END = 360;
const CONTRACT_END = 420;
const CROSSFADE_END = 480;
const LOGO_SETTLE_END = 520;
const FADE_START = 560;
const FADE_END = 600;

export const CinematicLogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.15;
  const floorY = centerY + Math.min(width, height) * 0.24;

  const starProgress = interpolate(frame, [0, STAR_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const starOpacity = interpolate(frame, [0, 10, STAR_END - 10, STAR_END], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const drawProgress = interpolate(frame, [SPIRAL_START, SPIRAL_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const headScale = interpolate(frame, [SPIRAL_START, STAR_END + 30], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const headOpacity = interpolate(frame, [RING_HOLD_END, RING_HOLD_END + 40], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const gradientSpin = frame * 1.4;
  const ringRotation = frame >= SPIRAL_END ? (frame - SPIRAL_END) * 0.12 : 0;

  const orbitIntensity = interpolate(frame, [150, SPIRAL_END, RING_HOLD_END, CONTRACT_END], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ringScale = interpolate(frame, [RING_HOLD_END, CONTRACT_END], [1, 0.66], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  const ringOpacity = interpolate(frame, [CONTRACT_END, CROSSFADE_END], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pulseProgress = interpolate(frame, [CONTRACT_END - 10, CONTRACT_END + 10, CONTRACT_END + 40], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const logoRevealProgress = interpolate(frame, [CONTRACT_END, LOGO_SETTLE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const glowPhase = Math.max(0, frame - CONTRACT_END) * 0.045;
  const logoSize = Math.min(width, height) * 0.34;

  const sceneOpacity = interpolate(frame, [FADE_START, FADE_END], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const ringGroup = (
    <div style={{ position: "absolute", left: centerX, top: centerY, width: 0, height: 0 }}>
      <div
        style={{
          position: "absolute",
          transform: `translate(-50%, -50%) rotate(${ringRotation}deg) scale(${ringScale})`,
          opacity: ringOpacity,
          filter: `brightness(${1 + pulseProgress * 0.6})`,
        }}
      >
        <ChromeTrail
          drawProgress={drawProgress}
          maxRadius={maxRadius}
          headScale={headScale}
          headOpacity={headOpacity}
          orbitIntensity={orbitIntensity}
          gradientSpin={gradientSpin}
          frame={frame}
        />
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <AbsoluteFill style={{ opacity: sceneOpacity }}>
        <FloorAmbience width={width} height={height} />
        <ParticleField intensity={0.35} seed="mm-cinematic-bg" count={60} />

        {starOpacity > 0.001 && (
          <ShootingStar progress={starProgress} opacity={starOpacity} centerX={centerX} centerY={centerY} />
        )}

        <ReflectionMirror floorY={floorY} centerX={centerX} opacity={0.16} blurPx={10}>
          {ringGroup}
          {frame >= CONTRACT_END && (
            <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Img
                src={FULL_LOGO_SRC}
                style={{ width: logoSize, height: logoSize, objectFit: "contain", opacity: logoRevealProgress }}
              />
            </AbsoluteFill>
          )}
        </ReflectionMirror>

        {ringGroup}

        {pulseProgress > 0.01 && (
          <div
            style={{
              position: "absolute",
              left: centerX,
              top: centerY,
              transform: "translate(-50%, -50%)",
              width: maxRadius * 1.6,
              height: maxRadius * 1.6,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)",
              opacity: pulseProgress * 0.55,
              filter: "blur(10px)",
            }}
          />
        )}

        {frame >= CONTRACT_END && (
          <LogoReveal
            revealProgress={logoRevealProgress}
            glowPhase={glowPhase}
            opacityMultiplier={1}
            src={FULL_LOGO_SRC}
            size={logoSize}
            showBackGlow={false}
          />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
