/**
 * The edition status machine.
 *
 * One field on the edition record decides what the whole site shows. This is the
 * mechanism that lets a single codebase carry every edition: rolling to the next
 * year is a status change, not a rebuild.
 *
 * The governing rule is that a menu item does not appear until it leads
 * somewhere. Before the CFP opens there is no Propose link; before the programme
 * exists there is no Programme link. A nav full of dead ends is what makes a
 * conference site look abandoned.
 */

export const EDITION_STATUSES = [
  'planning',
  'announced',
  'cfp-open',
  'tickets-open',
  'live',
  'archived',
] as const;

export type EditionStatus = (typeof EDITION_STATUSES)[number];

export interface NavItem {
  label: string;
  href: string;
}

export interface CallToAction {
  label: string;
  href: string;
}

/** Sections rendered on the home page, in order. */
export type HomeSection =
  | 'hero'
  | 'where-things-stand'
  | 'what-to-expect'
  | 'in-the-meantime'
  | 'stay-in-touch'
  | 'programme-teaser'
  | 'speakers-teaser'
  | 'sponsor-wall';

const NAV = {
  programme: { label: 'Programme', href: '/programme' },
  speakers: { label: 'Speakers', href: '/speakers' },
  location: { label: 'Location', href: '/location' },
  propose: { label: 'Propose', href: '/propose' },
  tickets: { label: 'Tickets', href: '/tickets' },
  sponsor: { label: 'Sponsor', href: '/sponsor' },
  archive: { label: 'Past editions', href: '/archive' },
  contact: { label: 'Contact', href: '/contact' },
} as const satisfies Record<string, NavItem>;

/**
 * Whether this edition should occupy the home page and appear in navigation.
 * `planning` means the previous edition is still on /; `archived` means the next
 * one has taken over and this edition has rolled to /archive/[year].
 */
export function isPublic(status: EditionStatus): boolean {
  return status !== 'planning' && status !== 'archived';
}

/**
 * Top bar contents. Archive is promoted into the nav during the quiet period
 * before a programme exists, because past editions are then the most useful
 * thing the site can offer; once the edition is live it returns to the footer
 * so it does not compete with the current programme.
 */
export function navItems(status: EditionStatus): NavItem[] {
  switch (status) {
    case 'planning':
    case 'archived':
      return [];

    case 'announced':
      return [NAV.sponsor, NAV.archive, NAV.contact];

    case 'cfp-open':
      return [NAV.propose, NAV.sponsor, NAV.archive, NAV.contact];

    case 'tickets-open':
      return [NAV.propose, NAV.tickets, NAV.sponsor, NAV.archive, NAV.contact];

    case 'live':
      return [
        NAV.programme,
        NAV.speakers,
        NAV.location,
        NAV.tickets,
        NAV.sponsor,
        NAV.contact,
      ];
  }
}

/**
 * Home page composition. The announcement shape persists through cfp-open and
 * tickets-open — only the calls to action change — because there is still no
 * programme to tease.
 */
export function homeSections(status: EditionStatus): HomeSection[] {
  switch (status) {
    case 'planning':
    case 'archived':
      return [];

    case 'announced':
    case 'cfp-open':
    case 'tickets-open':
      return ['hero', 'where-things-stand', 'what-to-expect', 'in-the-meantime', 'stay-in-touch'];

    case 'live':
      return [
        'hero',
        'programme-teaser',
        'speakers-teaser',
        'what-to-expect',
        'sponsor-wall',
        'stay-in-touch',
      ];
  }
}

/**
 * The hero's primary button. Follows whatever is actually open: interest first,
 * then proposals, then ticket sales.
 */
export function primaryCta(status: EditionStatus): CallToAction | null {
  switch (status) {
    case 'planning':
    case 'archived':
      return null;

    case 'announced':
      // There is no mailing list yet, so this points at the channels that
      // already exist rather than at a sign-up form with nothing behind it.
      return { label: 'Stay in touch', href: '#stay-in-touch' };

    case 'cfp-open':
      return { label: 'Propose a talk', href: '/propose' };

    case 'tickets-open':
    case 'live':
      return { label: 'Get tickets', href: '/tickets' };
  }
}

/**
 * Resolves a call-to-action href against the page it is rendered on.
 *
 * The "Get notified" action is a fragment, and the newsletter section only
 * exists on the home page. In the nav of any other page a bare `#newsletter`
 * silently does nothing — the same dead end this module exists to prevent, so it
 * is fixed here rather than in the template.
 */
export function resolveCtaHref(href: string, pathname: string): string {
  if (!href.startsWith('#')) return href;

  const onHome = pathname === '/' || pathname === '';
  return onHome ? href : `/${href}`;
}
