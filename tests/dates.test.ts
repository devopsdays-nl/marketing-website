import { describe, expect, it } from 'vitest';

import { durationMinutes, formatDateRange, formatDuration } from '../src/lib/dates';

/**
 * Durations are computed from start and end times, never stored. The 2025
 * schedule shows a duration on every row, and a stored field is a field someone
 * can get wrong — the archive data already disagrees with itself in places.
 */

describe('durationMinutes', () => {
  it('measures a standard 25-minute talk', () => {
    expect(durationMinutes('10:30', '10:55')).toBe(25);
  });

  it('measures across an hour boundary', () => {
    expect(durationMinutes('09:15', '10:45')).toBe(90);
  });

  it('measures a 90-minute workshop from the real 2025 schedule', () => {
    expect(durationMinutes('09:00', '10:30')).toBe(90);
  });

  it('measures a 15-minute break', () => {
    expect(durationMinutes('10:30', '10:45')).toBe(15);
  });

  it('returns 0 for a zero-length slot rather than throwing', () => {
    expect(durationMinutes('10:00', '10:00')).toBe(0);
  });

  it('rejects an end time before the start time, which means bad data', () => {
    expect(() => durationMinutes('11:00', '10:00')).toThrow(/before/i);
  });

  it('rejects a malformed time rather than silently producing NaN', () => {
    expect(() => durationMinutes('10:00', 'lunch')).toThrow();
    expect(() => durationMinutes('25:00', '26:00')).toThrow();
  });
});

describe('formatDuration', () => {
  it('shows plain minutes under an hour', () => {
    expect(formatDuration(25)).toBe('25 min');
    expect(formatDuration(5)).toBe('5 min');
  });

  it('shows whole hours without a stray zero', () => {
    expect(formatDuration(60)).toBe('1 hr');
    expect(formatDuration(120)).toBe('2 hr');
  });

  it('combines hours and minutes', () => {
    expect(formatDuration(90)).toBe('1 hr 30 min');
    expect(formatDuration(135)).toBe('2 hr 15 min');
  });
});

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
