import type { FeatureSection } from "@/lib/content";
import { ActionButton } from "../ActionButton";

/**
 * The wide "glow card" rows. `imageSide` flips the columns on desktop while
 * keeping the image first on mobile, matching the original ordering classes.
 */
export function Feature({ data }: { data: FeatureSection }) {
  const imageFirst = data.imageSide === "left";

  return (
    <section
      id={data.id}
      className="main container rounded-5 d-flex justify-content-center align-items-center py-5 flex-column"
    >
      <div className="glow-card w-100 p-xl-5 rounded-5" style={{ maxWidth: 960 }}>
        <div className="row g-4 m-xl-5">
          <div
            className={`col-md-5 ${
              imageFirst ? "order-1" : "order-1 order-md-2"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.image.src}
              className="img-fluid w-100 rounded-5"
              style={{
                objectFit: "cover",
                maxHeight: 300,
                aspectRatio: "4 / 3",
              }}
              alt={data.image.alt}
            />
          </div>

          <div
            className={`col-md-7 d-flex align-items-center ${
              imageFirst ? "order-2" : "order-2 order-md-1"
            }`}
          >
            <div className="card-body d-flex align-items-center flex-column gap-3 h-100 px-4 text-md-start text-center w-100">
              <h1 className="card-title" data-aos="fade-up">
                {data.title}
              </h1>
              <p
                className="card-text animated-card-text"
                data-aos="flip-up"
                data-aos-delay="100"
                data-aos-duration="1250"
              >
                {data.body}
              </p>
              {data.buttons.map((button) => (
                <ActionButton
                  key={button.id}
                  button={button}
                  className="align-self-start d-inline-flex mx-md-0 mx-auto"
                  style={{ width: "auto", color: "aliceblue" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
