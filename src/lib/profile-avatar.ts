const storageKey = (userId: string) => `sirrelay:avatar:${userId}`;

export function getStoredAvatar(userId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(storageKey(userId));
}

export function setStoredAvatar(userId: string, dataUrl: string) {
  localStorage.setItem(storageKey(userId), dataUrl);
}

export function clearStoredAvatar(userId: string) {
  localStorage.removeItem(storageKey(userId));
}

/** Soft ceiling after crop + JPEG encode (localStorage-friendly). */
export const AVATAR_MAX_BYTES = 1024 * 1024;
/** Exported square edge length in CSS pixels. */
export const AVATAR_OUTPUT_SIZE = 512;

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("invalid_image"));
    image.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("encode_failed"));
        else resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Encode canvas as JPEG data URL ≤ maxBytes.
 * Lowers quality, then shrinks the bitmap if still over.
 */
export async function canvasToJpegUnderMax(
  source: HTMLCanvasElement,
  maxBytes: number = AVATAR_MAX_BYTES,
): Promise<string> {
  let canvas = source;
  let size = canvas.width;

  for (let round = 0; round < 6; round += 1) {
    for (let quality = 0.92; quality >= 0.45; quality -= 0.08) {
      const blob = await canvasToJpegBlob(canvas, quality);
      if (blob.size <= maxBytes) return blobToDataUrl(blob);
    }
    size = Math.max(128, Math.round(size * 0.75));
    const next = document.createElement("canvas");
    next.width = size;
    next.height = size;
    const ctx = next.getContext("2d");
    if (!ctx) throw new Error("encode_failed");
    ctx.drawImage(canvas, 0, 0, size, size);
    canvas = next;
  }

  const fallback = await canvasToJpegBlob(canvas, 0.4);
  if (fallback.size > maxBytes) throw new Error("too_large");
  return blobToDataUrl(fallback);
}

/**
 * Cover-scale so the image fills a square viewport of `viewSize` CSS pixels.
 */
export function avatarCoverScale(
  naturalWidth: number,
  naturalHeight: number,
  viewSize: number,
): number {
  return Math.max(viewSize / naturalWidth, viewSize / naturalHeight);
}

/**
 * Crop the visible square (image drawn with coverScale*zoom and offset) to a
 * JPEG data URL ≤ maxBytes.
 */
export async function exportAvatarCrop(options: {
  image: HTMLImageElement;
  viewSize: number;
  coverScale: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  outputSize?: number;
  maxBytes?: number;
}): Promise<string> {
  const {
    image,
    viewSize,
    coverScale,
    zoom,
    offsetX,
    offsetY,
    outputSize = AVATAR_OUTPUT_SIZE,
    maxBytes = AVATAR_MAX_BYTES,
  } = options;
  const scale = coverScale * zoom;
  const sx = -offsetX / scale;
  const sy = -offsetY / scale;
  const side = viewSize / scale;

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("encode_failed");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, outputSize, outputSize);
  ctx.drawImage(image, sx, sy, side, side, 0, 0, outputSize, outputSize);
  return canvasToJpegUnderMax(canvas, maxBytes);
}

/** Clamp pan so the image always covers the square viewport. */
export function clampAvatarOffset(
  offsetX: number,
  offsetY: number,
  displayWidth: number,
  displayHeight: number,
  viewSize: number,
): { x: number; y: number } {
  const minX = viewSize - displayWidth;
  const minY = viewSize - displayHeight;
  return {
    x: Math.min(0, Math.max(minX, offsetX)),
    y: Math.min(0, Math.max(minY, offsetY)),
  };
}
