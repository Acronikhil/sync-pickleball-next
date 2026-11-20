import { Fragment } from "react";
import { formatRichText } from "@/lib/content";

/**
 * Renders the mini rich-text format used by headings:
 *   newline -> <br>, _text_ -> accent (an italic serif, set against the bold
 *   grotesk of the rest of the heading).
 *
 * Built as React nodes rather than injected HTML, so admin-authored text can
 * never introduce markup or script into the page.
 */
export function RichText({
  value,
  accentClassName = "font-serif italic font-normal tracking-normal",
}: {
  value: string;
  accentClassName?: string;
}) {
  const lines = formatRichText(value);

  return (
    <>
      {lines.map((tokens, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 && <br />}
          {tokens.map((token, tokenIndex) =>
            token.light ? (
              <span key={tokenIndex} className={accentClassName}>
                {token.text}
              </span>
            ) : (
              <Fragment key={tokenIndex}>{token.text}</Fragment>
            )
          )}
        </Fragment>
      ))}
    </>
  );
}
