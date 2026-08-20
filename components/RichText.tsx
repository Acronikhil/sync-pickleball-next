import { Fragment } from "react";
import { formatRichText } from "@/lib/content";

/**
 * Renders the mini rich-text format used by headings:
 *   newline -> <br>, _text_ -> lighter weight.
 *
 * Built as React nodes rather than injected HTML, so admin-authored text can
 * never introduce markup or script into the page.
 */
export function RichText({ value }: { value: string }) {
  const lines = formatRichText(value);

  return (
    <>
      {lines.map((tokens, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 && <br />}
          {tokens.map((token, tokenIndex) =>
            token.light ? (
              <span key={tokenIndex} className="font-light">
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
