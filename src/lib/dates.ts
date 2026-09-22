/**
 * Date formatting.
 *
 * Session durations are deliberately not here. They are computed from startTime
 * and endTime rather than stored, so they cannot disagree with them — but the
 * programme page that needs them does not exist yet, so the helpers were removed
 * rather than kept unused. See the note in src/content.config.ts.
 */

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
