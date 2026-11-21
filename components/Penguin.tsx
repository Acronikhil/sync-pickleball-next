import type { ThemeSpec } from "@/lib/themes";

/**
 * Dinky, Sync's penguin: the mascot from the statue by the courts, drawn as SVG
 * and kitted out in a club headband with the logo's lime sparkle, or in a
 * festival outfit (see lib/themes.ts).
 *
 * Poses are CSS-driven (see `.penguin` in globals.css), so this stays a plain
 * server component and callers just flip `pose`:
 *   idle   blinks now and then
 *   wave   blinks and waves its right flipper
 *   cheer  both flippers up, hopping
 */
export function Penguin({
  pose = "idle",
  outfit = "none",
  className = "",
}: {
  pose?: "idle" | "wave" | "cheer";
  outfit?: ThemeSpec["outfit"];
  className?: string;
}) {
  const hat = outfit === "santa" || outfit === "party";

  return (
    <svg
      viewBox="0 0 120 140"
      className={`penguin ${className}`}
      data-pose={pose}
      aria-hidden="true"
    >
      <g className="penguin-body">
        {/* feet */}
        <ellipse cx="44" cy="131" rx="14" ry="6.5" fill="#ff8a3d" />
        <ellipse cx="76" cy="131" rx="14" ry="6.5" fill="#ff8a3d" />

        {/* flippers (behind the body) */}
        <ellipse className="penguin-wing-l" cx="22" cy="88" rx="9" ry="25" fill="#3f3b4d" transform="rotate(18 22 88)" />
        <ellipse className="penguin-wing-r" cx="98" cy="88" rx="9" ry="25" fill="#3f3b4d" transform="rotate(-18 98 88)" />

        {/* body and belly */}
        <ellipse cx="60" cy="86" rx="40" ry="46" fill="#4a4659" />
        <ellipse cx="60" cy="94" rx="29" ry="35" fill="#fbf9ff" />

        {/* head */}
        <circle cx="60" cy="46" r="36" fill="#4a4659" />
        {/* face mask: two lobes round the eyes, joined over the beak */}
        <circle cx="47" cy="49" r="17" fill="#fbf9ff" />
        <circle cx="73" cy="49" r="17" fill="#fbf9ff" />
        <ellipse cx="60" cy="61" rx="22" ry="14" fill="#fbf9ff" />

        {outfit === "holi" && (
          // Streaks of gulal on the head, cheek and belly.
          <g opacity="0.85">
            <path d="M34 22 Q44 12 58 16 Q50 24 36 28Z" fill="#e2407a" />
            <path d="M74 14 Q88 16 92 28 Q82 26 74 20Z" fill="#39b37a" />
            <ellipse cx="82" cy="63" rx="7" ry="4" fill="#f2a52b" />
            <path d="M46 98 Q56 90 70 96 Q62 106 48 104Z" fill="#4a7be0" />
            <circle cx="70" cy="114" r="4" fill="#a35ce0" />
          </g>
        )}

        {/* club headband + sparkle (under any hat) */}
        {!hat && (
          <>
            <path d="M27 33 Q60 12 93 33" fill="none" stroke="#6a4fc0" strokeWidth="7" strokeLinecap="round" />
            <path d="M60 15c.6 4 2.6 6 6.6 6.6-4 .6-6 2.6-6.6 6.6-.6-4-2.6-6-6.6-6.6 4-.6 6-2.6 6.6-6.6z" fill="#d8f65a" />
          </>
        )}

        {/* eyes */}
        <g className="penguin-eyes">
          {/* Pupils move as one; PenguinGaze points them at the cursor. */}
          <g className="penguin-pupils">
            <circle cx="48" cy="49" r="8.5" fill="#1b1530" />
            <circle cx="72" cy="49" r="8.5" fill="#1b1530" />
            <circle cx="51" cy="45.5" r="3" fill="#fff" />
            <circle cx="75" cy="45.5" r="3" fill="#fff" />
          </g>
        </g>

        {/* cheeks and beak */}
        <ellipse cx="38" cy="62" rx="5" ry="3" fill="#ff9fb5" opacity="0.75" />
        <ellipse cx="82" cy="62" rx="5" ry="3" fill="#ff9fb5" opacity="0.75" />
        <path d="M52 59 Q60 54 68 59 Q60 70 52 59Z" fill="#ff8a3d" />

        {outfit === "santa" && (
          <g>
            <path d="M30 24 C34 -6 74 -14 100 4 C92 8 88 14 90 24 Z" fill="#d62d3c" />
            <rect x="24" y="19" width="72" height="12" rx="6" fill="#fbf9ff" />
            <circle cx="101" cy="5" r="7" fill="#fbf9ff" />
          </g>
        )}

        {outfit === "party" && (
          <g>
            <path d="M42 22 L60 -20 L78 22 Z" fill="#8a5cff" />
            <path d="M47.5 9 L72.5 9 L70 3 L50 3 Z M53 -4 L67 -4 L65 -9 L55 -9 Z" fill="#d8f65a" />
            <circle cx="60" cy="-21" r="5" fill="#ff8a65" />
            <ellipse cx="60" cy="22" rx="19" ry="3" fill="#6a4fc0" />
          </g>
        )}

        {outfit === "garland" && (
          // A marigold garland round the neck.
          <g>
            {Array.from({ length: 13 }, (_, i) => {
              const a = Math.PI * (0.08 + (i / 12) * 0.84);
              return (
                <circle
                  key={i}
                  cx={60 - Math.cos(a) * 34}
                  cy={74 + Math.sin(a) * 16}
                  r="4.6"
                  fill={i % 2 ? "#ffb703" : "#fb8500"}
                />
              );
            })}
          </g>
        )}
      </g>
    </svg>
  );
}
