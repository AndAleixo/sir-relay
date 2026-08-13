"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  avatarCoverScale,
  clampAvatarOffset,
  exportAvatarCrop,
  loadImageElement,
} from "@/lib/profile-avatar";

const VIEW_SIZE = 280;
const MAX_ZOOM = 3;

type AvatarCropDialogProps = {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
};

export function AvatarCropDialog({
  imageSrc,
  onCancel,
  onConfirm,
}: AvatarCropDialogProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [coverScale, setCoverScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadImageElement(imageSrc)
      .then((img) => {
        if (cancelled) return;
        const cover = avatarCoverScale(img.naturalWidth, img.naturalHeight, VIEW_SIZE);
        const dw = img.naturalWidth * cover;
        const dh = img.naturalHeight * cover;
        setImage(img);
        setCoverScale(cover);
        setZoom(1);
        setOffset({
          x: (VIEW_SIZE - dw) / 2,
          y: (VIEW_SIZE - dh) / 2,
        });
      })
      .catch(() => {
        if (!cancelled) setError(t("photoInvalid"));
      });
    return () => {
      cancelled = true;
    };
  }, [imageSrc, t]);

  const displayWidth = image ? image.naturalWidth * coverScale * zoom : 0;
  const displayHeight = image ? image.naturalHeight * coverScale * zoom : 0;

  const applyZoom = useCallback(
    (nextZoom: number) => {
      if (!image) return;
      const z = Math.min(MAX_ZOOM, Math.max(1, nextZoom));
      const prevScale = coverScale * zoom;
      const nextScale = coverScale * z;
      const cx = VIEW_SIZE / 2;
      const cy = VIEW_SIZE / 2;
      const imgCx = (cx - offset.x) / prevScale;
      const imgCy = (cy - offset.y) / prevScale;
      const dw = image.naturalWidth * nextScale;
      const dh = image.naturalHeight * nextScale;
      setZoom(z);
      setOffset(
        clampAvatarOffset(
          cx - imgCx * nextScale,
          cy - imgCy * nextScale,
          dw,
          dh,
          VIEW_SIZE,
        ),
      );
    },
    [coverScale, image, offset.x, offset.y, zoom],
  );

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!image) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !image) return;
    const dw = image.naturalWidth * coverScale * zoom;
    const dh = image.naturalHeight * coverScale * zoom;
    setOffset(
      clampAvatarOffset(
        drag.originX + (event.clientX - drag.startX),
        drag.originY + (event.clientY - drag.startY),
        dw,
        dh,
        VIEW_SIZE,
      ),
    );
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  }

  async function handleConfirm() {
    if (!image || busy) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await exportAvatarCrop({
        image,
        viewSize: VIEW_SIZE,
        coverScale,
        zoom,
        offsetX: offset.x,
        offsetY: offset.y,
      });
      onConfirm(dataUrl);
    } catch {
      setError(t("photoTooLarge"));
      setBusy(false);
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-title"
        className="w-full max-w-sm rounded-card border border-[var(--border)] bg-surface-card p-4 shadow-lg"
      >
        <h2
          id="avatar-crop-title"
          className="text-sm font-semibold text-[var(--text-primary)]"
        >
          {t("photoCropTitle")}
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{t("photoCropHint")}</p>

        <div
          className={cn(
            "relative mx-auto mt-4 touch-none overflow-hidden rounded-full bg-[var(--surface-bg)]",
            busy && "pointer-events-none opacity-60",
          )}
          style={{ width: VIEW_SIZE, height: VIEW_SIZE }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt=""
              draggable={false}
              className="absolute max-w-none select-none"
              style={{
                width: displayWidth,
                height: displayHeight,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">
              …
            </div>
          )}
        </div>

        <label className="mt-4 block text-xs text-[var(--text-muted)]">
          {t("photoCropZoom")}
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={!image || busy}
            onChange={(event) => applyZoom(Number(event.target.value))}
            className="mt-1 w-full accent-[var(--brand-accent)]"
          />
        </label>

        {error ? (
          <p className="mt-3 text-sm text-[var(--severity)]">{error}</p>
        ) : null}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            disabled={!image || busy}
            onClick={() => void handleConfirm()}
            className="w-full sm:w-auto"
          >
            {t("photoCropConfirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}
