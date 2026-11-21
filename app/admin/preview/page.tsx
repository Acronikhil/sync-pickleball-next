"use client";

import { useEffect, useState } from "react";
import type { SiteContent } from "@/lib/content";
import { SiteRenderer } from "@/components/SiteRenderer";

/**
 * The editor's live preview. It runs inside an iframe on /admin, so the site
 * lays out against a real phone or desktop width rather than the editor's
 * pane. The editor posts the draft content in; this page just renders it.
 *
 * Messages (same origin only):
 *   in:  { type: "sync-preview", content }     draft to show
 *   in:  { type: "sync-preview-scroll", target } a "#id" to bring into view
 *   out: { type: "sync-preview-ready" }         sent once on load
 */
export default function PreviewPage() {
  const [content, setContent] = useState<SiteContent | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; content?: SiteContent; target?: string };
      if (data?.type === "sync-preview" && data.content) setContent(data.content);
      if (data?.type === "sync-preview-scroll" && data.target) {
        document.querySelector(data.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    // Keep the preview on this page: in-page anchors scroll, but links that
    // would leave (booking, Instagram, maps) do nothing here.
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest("a");
      if (link && !(link.getAttribute("href") ?? "").startsWith("#")) event.preventDefault();
    };

    window.addEventListener("message", onMessage);
    document.addEventListener("click", onClick, true);
    window.parent.postMessage({ type: "sync-preview-ready" }, window.location.origin);
    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  if (!content) return <div style={{ minHeight: "100vh", background: "#0d0820" }} />;
  return <SiteRenderer content={content} />;
}
