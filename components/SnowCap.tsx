/**
 * Settled snow. Two shapes:
 *   drift  a lumpy strip for the top edge of a card, with a few short drips
 *   mound  a soft dome to stand something in (a penguin's feet)
 *
 * The outline is generated from `seed`, so each drift looks different but is
 * identical between server and client renders. Size and place it with
 * `className` on the wrapper; the SVG stretches to fill it
 * (preserveAspectRatio="none"). The wrapper matters: an absolutely positioned
 * <svg> won't stretch between left/right insets the way a div does.
 */
export function SnowCap({
  className = "",
  seed = 1,
  shape = "drift",
}: {
  className?: string;
  seed?: number;
  shape?: "drift" | "mound";
}) {
  let state = seed * 7919;
  const rand = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };

  const W = 400;
  let d: string;

  if (shape === "mound") {
    // A dome with a couple of lumps on top.
    d =
      `M0 40 C30 38 50 ${14 + rand() * 4} 110 ${10 + rand() * 4} ` +
      `Q160 ${2 + rand() * 4} 200 ${6 + rand() * 3} Q250 ${1 + rand() * 4} 300 ${9 + rand() * 4} ` +
      `C350 ${14 + rand() * 4} 370 38 400 40 Z`;
  } else {
    // Top edge: a row of soft mounds, highest in the middle of the drift.
    const bumps = 16;
    d = "M0 26 L0 18 ";
    for (let i = 0; i < bumps; i++) {
      const x1 = ((i + 1) / bumps) * W;
      const xm = ((i + 0.5) / bumps) * W;
      const centre = 1 - Math.abs(xm / W - 0.5) * 1.4;
      const peak = 12 - centre * 8 - rand() * 5;
      const end = i === bumps - 1 ? 18 : 12 + rand() * 4 - centre * 3;
      d += `Q${xm.toFixed(1)} ${peak.toFixed(1)} ${x1.toFixed(1)} ${end.toFixed(1)} `;
    }
    d += `L${W} 26 `;
    // Bottom edge, right to left, with the odd drip.
    for (let x = W - 24; x > 24; x -= 26 + rand() * 34) {
      const len = 4 + rand() * 7;
      d += `L${(x + 4).toFixed(1)} 26 Q${x.toFixed(1)} ${(26 + len * 2).toFixed(1)} ${(x - 4).toFixed(1)} 26 `;
    }
    d += "Z";
  }

  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      <svg
        viewBox={`0 0 ${W} 40`}
        preserveAspectRatio="none"
        className="size-full overflow-visible drop-shadow-[0_3px_4px_rgb(13_8_32/0.35)]"
      >
        <path d={d} fill="#f7f4ff" />
        {shape === "drift" && (
          // A cool shadow along the base gives the drift some depth.
          <path d={`M0 22 L${W} 22 L${W} 26 L0 26 Z`} fill="#d9d0f5" opacity="0.7" />
        )}
      </svg>
    </div>
  );
}
