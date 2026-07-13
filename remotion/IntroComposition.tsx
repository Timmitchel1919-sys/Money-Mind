import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Beam } from "./Beam";
import { ParticleField } from "./ParticleField";
import { Flare } from "./Flare";
import { LogoReveal } from "./LogoReveal";

// Timeline (60fps, 360 frames / 6.0s total):
//   0    - 90   (0.0-1.5s) beams enter from the edges, slow drifting particles
//   90   - 180  (1.5-3.0s) beams accelerate toward center, bloom/particles build
//   180         (3.0s)     collision - white flare + screen flash
//   180  - 270  (3.0-4.5s) logo reveals from the flare
//   270  - 330  (4.5-5.5s) logo holds center, slow breathing glow
//   330  - 360  (5.5-6.0s) smooth fade to black for the login-screen handoff
const PHASE1_END = 90;
const COLLISION_FRAME = 180;
const REVEAL_END = 270;
const HOLD_END = 330;
const FADE_END = 360;

const FLARE_START = COLLISION_FRAME - 2;
const FLARE_DURATION = 44;

export const IntroComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const centerX = width / 2;
  const centerY = height / 2;

  // --- Beams: travel 0..1 from off-screen to the collision point ---
  const beamTravel =
    frame <= PHASE1_END
      ? interpolate(frame, [0, PHASE1_END], [0, 0.55], {
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.quad),
        })
      : interpolate(frame, [PHASE1_END, COLLISION_FRAME], [0.55, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        });

  const beamBuildIntensity =
    frame <= PHASE1_END
      ? interpolate(frame, [0, PHASE1_END], [0.22, 0.55], { extrapolateRight: "clamp" })
      : interpolate(frame, [PHASE1_END, COLLISION_FRAME], [0.55, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  // Beams dissolve quickly into the flare right after collision.
  const beamFadeOut = interpolate(frame, [COLLISION_FRAME, COLLISION_FRAME + 14], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const beamIntensity = beamBuildIntensity * beamFadeOut;

  // --- Particles: subtle float -> intensified buildup -> settle -> hold ---
  let particleIntensity: number;
  if (frame <= PHASE1_END) {
    particleIntensity = interpolate(frame, [0, PHASE1_END], [0.3, 0.55]);
  } else if (frame <= COLLISION_FRAME) {
    particleIntensity = interpolate(frame, [PHASE1_END, COLLISION_FRAME], [0.55, 1.15]);
  } else if (frame <= REVEAL_END) {
    particleIntensity = interpolate(frame, [COLLISION_FRAME, REVEAL_END], [1.15, 0.5], {
      extrapolateRight: "clamp",
    });
  } else {
    particleIntensity = 0.45;
  }

  // --- Flare / collision flash ---
  const flareProgress = interpolate(frame, [FLARE_START, FLARE_START + FLARE_DURATION], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Logo reveal (3.0-4.5s), then breathing hold (4.5-5.5s) ---
  const revealProgress = interpolate(frame, [COLLISION_FRAME, REVEAL_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glowPhase = Math.max(0, frame - COLLISION_FRAME) * 0.045;

  // --- Final fade to black (5.5-6.0s) for the login-screen handoff ---
  const sceneOpacity = interpolate(frame, [HOLD_END, FADE_END], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <AbsoluteFill style={{ opacity: sceneOpacity }}>
        <ParticleField intensity={particleIntensity} seed="mm-particles" count={80} />

        {beamIntensity > 0.001 && (
          <>
            <Beam side="left" travel={beamTravel} intensity={beamIntensity} variant="silver" centerX={centerX} />
            <Beam side="right" travel={beamTravel} intensity={beamIntensity} variant="white" centerX={centerX} />
          </>
        )}

        <Flare progress={flareProgress} centerX={centerX} centerY={centerY} />

        {frame >= COLLISION_FRAME && (
          <LogoReveal revealProgress={revealProgress} glowPhase={glowPhase} opacityMultiplier={1} />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
