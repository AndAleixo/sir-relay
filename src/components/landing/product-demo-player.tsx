"use client";

import { useState } from "react";
import { demoStyles } from "./landing.styles";

type ProductDemoPlayerProps = {
  ariaLabel: string;
  demoUrl: string;
  caption: string;
  fallback: React.ReactNode;
};

export function ProductDemoPlayer({
  ariaLabel,
  demoUrl,
  caption,
  fallback,
}: ProductDemoPlayerProps) {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return fallback;
  }

  return (
    <div className={demoStyles.wrap}>
      <div className={demoStyles.frame} aria-label={ariaLabel}>
        <div className={demoStyles.chrome}>
          <span className={demoStyles.dot} />
          <span className={demoStyles.dot} />
          <span className={demoStyles.dot} />
          <span className={demoStyles.url}>{demoUrl}</span>
        </div>
        <video
          className={demoStyles.video}
          src="/brand/demo.webm"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setUseFallback(true)}
        />
      </div>
      <p className={demoStyles.caption}>{caption}</p>
    </div>
  );
}
