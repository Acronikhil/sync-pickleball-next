import { Icon } from "../Icon";

/**
 * The tilted lime ticker under the hero. Its words come from content (the hero
 * heading), so it follows whatever the admin writes there. The list is
 * rendered twice and slid by half its width for a seamless loop.
 */
export function Marquee({ words }: { words: string[] }) {
  if (words.length === 0) return null;

  const run = Array.from({ length: 4 }, () => words).flat();

  return (
    <div className="relative z-10 -my-6 -rotate-2 overflow-hidden bg-lime py-4 text-night shadow-[0_20px_60px_-20px] shadow-lime/40" aria-hidden="true">
      <div className="flex w-max animate-marquee">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {run.map((word, index) => (
              <span
                key={index}
                className="flex items-center gap-8 pr-8 font-display text-2xl font-extrabold uppercase tracking-tight md:text-4xl"
              >
                {word}
                <Icon name="sparkle" className="size-6 text-court md:size-8" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
