"use client";

import { useEffect, useRef, useState } from "react";
import { demoStyles } from "./landing.styles";

type ProductDemoPlayerProps = {
  ariaLabel: string;
  demoUrl: string;
  caption: string;
  pauseLabel: string;
  playLabel: string;
  fallback: React.ReactNode;
};

export function ProductDemoPlayer({
  ariaLabel,
  demoUrl,
  caption,
  pauseLabel,
  playLabel,
  fallback,
}: ProductDemoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || useFallback) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      video.pause();
    } else {
      void video.play().catch(() => undefined);
    }

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [useFallback]);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }

  if (useFallback) {
    return fallback;
  }

  return (
    <div className={demoStyles.wrap}>
      <div className={`${demoStyles.frame} ${demoStyles.videoWrap}`}>
        <div className={demoStyles.chrome}>
          <span className={demoStyles.dot} aria-hidden />
          <span className={demoStyles.dot} aria-hidden />
          <span className={demoStyles.dot} aria-hidden />
          <span className={demoStyles.url}>{demoUrl}</span>
        </div>
        <video
          ref={videoRef}
          className={demoStyles.video}
          src="/brand/demo.webm"
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={ariaLabel}
          onError={() => setUseFallback(true)}
        />
        <button
          type="button"
          className={demoStyles.videoToggle}
          onClick={togglePlayback}
          aria-pressed={playing}
          aria-label={playing ? pauseLabel : playLabel}
        >
          {playing ? pauseLabel : playLabel}
        </button>
      </div>
      <p className={demoStyles.caption}>{caption}</p>
    </div>
  );
}
