import React from "react";
import { Composition } from "remotion";
import { IntroComposition } from "./IntroComposition";
import { CinematicLogoReveal } from "./CinematicLogoReveal";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="IntroComposition"
        component={IntroComposition}
        durationInFrames={360}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="CinematicLogoReveal"
        component={CinematicLogoReveal}
        durationInFrames={600}
        fps={60}
        width={2560}
        height={1440}
      />
      <Composition
        id="CinematicLogoRevealVertical"
        component={CinematicLogoReveal}
        durationInFrames={600}
        fps={60}
        width={1080}
        height={1920}
      />
    </>
  );
};
