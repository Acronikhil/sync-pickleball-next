"use client";

import { useEffect, useRef, useState } from "react";
import { renderSignInButton } from "@/lib/auth";

/**
 * Renders Google's official "Sign in with Google" button. `onToken` fires
 * with the raw ID token as soon as the admin signs in — everything happens
 * in-page, so there's no callback route to wire up.
 */
export function GoogleSignInButton({
  onToken,
}: {
  onToken: (idToken: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    renderSignInButton(container, onToken).catch((cause: unknown) => {
      setError(
        cause instanceof Error ? cause.message : "Could not load Google Sign-In."
      );
    });
    // onToken is expected to be a stable callback from the caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div ref={containerRef} style={{ display: "flex", justifyContent: "center" }} />
      {error && <p className="a-error">{error}</p>}
    </div>
  );
}
