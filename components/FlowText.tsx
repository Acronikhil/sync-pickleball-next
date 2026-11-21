"use client";

import { useId, useLayoutEffect, useRef } from "react";

/**
 * Hollow display text with purple light running around its edges: a faint
 * base outline, plus gradient dashes that travel along the glyph outlines.
 *
 * It's SVG text so the stroke can be dashed and animated. The viewBox is
 * measured from the rendered glyphs once the font is in, so the text always
 * fits its box exactly; until then an estimate keeps the layout from jumping.
 */
export function FlowText({
  text,
  className = "",
  strokeWidth = 1.5,
}: {
  text: string;
  /** Size it with a height (e.g. `h-24`); the width follows the text. */
  className?: string;
  strokeWidth?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const id = useId().replace(/:/g, "");

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const node = textRef.current;
    if (!svg || !node) return;

    const fit = () => {
      const box = node.getBBox();
      if (box.width === 0) return;
      const pad = strokeWidth * 2;
      svg.setAttribute(
        "viewBox",
        `${box.x - pad} ${box.y - pad} ${box.width + pad * 2} ${box.height + pad * 2}`
      );
    };

    fit();
    document.fonts?.ready.then(fit);
  }, [text, strokeWidth]);

  // Rough first guess (font-size 100): ~0.62em per glyph, cap-height ~0.75em.
  const guessWidth = Math.max(1, text.length) * 62;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 -76 ${guessWidth} 80`}
      className={`flow-text ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`flow-${id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#b7a2f2" />
          <stop offset="50%" stopColor="#8a5cff" />
          <stop offset="100%" stopColor="#6a4fc0" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="0"
        fontSize="100"
        className="flow-text-base"
        strokeWidth={strokeWidth * 2}
      >
        {text}
      </text>
      <text
        ref={textRef}
        x="0"
        y="0"
        fontSize="100"
        className="flow-text-run"
        stroke={`url(#flow-${id})`}
        strokeWidth={strokeWidth * 3.2}
      >
        {text}
      </text>
      {/* Glyphs built from overlapping shapes would show their seams in
          an outline. A fill in the page colour on top hides every inner
          line (and the inner half of the strokes, hence their width). */}
      <text x="0" y="0" fontSize="100" className="flow-text-cover">
        {text}
      </text>
    </svg>
  );
}
