"use client";

import { useEffect, useState } from "react";
import "../admin.css";
import { completeLogin } from "@/lib/auth";

/**
 * Where GitHub sends the admin back after authorising.
 *
 * The query string is read from `window.location` rather than
 * `useSearchParams`, which would force this page out of static export into a
 * Suspense boundary for no benefit — there is no server to read params on.
 */
export default function CallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const denied = params.get("error_description") ?? params.get("error");

    if (denied) {
      setError(denied);
      return;
    }

    if (!code || !state) {
      setError("GitHub did not send a login code. Try signing in again.");
      return;
    }

    completeLogin(code, state)
      .then(() => {
        // replace() so the code never lands in history.
        window.location.replace("/admin/");
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error ? cause.message : "Could not complete sign in."
        );
      });
  }, []);

  return (
    <div className="a-shell">
      <div className="a-login">
        <h1>{error ? "Sign in failed" : "Signing you in…"}</h1>
        {error && <p className="a-status a-status-err">{error}</p>}
        <a className="a-btn" href="/admin/">
          Back to the editor
        </a>
      </div>
    </div>
  );
}
