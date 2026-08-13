import type { HeroSection } from "@/lib/content";
import { ActionButton } from "../ActionButton";

export function Hero({ data }: { data: HeroSection }) {
  return (
    <section className="header py-5">
      <div className="container d-flex flex-column justify-content-center align-items-center gap-lg-2">
        <div className="image-container animate__animated animate__bounceIn animate__slower">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.logo.src}
            className="img-fluid mb-3 card-img-top sync-logo"
            style={{ maxWidth: 250 }}
            alt={data.logo.alt}
          />
        </div>

        <h1 className="heading mb-2 text-center mx-auto">{data.heading}</h1>

        <p className="mb-4 px-3 text-center w-100 content m-sm-0">{data.body}</p>

        <div
          className="d-flex flex-column justify-content-center align-items-center gap-3 w-100 px-4 px-sm-5 button-grp-parent"
          style={{ maxWidth: 400 }}
        >
          {data.buttons.map((button) => (
            <ActionButton
              key={button.id}
              button={button}
              className="button-grp"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
