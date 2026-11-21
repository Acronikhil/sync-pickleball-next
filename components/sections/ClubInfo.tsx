import type { ClubInfo as ClubInfoData, InfoRow } from "@/lib/content";

/** True when at least one block is switched on and has something in it. */
export function hasClubInfo(info?: ClubInfoData): boolean {
  if (!info) return false;
  return (
    (info.hours.enabled && info.hours.rows.length > 0) ||
    (info.prices.enabled && info.prices.rows.length > 0) ||
    (info.menu.enabled && info.menu.rows.length > 0) ||
    (info.reviews.enabled && info.reviews.items.length > 0)
  );
}

/**
 * "Plan your visit": opening hours, prices and the café menu as cards, with
 * reviews underneath. Only blocks the club has switched on and filled in
 * are shown, and the whole section is skipped when there are none.
 */
export function ClubInfo({ info }: { info?: ClubInfoData }) {
  if (!info || !hasClubInfo(info)) return null;

  const cards = [
    info.hours.enabled && info.hours.rows.length > 0 && { title: "Opening hours", rows: info.hours.rows },
    info.prices.enabled && info.prices.rows.length > 0 && { title: "Prices", rows: info.prices.rows, note: info.prices.note },
    info.menu.enabled && info.menu.rows.length > 0 && { title: "Café menu", rows: info.menu.rows },
  ].filter(Boolean) as { title: string; rows: InfoRow[]; note?: string }[];

  const reviews = info.reviews.enabled ? info.reviews.items.filter((r) => r.quote.trim()) : [];

  return (
    <section id="info" className="scroll-mt-24 px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 data-reveal className="font-display text-3xl font-bold tracking-tight md:text-5xl">
          Plan your <span className="font-serif font-normal italic tracking-normal text-lime">visit</span>
        </h2>

        {cards.length > 0 && (
          <div className={`mt-12 grid gap-4 ${cards.length > 1 ? "md:grid-cols-2" : ""} ${cards.length > 2 ? "lg:grid-cols-3" : ""}`}>
            {cards.map((card, index) => (
              <div
                key={card.title}
                data-reveal={index * 0.08}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8"
              >
                <h3 className="font-display text-lg font-bold tracking-tight text-lilac">{card.title}</h3>
                <dl className="mt-5 divide-y divide-white/8">
                  {card.rows.map((row) => (
                    <div key={row.id} className="flex items-baseline justify-between gap-4 py-3">
                      <dt className="text-mist/80">{row.label}</dt>
                      <dd className="shrink-0 font-semibold text-cream">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                {card.note && <p className="mt-4 text-sm text-mist/55">{card.note}</p>}
              </div>
            ))}
          </div>
        )}

        {reviews.length > 0 && (
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, index) => (
              <figure
                key={review.id}
                data-reveal={index * 0.08}
                className="flex flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-court/25 to-transparent p-6 md:p-8"
              >
                <p className="text-lg tracking-wider text-lime" aria-label={`${review.rating} out of 5 stars`}>
                  {"★".repeat(review.rating)}
                  <span className="text-white/20">{"★".repeat(5 - review.rating)}</span>
                </p>
                <blockquote className="mt-4 flex-1 text-mist/85">“{review.quote}”</blockquote>
                {review.name && <figcaption className="mt-5 font-semibold text-cream">{review.name}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
