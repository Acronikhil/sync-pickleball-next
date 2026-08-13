import type { CtaSection } from "@/lib/content";
import { ActionButton } from "../ActionButton";
import { RichText } from "../RichText";

export function Cta({ data }: { data: CtaSection }) {
  return (
    <section
      id={data.id}
      className="main container rounded-5 d-flex justify-content-center align-items-center py-5 flex-column"
    >
      <div className="d-flex h-100 flex-column align-items-center gap-lg-5">
        <h1 className="display-3 text-center" data-aos="fade-down">
          <RichText value={data.heading} />
        </h1>
        <p className="text-center" data-aos="fade-down" data-aos-duration="1200">
          {data.body}
        </p>
        {data.buttons.map((button) => (
          <ActionButton
            key={button.id}
            button={button}
            className="animate__animated animate__pulse animate__infinite"
          />
        ))}
      </div>
    </section>
  );
}
