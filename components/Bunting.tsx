/**
 * A string of little triangle flags for the top edge of a card, for New
 * Year and Holi. The flags flutter slightly, out of step with each other.
 */
export function Bunting({ colors, className = "" }: { colors: string[]; className?: string }) {
  const W = 400;
  const flags = 16;
  // One shallow swag across the width.
  const yAt = (x: number) => 4 + 8 * Math.sin((x / W) * Math.PI);

  let wire = `M0 ${yAt(0).toFixed(1)} `;
  for (let x = 10; x <= W; x += 10) wire += `L${x} ${yAt(x).toFixed(1)} `;

  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      <svg viewBox={`0 0 ${W} 40`} preserveAspectRatio="none" className="size-full overflow-visible">
        <path d={wire} fill="none" stroke="#e9e3ff" strokeOpacity="0.5" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        {Array.from({ length: flags }, (_, i) => {
          const x = ((i + 0.5) / flags) * W;
          const y = yAt(x);
          return (
            <path
              key={i}
              d={`M${x - 9} ${y} L${x + 9} ${y} L${x} ${y + 20} Z`}
              fill={colors[i % colors.length]}
              className="bunting-flag"
              style={{ animationDelay: `${(i * 0.29) % 2}s` }}
            />
          );
        })}
      </svg>
    </div>
  );
}
