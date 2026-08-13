"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

/**
 * Initialises AOS with the original site's settings. The `data-aos` attributes
 * now live on the components themselves rather than being assigned by a
 * DOMContentLoaded script, so a refresh is enough after content changes.
 */
export function ScrollAnimations() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      offset: 100,
      once: false,
      mirror: true,
      anchorPlacement: "center-center",
      easing: "ease-in-out-back",
    });

    // New sections added by the admin preview need AOS to re-scan the DOM.
    AOS.refreshHard();
  }, []);

  return null;
}
