import type { Button } from "@/lib/content";
import type { ThemeSpec } from "@/lib/themes";
import { Icon } from "./Icon";

/**
 * The slim festival strip above everything else, in the theme's colours.
 * Scrolls away with the page; the nav stays.
 */
export function FestivalBanner({
  theme,
  message,
  book,
}: {
  theme: ThemeSpec;
  message: string;
  book?: Button;
}) {
  if (!message || !theme.banner) return null;

  return (
    <div
      role="region"
      aria-label="Announcement"
      className="relative z-[55] px-4 py-2.5 text-center text-sm font-medium text-white"
      style={{ background: theme.banner }}
    >
      <span className="mr-2">{message}</span>
      {book?.href && (
        <a
          href={book.href}
          {...(book.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="inline-flex items-center gap-1 whitespace-nowrap font-semibold underline decoration-white/50 underline-offset-4 hover:decoration-white"
        >
          {book.label}
          <Icon name="arrow-right" className="size-3.5" />
        </a>
      )}
    </div>
  );
}
