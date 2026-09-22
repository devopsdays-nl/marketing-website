/**
 * Date and duration formatting.
 *
 * Durations are always computed, never stored: the schedule shows one on every
 * row, and a stored duration is a third source of truth that can disagree with
 * the start and end times.
 */

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(time: string): number {
  const match = TIME_PATTERN.exec(time);
  if (!match) {
    throw new Error(`Not a 24-hour HH:MM time: "${time}"`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Minutes between two `HH:MM` times on the same day. */
export function durationMinutes(startTime: string, endTime: string): number {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  if (end < start) {
    throw new Error(`End time "${endTime}" is before start time "${startTime}"`);
  }
  return end - start;
}

/** Renders a duration the way the schedule shows it: "25 min", "1 hr 30 min". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} hr`;
  return `${hours} hr ${rest} min`;
}

const DAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'UTC' });
const MONTH = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' });
const YEAR = new Intl.DateTimeFormat('en-GB', { year: 'numeric', timeZone: 'UTC' });

/**
 * Formats an event date range, collapsing whatever the two dates share.
 * Uses an en dash, and a spaced en dash when the parts either side are phrases.
 */
export function formatDateRange(start: Date, end: Date): string {
  const [startDay, startMonth, startYear] = [DAY, MONTH, YEAR].map((f) => f.format(start));
  const [endDay, endMonth, endYear] = [DAY, MONTH, YEAR].map((f) => f.format(end));

  if (startYear !== endYear) {
    return `${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endYear}`;
  }
  if (startDay !== endDay) {
    return `${startDay}–${endDay} ${startMonth} ${startYear}`;
  }
  return `${startDay} ${startMonth} ${startYear}`;
}
