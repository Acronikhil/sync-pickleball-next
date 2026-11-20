/**
 * Sync's penguin — the mascot from the statue by the courts, drawn as SVG
 * and kitted out in a club headband with the logo's lime sparkle.
 *
 * Poses are CSS-driven (see `.penguin` in globals.css), so this stays a plain
 * server component and callers just flip `pose`:
 *   idle   blinks now and then
 *   wave   blinks and waves its right flipper
 *   cheer  both flippers up, hopping
 */
export function Penguin({
  pose = "idle",
  className = "",
}: {
  pose?: "idle" | "wave" | "cheer";
  className?: string;
}) {
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

        {/* headband + sparkle */}
        <path d="M27 33 Q60 12 93 33" fill="none" stroke="#6a4fc0" strokeWidth="7" strokeLinecap="round" />
        <path d="M60 15c.6 4 2.6 6 6.6 6.6-4 .6-6 2.6-6.6 6.6-.6-4-2.6-6-6.6-6.6 4-.6 6-2.6 6.6-6.6z" fill="#d8f65a" />

        {/* eyes */}
        <g className="penguin-eyes">
          <circle cx="48" cy="49" r="8.5" fill="#1b1530" />
          <circle cx="72" cy="49" r="8.5" fill="#1b1530" />
          <circle cx="51" cy="45.5" r="3" fill="#fff" />
          <circle cx="75" cy="45.5" r="3" fill="#fff" />
        </g>

        {/* cheeks and beak */}
        <ellipse cx="38" cy="62" rx="5" ry="3" fill="#ff9fb5" opacity="0.75" />
        <ellipse cx="82" cy="62" rx="5" ry="3" fill="#ff9fb5" opacity="0.75" />
        <path d="M52 59 Q60 54 68 59 Q60 70 52 59Z" fill="#ff8a3d" />
      </g>
    </svg>
  );
}
