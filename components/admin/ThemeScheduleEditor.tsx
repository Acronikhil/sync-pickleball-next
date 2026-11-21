"use client";

import { createId } from "@/lib/content";
import {
  scheduleStatus,
  THEME_NAMES,
  THEMES,
  todayInIndia,
  type ScheduledTheme,
  type ScheduleStatus,
  type ThemeName,
} from "@/lib/themes";
import { SelectField, TextField } from "./Fields";

const STATUS_TEXT: Record<ScheduleStatus, string> = {
  live: "Live now",
  upcoming: "Upcoming",
  ended: "Ended",
  incomplete: "Needs dates",
};

/** Dates as people say them: "20 Dec 2026". */
function niceDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The festival schedule: each entry turns a theme on for a date range.
 * Entries are listed soonest first, with a status tag so it's clear which
 * one is live.
 */
export function ThemeScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: ScheduledTheme[];
  onChange: (schedule: ScheduledTheme[]) => void;
}) {
  const today = todayInIndia();
  const festivals = THEME_NAMES.filter((name) => name !== "none");

  const update = (id: string, patch: Partial<ScheduledTheme>) =>
    onChange(schedule.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));

  const add = () =>
    onChange([
      ...schedule,
      { id: createId("schedule"), name: "christmas", message: "", start: today, end: today },
    ]);

  const sorted = [...schedule].sort((a, b) => (a.start || "9").localeCompare(b.start || "9"));

  return (
    <div className="a-schedule">
      {sorted.length === 0 && (
        <p className="a-hint">
          Nothing scheduled yet. Add a festival with its dates and the site switches
          to it on the first day and back on the day after it ends.
        </p>
      )}

      {sorted.map((entry) => {
        const status = scheduleStatus(entry, today);
        const badDates = entry.start && entry.end && entry.end < entry.start;
        return (
          <div key={entry.id} className={`a-nested a-schedule-item is-${status}`}>
            <div className="a-nested-head">
              <strong>
                {THEMES[entry.name].label}
                {status !== "incomplete" && (
                  <span className="a-schedule-dates">
                    {niceDate(entry.start)} to {niceDate(entry.end)}
                  </span>
                )}
              </strong>
              <div className="a-row-actions">
                <span className={`a-tag a-tag-${status}`}>{STATUS_TEXT[status]}</span>
                <button
                  type="button"
                  className="a-icon-btn a-danger"
                  title="Remove from schedule"
                  onClick={() => onChange(schedule.filter((e) => e.id !== entry.id))}
                >
                  ✕
                </button>
              </div>
            </div>

            <SelectField
              label="Festival"
              value={entry.name}
              options={festivals.map((name) => ({ value: name, label: THEMES[name].label }))}
              onChange={(name: ThemeName) => update(entry.id, { name })}
            />
            <div className="a-date-row">
              <label className="a-field">
                <span className="a-label">Starts</span>
                <input
                  className="a-input"
                  type="date"
                  value={entry.start}
                  onChange={(event) => update(entry.id, { start: event.target.value })}
                />
              </label>
              <label className="a-field">
                <span className="a-label">Ends (last day)</span>
                <input
                  className="a-input"
                  type="date"
                  value={entry.end}
                  min={entry.start || undefined}
                  onChange={(event) => update(entry.id, { end: event.target.value })}
                />
              </label>
            </div>
            {badDates && <p className="a-error">The end date is before the start date.</p>}
            <TextField
              label="Banner message (optional)"
              value={entry.message}
              placeholder={THEMES[entry.name].defaultMessage}
              onChange={(message) => update(entry.id, { message })}
            />
          </div>
        );
      })}

      <button type="button" className="a-btn a-btn-quiet a-btn-sm" onClick={add}>
        + Schedule a festival
      </button>
    </div>
  );
}
