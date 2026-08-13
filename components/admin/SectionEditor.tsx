"use client";

import { useState } from "react";
import type {
  AnySection,
  BodySection,
  HeroSection,
  ImageRef,
} from "@/lib/content";
import { createId } from "@/lib/content";
import {
  ImageField,
  RichTextField,
  SelectField,
  TextAreaField,
  TextField,
} from "./Fields";
import { ButtonsEditor } from "./ButtonsEditor";

const SECTION_LABELS: Record<AnySection["type"], string> = {
  hero: "Header",
  feature: "Wide card",
  trio: "Three cards",
  cta: "Call to action",
};

/** A short human label so collapsed sections are recognisable at a glance. */
function summarise(section: AnySection): string {
  switch (section.type) {
    case "hero":
      return section.heading;
    case "feature":
      return section.title;
    case "cta":
      return section.heading.replace(/\n/g, " ").replace(/_/g, "");
    case "trio":
      return section.cards
        .map((card) => card.title.split("\n")[0].replace(/_/g, ""))
        .join(" · ");
  }
}

export interface SectionControls {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function SectionEditor({
  section,
  onChange,
  previews,
  controls,
  defaultOpen = false,
}: {
  section: AnySection;
  onChange: (section: AnySection) => void;
  previews: Record<string, string>;
  controls?: SectionControls;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  function preview(image: ImageRef) {
    return previews[image.src];
  }

  return (
    <section className="a-card">
      <header className="a-card-head">
        <button
          type="button"
          className="a-disclosure"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <span className="a-chevron">{open ? "▾" : "▸"}</span>
          <span className="a-kind">{SECTION_LABELS[section.type]}</span>
          <span className="a-summary">{summarise(section)}</span>
        </button>

        {controls && (
          <div className="a-row-actions">
            {controls.onMoveUp && (
              <button
                type="button"
                className="a-icon-btn"
                title="Move section up"
                disabled={!controls.canMoveUp}
                onClick={controls.onMoveUp}
              >
                ↑
              </button>
            )}
            {controls.onMoveDown && (
              <button
                type="button"
                className="a-icon-btn"
                title="Move section down"
                disabled={!controls.canMoveDown}
                onClick={controls.onMoveDown}
              >
                ↓
              </button>
            )}
            {controls.onDuplicate && (
              <button
                type="button"
                className="a-icon-btn"
                title="Duplicate section"
                onClick={controls.onDuplicate}
              >
                ⧉
              </button>
            )}
            {controls.onDelete && (
              <button
                type="button"
                className="a-icon-btn a-danger"
                title="Delete section"
                onClick={controls.onDelete}
              >
                ✕
              </button>
            )}
          </div>
        )}
      </header>

      {open && (
        <div className="a-card-body">
          {section.type === "hero" && (
            <HeroFields
              section={section}
              onChange={onChange}
              preview={preview}
            />
          )}
          {section.type === "feature" && (
            <FeatureFields
              section={section}
              onChange={onChange}
              preview={preview}
            />
          )}
          {section.type === "trio" && (
            <TrioFields
              section={section}
              onChange={onChange}
              preview={preview}
            />
          )}
          {section.type === "cta" && (
            <CtaFields section={section} onChange={onChange} />
          )}
        </div>
      )}
    </section>
  );
}

/* ------------------------------ field groups ----------------------------- */

type Preview = (image: ImageRef) => string | undefined;

function HeroFields({
  section,
  onChange,
  preview,
}: {
  section: HeroSection;
  onChange: (section: AnySection) => void;
  preview: Preview;
}) {
  return (
    <>
      <ImageField
        label="Logo"
        value={section.logo}
        previewSrc={preview(section.logo)}
        onChange={(logo) => onChange({ ...section, logo })}
      />
      <TextField
        label="Heading"
        value={section.heading}
        onChange={(heading) => onChange({ ...section, heading })}
      />
      <TextAreaField
        label="Intro paragraph"
        value={section.body}
        rows={6}
        onChange={(body) => onChange({ ...section, body })}
      />
      <ButtonsEditor
        buttons={section.buttons}
        onChange={(buttons) => onChange({ ...section, buttons })}
      />
    </>
  );
}

function FeatureFields({
  section,
  onChange,
  preview,
}: {
  section: Extract<BodySection, { type: "feature" }>;
  onChange: (section: AnySection) => void;
  preview: Preview;
}) {
  return (
    <>
      <TextField
        label="Section id"
        value={section.id}
        hint="Used for #anchor links from buttons. Keep it lowercase with dashes."
        onChange={(id) => onChange({ ...section, id })}
      />
      <ImageField
        label="Image"
        value={section.image}
        previewSrc={preview(section.image)}
        onChange={(image) => onChange({ ...section, image })}
      />
      <SelectField
        label="Image position (on desktop)"
        value={section.imageSide}
        options={[
          { value: "left" as const, label: "Left" },
          { value: "right" as const, label: "Right" },
        ]}
        onChange={(imageSide) => onChange({ ...section, imageSide })}
      />
      <TextField
        label="Title"
        value={section.title}
        onChange={(title) => onChange({ ...section, title })}
      />
      <TextAreaField
        label="Body text"
        value={section.body}
        rows={5}
        onChange={(body) => onChange({ ...section, body })}
      />
      <ButtonsEditor
        buttons={section.buttons}
        onChange={(buttons) => onChange({ ...section, buttons })}
      />
    </>
  );
}

function TrioFields({
  section,
  onChange,
  preview,
}: {
  section: Extract<BodySection, { type: "trio" }>;
  onChange: (section: AnySection) => void;
  preview: Preview;
}) {
  function updateCard(id: string, patch: Partial<(typeof section.cards)[number]>) {
    onChange({
      ...section,
      cards: section.cards.map((card) =>
        card.id === id ? { ...card, ...patch } : card
      ),
    });
  }

  function moveCard(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= section.cards.length) return;
    const cards = [...section.cards];
    [cards[index], cards[target]] = [cards[target], cards[index]];
    onChange({ ...section, cards });
  }

  return (
    <>
      <TextField
        label="Section id"
        value={section.id}
        hint="Used for #anchor links from buttons."
        onChange={(id) => onChange({ ...section, id })}
      />

      <div className="a-subsection">
        <div className="a-subsection-head">
          <span className="a-label">Cards</span>
          <button
            type="button"
            className="a-btn a-btn-quiet a-btn-sm"
            onClick={() =>
              onChange({
                ...section,
                cards: [
                  ...section.cards,
                  {
                    id: createId("card"),
                    image: { src: "/assets/images/image03.jpg", alt: "" },
                    title: "New card",
                    body: "Say something short and punchy.",
                  },
                ],
              })
            }
          >
            + Add card
          </button>
        </div>

        {section.cards.map((card, index) => (
          <div key={card.id} className="a-nested">
            <div className="a-nested-head">
              <strong>{card.title.split("\n")[0].replace(/_/g, "")}</strong>
              <div className="a-row-actions">
                <button
                  type="button"
                  className="a-icon-btn"
                  title="Move up"
                  disabled={index === 0}
                  onClick={() => moveCard(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="a-icon-btn"
                  title="Move down"
                  disabled={index === section.cards.length - 1}
                  onClick={() => moveCard(index, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="a-icon-btn a-danger"
                  title="Delete card"
                  onClick={() =>
                    onChange({
                      ...section,
                      cards: section.cards.filter((c) => c.id !== card.id),
                    })
                  }
                >
                  ✕
                </button>
              </div>
            </div>

            <ImageField
              label="Image"
              value={card.image}
              previewSrc={preview(card.image)}
              onChange={(image) => updateCard(card.id, { image })}
            />
            <RichTextField
              label="Title"
              value={card.title}
              onChange={(title) => updateCard(card.id, { title })}
            />
            <TextAreaField
              label="Body text"
              value={card.body}
              rows={4}
              onChange={(body) => updateCard(card.id, { body })}
            />
          </div>
        ))}
      </div>
    </>
  );
}

function CtaFields({
  section,
  onChange,
}: {
  section: Extract<BodySection, { type: "cta" }>;
  onChange: (section: AnySection) => void;
}) {
  return (
    <>
      <TextField
        label="Section id"
        value={section.id}
        hint="Used for #anchor links from buttons."
        onChange={(id) => onChange({ ...section, id })}
      />
      <RichTextField
        label="Heading"
        value={section.heading}
        onChange={(heading) => onChange({ ...section, heading })}
      />
      <TextAreaField
        label="Body text"
        value={section.body}
        rows={3}
        onChange={(body) => onChange({ ...section, body })}
      />
      <ButtonsEditor
        buttons={section.buttons}
        onChange={(buttons) => onChange({ ...section, buttons })}
      />
    </>
  );
}
