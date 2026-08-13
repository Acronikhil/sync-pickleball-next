/**
 * Client-side image preparation.
 *
 * Uploads land in the git repo permanently, so oversized originals are a real
 * cost — the existing pickleball.png is 2 MB on its own. Every upload is
 * downscaled and re-encoded as JPEG in the browser before it is committed.
 */

import { siteConfig } from "@/site.config";

export interface PreparedImage {
  /** Base64 JPEG data, ready to hand to the blob API. */
  base64: string;
  /** Site-root-relative path the content should point at. */
  src: string;
  /** Repo-relative path the file is committed to. */
  repoPath: string;
  /** Data URL for immediate preview, before anything is committed. */
  previewUrl: string;
  bytes: number;
}

function slugify(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "image"
  );
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image."));
    };
    image.src = url;
  });
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const image = await loadImage(file);
  const { maxWidth, quality } = siteConfig.imageUpload;

  const scale = Math.min(1, maxWidth / image.naturalWidth);
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not process the image in this browser.");

  // White backdrop so transparent PNGs don't turn black once flattened to JPEG.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);

  const fileName = `${slugify(file.name)}-${Date.now()}.jpg`;

  return {
    base64,
    src: `/uploads/${fileName}`,
    repoPath: `${siteConfig.uploadsPath}/${fileName}`,
    previewUrl: dataUrl,
    // base64 is ~4/3 the size of the bytes it encodes.
    bytes: Math.round((base64.length * 3) / 4),
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
