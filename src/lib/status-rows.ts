import { formatDateRange } from './dates';
import type { Edition } from './edition';

/**
 * The "Where things stand" block.
 *
 * A conference site that says "coming soon" in vague prose reads as abandoned.
 * One that lists exactly what is settled and what is not reads as actively
 * maintained, and it tells the organisers which fields are still theirs to fill.
 *
 * Every row is derived from the edition record and the current time, so a row
 * goes live on its own the moment a date passes or a URL is filled in. Nothing
 * here is ever hand-edited twice.
 */

export type RowState =
  /** A fact nobody knows yet. Renders as a dashed orange placeholder chip. */
  | 'tbc'
  /** A settled fact. Renders as a plain value. */
  | 'confirmed'
  /** An action that is not available yet, or no longer is. Dashed grey pill. */
  | 'pending'
  /** An action available right now. Solid orange pill, always with a link. */
  | 'open';

export interface StatusRow {
  label: string;
  value: string;
  state: RowState;
  href?: string;
}

/** True when `now` sits inside the window, treating absent bounds as open-ended. */
function isWithinWindow(now: Date, opens?: Date, closes?: Date): boolean {
  if (opens && now < opens) return false;
  if (closes && now >= closes) return false;
  return true;
}

/**
 * Builds the row for a thing that opens and closes on dates — the CFP and
 * ticket sales both behave this way.
 */
function windowRow(
  label: string,
  now: Date,
  url?: string,
  opens?: Date,
  closes?: Date,
): StatusRow {
  if (!url) {
    return { label, value: 'Not open yet', state: 'pending' };
  }
  if (closes && now >= closes) {
    return { label, value: 'Closed', state: 'pending' };
  }
  if (!isWithinWindow(now, opens, closes)) {
    return { label, value: 'Not open yet', state: 'pending' };
  }
  return { label, value: 'Open', state: 'open', href: url };
}

export function whereThingsStand(edition: Edition, now: Date): StatusRow[] {
  const dates: StatusRow =
    edition.startDate && edition.endDate
      ? {
          label: 'Dates',
          value: formatDateRange(edition.startDate, edition.endDate),
          state: 'confirmed',
        }
      : { label: 'Dates', value: '[DATES TBC]', state: 'tbc' };

  const venue: StatusRow = edition.venueName
    ? { label: 'Venue', value: edition.venueName, state: 'confirmed', href: '/location' }
    : { label: 'Venue', value: '[VENUE TBC]', state: 'tbc' };

  return [
    dates,
    venue,
    windowRow('Call for papers', now, edition.cfpUrl, edition.cfpOpens, edition.cfpCloses),
    windowRow('Tickets', now, edition.ticketsUrl, edition.ticketsOpen),
    // Sponsorship is the one thing genuinely open this early in the cycle.
    { label: 'Sponsorship', value: 'Open', state: 'open', href: '/sponsor' },
    {
      label: 'Contact',
      value: 'Open',
      state: 'open',
      href: `mailto:${edition.organiserEmail}`,
    },
  ];
}
