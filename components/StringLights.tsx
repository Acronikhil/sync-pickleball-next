/**
 * A swag of glowing bulbs, like the string lights strung over the courts —
 * hung along the top edge of a card for Diwali and celebrations. Bulbs
 * twinkle out of step with each other (see `.string-bulb` in globals.css).
 */
export function StringLights({
  className = "",
  bulbs = 18,
}: {
  className?: string;
  bulbs?: number;
}) {
  const W = 400;
  const sag = 14;
  // Two shallow swags across the width.
  const yAt = (x: number) => 6 + sag * Math.sin((x / W) * Math.PI * 2 - Math.PI / 2) * 0.5 + sag * 0.5;
  const colors = ["#ffd166", "#ff9f43", "#d8f65a", "#ffb3c7", "#b7a2f2"];

  let wire = `M0 ${yAt(0).toFixed(1)} `;
  for (let x = 10; x <= W; x += 10) wire += `L${x} ${yAt(x).toFixed(1)} `;

  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      <svg viewBox={`0 0 ${W} 40`} preserveAspectRatio="none" className="size-full overflow-visible">
        <path d={wire} fill="none" stroke="#2b2240" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        {Array.from({ length: bulbs }, (_, i) => {
          const x = ((i + 0.5) / bulbs) * W;
          const y = yAt(x) + 5;
          return (
            <ellipse
              key={i}
              cx={x}
              cy={y}
              rx="3.2"
              ry="4.5"
              fill={colors[i % colors.length]}
              className="string-bulb"
              style={{ animationDelay: `${(i * 0.37) % 2.4}s`, color: colors[i % colors.length] }}
            />
          );
        })}
      </svg>
    </div>
  );
}
