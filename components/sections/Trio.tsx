import type { TrioSection } from "@/lib/content";
import { RichText } from "../RichText";

/**
 * The three-across amenity cards. The vertical divider between them comes from
 * `.seperator`, which the last card opts out of via `.last`.
 */
export function Trio({ data }: { data: TrioSection }) {
  return (
    <section id={data.id} className="main container py-5">
      <div className="row text-white text-center g-4">
        {data.cards.map((card, index) => {
          const isFirst = index === 0;
          const isLast = index === data.cards.length - 1;
          const classes = [
            "card seperator h-100 bg-transparent border-0",
            isLast ? "last" : "",
            isFirst ? "" : "border-start ps-4",
            isFirst || isLast ? "" : "border-light",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={card.id} className="col-lg-4 col-md-6 col-12">
              <div className={classes}>
                <div className="d-flex justify-content-center align-items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.image.src}
                    className="card-img-top rounded-4"
                    style={{ objectFit: "cover", height: 250 }}
                    alt={card.image.alt}
                    data-aos="zoom-in-up"
                  />
                </div>
                <div className="card-body d-flex flex-column align-items-center">
                  <h1
                    className="my-5 animated-header"
                    data-aos="fade-down"
                    data-aos-duration="850"
                  >
                    <RichText value={card.title} />
                  </h1>
                  <p
                    className="card-text mt-3 animated-para"
                    data-aos="fade-up"
                    data-aos-duration="900"
                  >
                    {card.body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
