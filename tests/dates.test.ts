import { describe, expect, it } from 'vitest';

import { formatDateRange } from '../src/lib/dates';

describe('formatDateRange', () => {
  it('collapses a range inside one month, as the 2025 edition needs', () => {
    const range = formatDateRange(new Date('2025-06-18'), new Date('2025-06-20'));
    expect(range).toBe('18–20 June 2025');
  });

  it('uses an en dash, not a hyphen', () => {
    const range = formatDateRange(new Date('2025-06-18'), new Date('2025-06-20'));
    expect(range).toContain('–');
    expect(range).not.toContain('-');
  });

  it('spells out both months when a range crosses one', () => {
    expect(formatDateRange(new Date('2027-06-29'), new Date('2027-07-01'))).toBe(
      '29 June – 1 July 2027',
    );
  });

  it('spells out both years when a range crosses one', () => {
    expect(formatDateRange(new Date('2027-12-30'), new Date('2028-01-02'))).toBe(
      '30 December 2027 – 2 January 2028',
    );
  });

  it('shows a single date when start and end are the same day', () => {
    expect(formatDateRange(new Date('2027-06-18'), new Date('2027-06-18'))).toBe('18 June 2027');
  });
});
