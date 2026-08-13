"use client";

import { useId, useRef, useState } from "react";
import type { ImageRef } from "@/lib/content";
import { useUpload } from "./UploadContext";

export function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="a-field">
      <label className="a-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="a-input"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <p className="a-hint">{hint}</p>}
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  hint,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
}) {
  const id = useId();
  return (
    <div className="a-field">
      <label className="a-label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className="a-input a-textarea"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <p className="a-hint">{hint}</p>}
    </div>
  );
}

/** Heading fields that support the `_light_` / newline mini-format. */
export function RichTextField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <TextAreaField
      {...props}
      rows={props.rows ?? 2}
      hint="Press Enter for a line break. Wrap words in _underscores_ to make them lighter, e.g. Pro Shop, _On Point_"
    />
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  return (
    <div className="a-field">
      <label className="a-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="a-input"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="a-check">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

/**
 * Image picker: shows the current image, swaps in a new one, and edits the alt
 * text. Selecting a file downscales it and queues it for the next publish —
 * nothing is committed until the admin hits Publish.
 */
export function ImageField({
  label,
  value,
  onChange,
  previewSrc,
}: {
  label: string;
  value: ImageRef;
  onChange: (value: ImageRef) => void;
  /** Data URL to show instead of `value.src` for not-yet-published uploads. */
  previewSrc?: string;
}) {
  const { uploadImage } = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const src = await uploadImage(file);
      onChange({ ...value, src });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="a-field">
      <span className="a-label">{label}</span>
      <div className="a-image-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="a-thumb"
          src={previewSrc ?? value.src}
          alt=""
          onError={(event) => {
            event.currentTarget.style.opacity = "0.25";
          }}
        />
        <div className="a-image-actions">
          <button
            type="button"
            className="a-btn a-btn-quiet"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Processing…" : "Replace image"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <code className="a-path">{value.src}</code>
        </div>
      </div>
      {error && <p className="a-error">{error}</p>}
      <TextField
        label="Alt text (for screen readers and SEO)"
        value={value.alt}
        onChange={(alt) => onChange({ ...value, alt })}
      />
    </div>
  );
}
