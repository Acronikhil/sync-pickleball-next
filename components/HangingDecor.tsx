import type { ThemeSpec } from "@/lib/themes";

/**
 * Festival decorations over the header photo: baubles, lanterns or stars on
 * strings that sway gently out of step, or bursts of colour for Holi. They
 * hang from the top edge, one at the far left and the rest on the right, so
 * they stay clear of the headline and the score card.
 *
 * Sizes are clamped to the screen width, so on a phone they shrink rather
 * than crowd the header.
 */
const SPOTS = [
  { x: "3%", len: 120, size: 44, dur: 4.2, delay: 0 },
  { x: "78%", len: 190, size: 54, dur: 5, delay: -1.3 },
  { x: "87%", len: 115, size: 40, dur: 3.8, delay: -2.1 },
  { x: "95%", len: 215, size: 48, dur: 4.6, delay: -0.7 },
];

const BAUBLE_COLORS = ["#d62d3c", "#e0b84a", "#1f9a5f", "#b7a2f2"];
const LANTERN_COLORS = ["#f59e0b", "#ef6c2e", "#f2c14e", "#e0518f"];
const STAR_COLORS = ["#f5d76e", "#e9e3ff", "#f5d76e", "#d8f65a"];

export function HangingDecor({ kind }: { kind: ThemeSpec["hanging"] }) {
  if (kind === "none") return null;
  if (kind === "splashes") return <ColourSplashes />;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-80 overflow-hidden" aria-hidden="true">
      {SPOTS.map((spot, i) => (
        <div
          key={i}
          className="hanging-item absolute top-0 flex flex-col items-center"
          style={{
            left: spot.x,
            animationDuration: `${spot.dur}s`,
            animationDelay: `${spot.delay}s`,
          }}
        >
          <span
            className="w-px bg-gradient-to-b from-white/10 to-white/45"
            // Never shorter than ~95px, so on phones the ornament hangs below
            // the menu bar rather than behind it.
            style={{
              height: `clamp(${Math.max(spot.len * 0.55, 95 + (i % 2) * 25)}px, ${spot.len / 13}vw, ${Math.max(spot.len, 120)}px)`,
            }}
          />
          <span
            className="block"
            style={{ width: `clamp(${spot.size * 0.6}px, ${spot.size / 14}vw, ${spot.size}px)` }}
          >
            {kind === "baubles" && <Bauble color={BAUBLE_COLORS[i % BAUBLE_COLORS.length]} />}
            {kind === "lanterns" && <Lantern color={LANTERN_COLORS[i % LANTERN_COLORS.length]} />}
            {kind === "stars" && <Star color={STAR_COLORS[i % STAR_COLORS.length]} />}
          </span>
        </div>
      ))}
    </div>
  );
}

function Bauble({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 46" className="w-full drop-shadow-[0_6px_14px_rgb(0_0_0/0.45)]">
      <rect x="15" y="0" width="10" height="7" rx="1.5" fill="#e0b84a" />
      <circle cx="20" cy="26" r="18" fill={color} />
      <path d="M4 24 Q20 30 36 24" stroke="rgb(255 255 255 / 0.35)" strokeWidth="2" fill="none" />
      <ellipse cx="13" cy="19" rx="4" ry="6" fill="rgb(255 255 255 / 0.45)" transform="rotate(25 13 19)" />
    </svg>
  );
}

/** A star-shaped paper lantern with a warm glow and a tassel. */
function Lantern({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 60" className="w-full" style={{ filter: `drop-shadow(0 0 10px ${color})` }}>
      <rect x="17" y="0" width="6" height="4" rx="1" fill="#7a3b10" />
      <path d="M20 4 L27 14 L38 18 L29 27 L31 38 L20 33 L9 38 L11 27 L2 18 L13 14 Z" fill={color} />
      <path d="M20 10 L24 17 L31 19 L26 24 L27 31 L20 28 L13 31 L14 24 L9 19 L16 17 Z" fill="rgb(255 240 200 / 0.75)" />
      <path d="M20 35 V50" stroke={color} strokeWidth="1.5" />
      <path d="M17 50 h6 l-1 8 h-4 z" fill={color} />
    </svg>
  );
}

function Star({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 40" className="w-full" style={{ filter: `drop-shadow(0 0 8px ${color})` }}>
      <path
        d="M20 2 L24.7 14.6 L38 15.2 L27.6 23.4 L31.2 36.4 L20 29 L8.8 36.4 L12.4 23.4 L2 15.2 L15.3 14.6 Z"
        fill={color}
      />
    </svg>
  );
}

/** Holi: soft bursts of coloured powder in the header's corners. */
function ColourSplashes() {
  const bursts = [
    { className: "-left-16 top-24 size-72", color: "#e2407a" },
    { className: "right-[8%] top-16 size-80", color: "#f2a52b" },
    { className: "-right-20 top-1/2 size-72", color: "#39b37a" },
    { className: "left-[30%] -top-24 size-64", color: "#4a7be0" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {bursts.map((burst, i) => (
        <span
          key={i}
          className={`holi-burst absolute rounded-full ${burst.className}`}
          style={{
            background: `radial-gradient(circle, ${burst.color} 0%, transparent 65%)`,
            animationDelay: `${-i * 1.7}s`,
          }}
        />
      ))}
    </div>
  );
}
