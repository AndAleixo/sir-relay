"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { demoStyles } from "./landing.styles";

type ProductDemoPlayerProps = {
  ariaLabel: string;
  demoUrl: string;
  caption: string;
  pauseLabel: string;
  playLabel: string;
  /** Board columns shown until the video has a real frame. */
  board: ReactNode;
  /** Full static mock when the video fails to load. */
  fallback: ReactNode;
};

export function ProductDemoPlayer({
  ariaLabel,
  demoUrl,
  caption,
  pauseLabel,
  playLabel,
  board,
  fallback,
}: ProductDemoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || useFallback) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onReady = () => setVideoReady(true);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    if (video.readyState >= 2) onReady();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      video.pause();
    } else {
      void video.play().catch(() => undefined);
    }

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
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

  // Board visible until the first video frame is ready (avoids empty chrome + Pausar).
  const showBoard = !videoReady;

  return (
    <div className={demoStyles.wrap}>
      <div className={`${demoStyles.frame} ${demoStyles.videoWrap}`}>
        <div className={demoStyles.chrome}>
          <span className={demoStyles.dot} aria-hidden />
          <span className={demoStyles.dot} aria-hidden />
          <span className={demoStyles.dot} aria-hidden />
          <span className={demoStyles.url}>{demoUrl}</span>
        </div>
        {showBoard ? board : null}
        <video
          ref={videoRef}
          className={demoStyles.video}
          style={showBoard ? { display: "none" } : undefined}
          src="/brand/demo.webm"
          muted
          loop
          playsInline
          preload="auto"
          aria-label={ariaLabel}
          onError={() => setUseFallback(true)}
        />
        {!showBoard ? (
          <button
            type="button"
            className={demoStyles.videoToggle}
            onClick={togglePlayback}
            aria-pressed={playing}
            aria-label={playing ? pauseLabel : playLabel}
          >
            {playing ? pauseLabel : playLabel}
          </button>
        ) : null}
      </div>
      <p className={demoStyles.caption}>{caption}</p>
    </div>
  );
}
