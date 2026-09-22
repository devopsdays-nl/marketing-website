import type { EditionStatus } from './status';

/**
 * One edition of the conference.
 *
 * Almost every field is optional on purpose. The site has to render correctly
 * when nothing is confirmed yet — that is the state 2027 is in today — and an
 * absent field is what drives a [TBC] chip. A required field here would force
 * someone to invent a value to make the build pass.
 */
export interface Edition {
  year: number;
  slug: string;
  /** "14th" — spelled out, because it appears in prose. */
  ordinal: string;
  status: EditionStatus;
  organiserEmail: string;

  startDate?: Date;
  endDate?: Date;

  venueName?: string;
  venueAddress?: string;

  cfpOpens?: Date;
  cfpCloses?: Date;
  cfpUrl?: string;

  ticketsOpen?: Date;
  ticketsUrl?: string;
}
