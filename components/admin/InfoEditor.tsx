"use client";

import type { ClubInfo, InfoRow, Review } from "@/lib/content";
import { createId } from "@/lib/content";
import { CheckboxField, SelectField, TextAreaField, TextField } from "./Fields";

/**
 * Editor for the "Club info" blocks: opening hours, prices, café menu and
 * reviews. Each has its own "show on the site" switch, and nothing appears
 * until it is switched on and has at least one line.
 */
export function InfoEditor({
  info,
  onChange,
}: {
  info: ClubInfo;
  onChange: (info: ClubInfo) => void;
}) {
  return (
    <>
      <Block title="Opening hours">
        <CheckboxField
          label="Show opening hours on the site"
          checked={info.hours.enabled}
          onChange={(enabled) => onChange({ ...info, hours: { ...info.hours, enabled } })}
        />
        <RowsEditor
          rows={info.hours.rows}
          labelName="Days"
          valueName="Time"
          labelPlaceholder="Mon to Fri"
          valuePlaceholder="6 am to 11 pm"
          addText="+ Add hours"
          onChange={(rows) => onChange({ ...info, hours: { ...info.hours, rows } })}
        />
      </Block>

      <Block title="Prices">
        <CheckboxField
          label="Show prices on the site"
          checked={info.prices.enabled}
          onChange={(enabled) => onChange({ ...info, prices: { ...info.prices, enabled } })}
        />
        <RowsEditor
          rows={info.prices.rows}
          labelName="What"
          valueName="Price"
          labelPlaceholder="Court, 1 hour"
          valuePlaceholder="₹800"
          addText="+ Add price"
          onChange={(rows) => onChange({ ...info, prices: { ...info.prices, rows } })}
        />
        <TextField
          label="Small print (optional)"
          value={info.prices.note}
          placeholder="Paddles and balls available to rent"
          onChange={(note) => onChange({ ...info, prices: { ...info.prices, note } })}
        />
      </Block>

      <Block title="Café menu">
        <CheckboxField
          label="Show the café menu on the site"
          checked={info.menu.enabled}
          onChange={(enabled) => onChange({ ...info, menu: { ...info.menu, enabled } })}
        />
        <RowsEditor
          rows={info.menu.rows}
          labelName="Item"
          valueName="Price"
          labelPlaceholder="Cold coffee"
          valuePlaceholder="₹180"
          addText="+ Add item"
          onChange={(rows) => onChange({ ...info, menu: { ...info.menu, rows } })}
        />
      </Block>

      <Block title="Reviews">
        <CheckboxField
          label="Show reviews on the site"
          checked={info.reviews.enabled}
          onChange={(enabled) => onChange({ ...info, reviews: { ...info.reviews, enabled } })}
        />
        <p className="a-hint">
          Use real reviews only, for example copied from Google, with the
          reviewer&apos;s name as they wrote it.
        </p>
        <ReviewsEditor
          items={info.reviews.items}
          onChange={(items) => onChange({ ...info, reviews: { ...info.reviews, items } })}
        />
      </Block>
    </>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="a-subsection">
      <div className="a-subsection-head">
        <span className="a-label">{title}</span>
      </div>
      {children}
    </div>
  );
}

function RowsEditor({
  rows,
  labelName,
  valueName,
  labelPlaceholder,
  valuePlaceholder,
  addText,
  onChange,
}: {
  rows: InfoRow[];
  labelName: string;
  valueName: string;
  labelPlaceholder: string;
  valuePlaceholder: string;
  addText: string;
  onChange: (rows: InfoRow[]) => void;
}) {
  const update = (id: string, patch: Partial<InfoRow>) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <>
      {rows.map((row, index) => (
        <div key={row.id} className="a-nested">
          <div className="a-nested-head">
            <strong>{row.label || `${labelName} ${index + 1}`}</strong>
            <div className="a-row-actions">
              <button type="button" className="a-icon-btn" title="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                ↑
              </button>
              <button
                type="button"
                className="a-icon-btn"
                title="Move down"
                disabled={index === rows.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="a-icon-btn a-danger"
                title="Delete"
                onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
              >
                ✕
              </button>
            </div>
          </div>
          <TextField
            label={labelName}
            value={row.label}
            placeholder={labelPlaceholder}
            onChange={(label) => update(row.id, { label })}
          />
          <TextField
            label={valueName}
            value={row.value}
            placeholder={valuePlaceholder}
            onChange={(value) => update(row.id, { value })}
          />
        </div>
      ))}
      <button
        type="button"
        className="a-btn a-btn-quiet a-btn-sm"
        onClick={() => onChange([...rows, { id: createId("row"), label: "", value: "" }])}
      >
        {addText}
      </button>
    </>
  );
}

const STAR_OPTIONS = [5, 4, 3, 2, 1].map((n) => ({
  value: String(n),
  label: `${"★".repeat(n)}${"☆".repeat(5 - n)}`,
}));

function ReviewsEditor({
  items,
  onChange,
}: {
  items: Review[];
  onChange: (items: Review[]) => void;
}) {
  const update = (id: string, patch: Partial<Review>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  return (
    <>
      {items.map((item, index) => (
        <div key={item.id} className="a-nested">
          <div className="a-nested-head">
            <strong>{item.name || `Review ${index + 1}`}</strong>
            <div className="a-row-actions">
              <button
                type="button"
                className="a-icon-btn a-danger"
                title="Delete review"
                onClick={() => onChange(items.filter((i) => i.id !== item.id))}
              >
                ✕
              </button>
            </div>
          </div>
          <TextAreaField label="What they said" value={item.quote} rows={3} onChange={(quote) => update(item.id, { quote })} />
          <TextField label="Name" value={item.name} onChange={(name) => update(item.id, { name })} />
          <SelectField
            label="Stars"
            value={String(item.rating)}
            options={STAR_OPTIONS}
            onChange={(rating) => update(item.id, { rating: Number(rating) })}
          />
        </div>
      ))}
      <button
        type="button"
        className="a-btn a-btn-quiet a-btn-sm"
        onClick={() => onChange([...items, { id: createId("review"), quote: "", name: "", rating: 5 }])}
      >
        + Add review
      </button>
    </>
  );
}
