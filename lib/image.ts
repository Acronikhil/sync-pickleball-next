/**
 * Client-side image preparation.
 *
 * Uploads land in the git repo permanently, so oversized originals are a real
 * cost. Photos and raster logos are downscaled in the browser and saved as
 * WebP, which is smaller than JPEG and keeps transparency, so a logo with a
 * transparent background stays transparent. Browsers that can't encode WebP
 * fall back to PNG (if the image has transparency) or JPEG.
 *
 * SVGs and GIFs are kept exactly as they are: redrawing an SVG would lose its
 * sharpness at any size, and redrawing a GIF would stop its animation.
 *
 * The saved file's extension always matches what it actually contains.
 */

import { siteConfig } from "@/site.config";

export interface PreparedImage {
  /** Base64 file data, ready to hand to the blob API. */
  base64: string;
  /** Site-root-relative path the content should point at. */
  src: string;
  /** Repo-relative path the file is committed to. */
  repoPath: string;
  /** Data URL for immediate preview, before anything is committed. */
  previewUrl: string;
  bytes: number;
}

/** Biggest original we'll try to read. Phone photos are well under this. */
const MAX_INPUT_BYTES = 25 * 1024 * 1024;
/** SVGs and GIFs are committed as-is, so keep them reasonable. */
const MAX_PASSTHROUGH_BYTES = 5 * 1024 * 1024;

const PASSTHROUGH: Record<string, string> = {
  "image/svg+xml": "svg",
  "image/gif": "gif",
};

const EXTENSION_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
};

function slugify(name: string): string {
  return (
    name
      // Drop every extension, so "logo.webp.png" becomes "logo".
      .replace(/(\.[a-z0-9]{2,5})+$/i, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "image"
  );
}

/** The file's type, falling back to its extension when the browser gives none. */
function fileType(file: File): string {
  if (file.type) return file.type.toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[ext] ?? "";
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("That file could not be read."));
    reader.readAsDataURL(file);
  });
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
      reject(
        new Error(
          "This browser couldn't open that image. Please use a JPG, PNG or WebP file."
        )
      );
    };
    image.src = url;
  });
}

/** True if any pixel is even slightly see-through (sampled, for speed). */
function hasTransparency(context: CanvasRenderingContext2D, width: number, height: number): boolean {
  const { data } = context.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 16) {
    if (data[i] < 255) return true;
  }
  return false;
}

function prepared(dataUrl: string, baseName: string, ext: string): PreparedImage {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const fileName = `${baseName}-${Date.now()}.${ext}`;
  return {
    base64,
    src: `/uploads/${fileName}`,
    repoPath: `${siteConfig.uploadsPath}/${fileName}`,
    previewUrl: dataUrl,
    // base64 is ~4/3 the size of the bytes it encodes.
    bytes: Math.round((base64.length * 3) / 4),
  };
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const type = fileType(file);
  const baseName = slugify(file.name);

  if (type === "image/heic" || type === "image/heif") {
    throw new Error(
      "iPhone HEIC photos can't be shown on websites. Please pick a JPG or PNG instead, or set your iPhone camera to Most Compatible."
    );
  }
  if (!type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, WebP, GIF or SVG).");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("That image is over 25 MB. Please pick a smaller one.");
  }

  const passthroughExt = PASSTHROUGH[type];
  if (passthroughExt) {
    if (file.size > MAX_PASSTHROUGH_BYTES) {
      throw new Error(`That ${passthroughExt.toUpperCase()} is over 5 MB. Please pick a smaller one.`);
    }
    return prepared(await readAsDataUrl(file), baseName, passthroughExt);
  }

  const image = await loadImage(file);
  const { maxWidth, quality } = siteConfig.imageUpload;

  const scale = Math.min(1, maxWidth / image.naturalWidth);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not process the image in this browser.");

  context.drawImage(image, 0, 0, width, height);
  const transparent = hasTransparency(context, width, height);

  // WebP first: smaller than JPEG, and it keeps transparency.
  const webp = canvas.toDataURL("image/webp", quality);
  if (webp.startsWith("data:image/webp")) {
    return prepared(webp, baseName, "webp");
  }

  // This browser can't make WebP (it silently returns PNG instead).
  if (transparent) {
    return prepared(canvas.toDataURL("image/png"), baseName, "png");
  }
  // Opaque: JPEG is much smaller. Paint white behind it first, as JPEG has
  // no transparency to fall back on.
  context.globalCompositeOperation = "destination-over";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  return prepared(canvas.toDataURL("image/jpeg", quality), baseName, "jpg");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
