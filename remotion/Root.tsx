import React from "react";
import { Composition } from "remotion";
import { IntroComposition } from "./IntroComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="IntroComposition"
      component={IntroComposition}
      durationInFrames={360}
      fps={60}
      width={1920}
      height={1080}
    />
  );
};
