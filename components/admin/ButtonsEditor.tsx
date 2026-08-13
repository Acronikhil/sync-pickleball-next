"use client";

import { ICON_NAMES, createButton, type Button, type IconName } from "@/lib/content";
import { CheckboxField, SelectField, TextField } from "./Fields";

const ICON_OPTIONS = ICON_NAMES.map((name) => ({
  value: name,
  label:
    name === "none"
      ? "No icon"
      : name.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()),
}));

const EMPHASIS_OPTIONS = [
  { value: "secondary" as const, label: "Normal" },
  { value: "primary" as const, label: "Highlighted (like Book Now)" },
];

export function ButtonsEditor({
  buttons,
  onChange,
}: {
  buttons: Button[];
  onChange: (buttons: Button[]) => void;
}) {
  function update(id: string, patch: Partial<Button>) {
    onChange(
      buttons.map((button) =>
        button.id === id ? { ...button, ...patch } : button
      )
    );
  }

  function remove(id: string) {
    onChange(buttons.filter((button) => button.id !== id));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= buttons.length) return;
    const next = [...buttons];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="a-subsection">
      <div className="a-subsection-head">
        <span className="a-label">Buttons</span>
        <button
          type="button"
          className="a-btn a-btn-quiet a-btn-sm"
          onClick={() => onChange([...buttons, createButton()])}
        >
          + Add button
        </button>
      </div>

      {buttons.length === 0 && (
        <p className="a-hint">No buttons in this section.</p>
      )}

      {buttons.map((button, index) => (
        <div key={button.id} className="a-nested">
          <div className="a-nested-head">
            <strong>{button.label || "Untitled button"}</strong>
            <div className="a-row-actions">
              <button
                type="button"
                className="a-icon-btn"
                title="Move up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="a-icon-btn"
                title="Move down"
                disabled={index === buttons.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="a-icon-btn a-danger"
                title="Delete button"
                onClick={() => remove(button.id)}
              >
                ✕
              </button>
            </div>
          </div>

          <TextField
            label="Label"
            value={button.label}
            onChange={(label) => update(button.id, { label })}
          />
          <TextField
            label="Link"
            value={button.href}
            placeholder="https://… or #section-id — leave blank for no link"
            hint="Use a full URL for external links, or #section-id to scroll to a section on this page."
            onChange={(href) => update(button.id, { href })}
          />
          <SelectField<IconName>
            label="Icon"
            value={button.icon}
            options={ICON_OPTIONS}
            onChange={(icon) => update(button.id, { icon })}
          />
          <SelectField
            label="Style"
            value={button.emphasis}
            options={EMPHASIS_OPTIONS}
            onChange={(emphasis) => update(button.id, { emphasis })}
          />
          <CheckboxField
            label="Open in a new tab"
            checked={button.newTab}
            onChange={(newTab) => update(button.id, { newTab })}
          />
        </div>
      ))}
    </div>
  );
}
