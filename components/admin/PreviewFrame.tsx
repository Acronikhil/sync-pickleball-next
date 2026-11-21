"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteContent } from "@/lib/content";

export type PreviewDevice = "desktop" | "phone";

const SIZES: Record<PreviewDevice, { width: number; height: number }> = {
  desktop: { width: 1280, height: 800 },
  phone: { width: 390, height: 844 },
};

/**
 * The live preview: the real site in an iframe (/admin/preview) at a true
 * desktop or phone width, scaled down to fit the pane. Draft content is
 * posted in on every change, and `focus` scrolls the preview to whichever
 * part of the page is being edited.
 */
export function PreviewFrame({
  content,
  device,
  focus,
}: {
  content: SiteContent;
  device: PreviewDevice;
  focus?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [stage, setStage] = useState({ width: 0, height: 0 });

  // The preview page says when it's listening.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === "sync-preview-ready") {
        setReady(true);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    frameRef.current?.contentWindow?.postMessage({ type: "sync-preview", content }, window.location.origin);
  }, [ready, content]);

  useEffect(() => {
    if (!ready || !focus) return;
    frameRef.current?.contentWindow?.postMessage({ type: "sync-preview-scroll", target: focus }, window.location.origin);
  }, [ready, focus]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setStage({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const size = SIZES[device];
  const pad = 24;
  // Desktop fills the pane's width and as much height as it has; the phone
  // keeps its proportions and fits inside the pane.
  const scale =
    device === "desktop"
      ? Math.min(1, Math.max(0.1, (stage.width - pad * 2) / size.width))
      : Math.min(1, Math.max(0.1, (stage.height - pad * 2) / size.height), (stage.width - pad * 2) / size.width);
  const frameHeight = device === "desktop" ? Math.max(size.height, (stage.height - pad * 2) / scale) : size.height;

  return (
    <div ref={stageRef} className="a-preview-stage">
      {stage.width > 0 && (
        <div
          className={`a-preview-device a-preview-${device}`}
          style={{ width: size.width * scale, height: frameHeight * scale }}
        >
          <iframe
            ref={frameRef}
            src="/admin/preview/"
            title="Live preview of the site"
            style={{ width: size.width, height: frameHeight, transform: `scale(${scale})` }}
          />
        </div>
      )}
    </div>
  );
}
