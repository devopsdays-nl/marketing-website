import { describe, expect, it } from 'vitest';

import type { Edition } from '../src/lib/edition';
import { whereThingsStand } from '../src/lib/status-rows';

/**
 * The "Where things stand" block is the whole point of the announcement home:
 * it replaces vague "coming soon" prose with six rows that say exactly what is
 * and is not settled.
 *
 * The brief's requirement is that nothing is hand-edited twice — each row goes
 * live the moment its date passes or its URL is filled in. So these tests drive
 * the rows purely from the edition record and a clock.
 */

/** The 2027 edition as it actually stands today: almost nothing confirmed. */
const edition2027: Edition = {
  year: 2027,
  slug: '2027',
  ordinal: '14th',
  status: 'announced',
  organiserEmail: 'amsterdam@devopsdays.org',
};

const NOW = new Date('2026-09-22T12:00:00Z');

const rowFor = (label: string, edition: Edition = edition2027, now: Date = NOW) => {
  const row = whereThingsStand(edition, now).find((r) => r.label === label);
  if (!row) throw new Error(`No row labelled "${label}"`);
  return row;
};

describe('the shape of the block', () => {
  it('always renders the same six rows, so the block never looks half-built', () => {
    expect(whereThingsStand(edition2027, NOW).map((r) => r.label)).toEqual([
      'Dates',
      'Venue',
      'Call for papers',
      'Tickets',
      'Sponsorship',
      'Contact',
    ]);
  });

  it('renders all six even when the edition record is almost empty', () => {
    const bare: Edition = {
      year: 2028,
      slug: '2028',
      ordinal: '15th',
      status: 'planning',
      organiserEmail: 'amsterdam@devopsdays.org',
    };
    expect(whereThingsStand(bare, NOW)).toHaveLength(6);
  });

  it('gives every row a non-empty value, never a blank cell', () => {
    for (const row of whereThingsStand(edition2027, NOW)) {
      expect(row.value.trim(), `"${row.label}" has an empty value`).not.toBe('');
    }
  });
});

describe('facts that are not yet known', () => {
  it('marks the dates as TBC rather than inventing them', () => {
    expect(rowFor('Dates')).toMatchObject({ value: '[DATES TBC]', state: 'tbc' });
  });

  it('marks the venue as TBC rather than assuming Pakhuis de Zwijger again', () => {
    expect(rowFor('Venue')).toMatchObject({ value: '[VENUE TBC]', state: 'tbc' });
  });

  it('shows the real dates once they are filled in', () => {
    const confirmed = {
      ...edition2027,
      startDate: new Date('2027-06-16'),
      endDate: new Date('2027-06-18'),
    };
    expect(rowFor('Dates', confirmed)).toMatchObject({
      value: '16–18 June 2027',
      state: 'confirmed',
    });
  });

  it('links the venue to the location page once it is known', () => {
    const confirmed = { ...edition2027, venueName: 'Pakhuis de Zwijger' };
    expect(rowFor('Venue', confirmed)).toMatchObject({
      value: 'Pakhuis de Zwijger',
      state: 'confirmed',
      href: '/location',
    });
  });

  it('never emits a TBC row with a link, since there is nowhere to go', () => {
    for (const row of whereThingsStand(edition2027, NOW)) {
      if (row.state === 'tbc') expect(row.href, `"${row.label}"`).toBeUndefined();
    }
  });
});

describe('the call for papers row', () => {
  const withCfp = (overrides: Partial<Edition>): Edition => ({
    ...edition2027,
    cfpUrl: 'https://talks.devopsdays.org/devopsdays-amsterdam-2027/cfp',
    ...overrides,
  });

  it('reads "Not open yet" before the opening date', () => {
    const edition = withCfp({ cfpOpens: new Date('2026-12-01') });
    expect(rowFor('Call for papers', edition)).toMatchObject({
      value: 'Not open yet',
      state: 'pending',
    });
  });

  it('does not link anywhere before it opens, even though the URL is known', () => {
    const edition = withCfp({ cfpOpens: new Date('2026-12-01') });
    expect(rowFor('Call for papers', edition).href).toBeUndefined();
  });

  it('goes live by itself the moment the opening date passes', () => {
    const edition = withCfp({
      cfpOpens: new Date('2026-09-01'),
      cfpCloses: new Date('2026-12-31'),
    });
    expect(rowFor('Call for papers', edition)).toMatchObject({
      value: 'Open',
      state: 'open',
      href: 'https://talks.devopsdays.org/devopsdays-amsterdam-2027/cfp',
    });
  });

  it('closes itself by itself once the closing date passes', () => {
    const edition = withCfp({
      cfpOpens: new Date('2026-01-01'),
      cfpCloses: new Date('2026-06-30'),
    });
    expect(rowFor('Call for papers', edition)).toMatchObject({
      value: 'Closed',
      state: 'pending',
    });
  });

  it('stays pending while no URL exists at all', () => {
    expect(rowFor('Call for papers')).toMatchObject({ value: 'Not open yet', state: 'pending' });
  });
});

describe('the tickets row', () => {
  it('stays pending until a ticket URL exists', () => {
    expect(rowFor('Tickets')).toMatchObject({ value: 'Not open yet', state: 'pending' });
  });

  it('goes live once the sale date passes and the URL is set', () => {
    const edition: Edition = {
      ...edition2027,
      ticketsUrl: 'https://tickets.devopsdays.org/devopsdays-amsterdam-2027',
      ticketsOpen: new Date('2026-09-01'),
    };
    expect(rowFor('Tickets', edition)).toMatchObject({ value: 'Open', state: 'open' });
  });
});

describe('the rows that are open from day one', () => {
  it('shows sponsorship as open, because it is the one thing genuinely available', () => {
    expect(rowFor('Sponsorship')).toMatchObject({
      value: 'Open',
      state: 'open',
      href: '/sponsor',
    });
  });

  it('shows contact as open, pointing at the organiser mailbox', () => {
    expect(rowFor('Contact')).toMatchObject({
      value: 'Open',
      state: 'open',
      href: 'mailto:amsterdam@devopsdays.org',
    });
  });
});

describe('invariants', () => {
  it('every open row has somewhere to go', () => {
    const edition: Edition = {
      ...edition2027,
      cfpUrl: 'https://talks.devopsdays.org/x/cfp',
      cfpOpens: new Date('2026-01-01'),
      ticketsUrl: 'https://tickets.devopsdays.org/x',
      ticketsOpen: new Date('2026-01-01'),
    };
    for (const row of whereThingsStand(edition, NOW)) {
      if (row.state === 'open') expect(row.href, `"${row.label}" is open but has no link`).toBeTruthy();
    }
  });

  it('never invents a date, a price or an attendance number', () => {
    const values = whereThingsStand(edition2027, NOW).map((r) => r.value);
    // Any bare 4-digit year or currency amount here would be a fabricated fact.
    for (const value of values) {
      expect(value, `"${value}" looks like an invented figure`).not.toMatch(/\b(19|20)\d{2}\b|[€$£]/);
    }
  });
});
