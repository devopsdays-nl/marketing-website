# DevOpsDays Amsterdam

The website for DevOpsDays Amsterdam. One site that carries every edition, rather
than a new one each year.

Astro 7, static output, no CMS, no database, no backend. Content is plain files in
this repo, edited by pull request. The published site ships **zero JavaScript**.

---

## Quick start

```sh
npm install
npm run dev        # http://localhost:4321
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serve the built site locally |
| `npm test` | Unit tests — contrast, status machine, dates, links, logo |
| `npm run test:build` | Tests against `dist/`; run `npm run build` first |
| `npm run typecheck` | `astro check` |

Node 22.12+ (see `.nvmrc`).

---

## For organisers: changing the site

**Start here: [docs/adding-content.md](docs/adding-content.md).** It is written for
people who are not developers, and everything in it is done on github.com in a
browser — no local setup.

Announcing the dates is a two-line edit to one file. Adding a speaker is one new
file. You cannot break the live site by accident: every change goes through a pull
request that is built and checked automatically before anyone can merge it.

---

## How the site decides what to show

This is the one idea worth understanding before changing anything.

A single field — `status` in `src/content/editions/2027.yaml` — drives the whole
site. It is what lets one codebase carry every edition instead of being rebuilt
each year.

| `status` | Home page | Navigation |
| --- | --- | --- |
| `planning` | nothing; the previous edition still holds `/` | — |
| `announced` | save-the-date, "Where things stand" | Sponsor, Past editions, Contact |
| `cfp-open` | adds a Propose call to action | + Propose |
| `tickets-open` | adds Get tickets as the primary action | + Tickets |
| `live` | programme and speaker teasers, sponsor wall | everything |
| `archived` | rolls to `/archive/[year]` | — |

The governing rule: **a menu item never appears until it leads somewhere.** There
is no Propose link before the call for papers opens, and no Programme link before a
programme exists. A nav full of dead ends is what makes a conference site look
abandoned.

Change `status`, and the navigation, the home page and the calls to action all
change together. `/styleguide` shows this table generated from the real code, so it
cannot drift from what actually happens.

The "Where things stand" block works the same way. Each row is derived from the
edition record and the clock, so a row goes live on its own the moment a date
passes or a URL is filled in. Nothing is ever hand-edited twice.

---

## Two rules the build enforces

**1. Never invent a fact.** No guessed dates, prices or attendance figures —
including in test data. An unknown value is left blank and renders as a `[TBC]`
chip. That is a deliberate design decision: a site that says "coming soon" in vague
prose reads as abandoned, while one showing `[DATES TBC]` reads as actively
maintained and tells organisers which fields are still theirs to fill.

Figures that are safe to state, counted from the real archive data: 43 speakers, 17
workshops, 20 sponsors, 3 days, organised since 2013.

**2. Orange is never text on a light surface.** The logo orange is 2.84:1 on white,
which fails WCAG AA. The site is therefore dark-first; on light sections orange text
becomes `--orange-ink`. This is not a convention people have to remember:
`tests/contrast.test.ts` parses `src/styles/tokens.css` and fails the build if any
pairing in use drops below 4.5:1.

---

## Repository layout

```
src/
  config/site.ts          Site URL, social links — the one place they are defined
  content.config.ts       Zod schemas for every content collection
  content/
    editions/             One file per edition. This is what drives the site.
    organisers/           Evergreen — people, not editions
    pages/                Code of Conduct, Conference Buddy (Markdown)
    speakers/  sessions/  sponsors/     empty until the pretalx import lands
  lib/                    Pure logic, all unit-tested
    status.ts             The status machine: nav, home sections, calls to action
    status-rows.ts        "Where things stand"
    colour.ts             WCAG contrast maths, used by the contrast test
    dates.ts  url.ts  svg.ts
  components/             Button, PlaceholderChip, StatusPill, PersonCard, Logo…
  layouts/BaseLayout.astro
  pages/                  One file per route
  styles/tokens.css       The palette. Read directly by the contrast test.
  assets/logo/            Evergreen logo assets, generated from source/
scripts/prepare-logos.ts  Strips the baked-in year from the artwork
tests/                    Unit tests; tests/build/ runs against dist/
docs/                     Organiser-facing guides
```

### Routes

| Route | |
| --- | --- |
| `/` | Home. Composition depends on `status`. |
| `/sponsor` | Tiers and what each includes |
| `/archive` | Past editions |
| `/organisers` | The team, and how to join it |
| `/contact` | Email and social channels |
| `/code-of-conduct` | Linked from the footer of every page |
| `/conference-buddy` | The first-timer programme |
| `/styleguide` | Internal component reference, noindexed |

Still to build: `/programme`, `/speakers`, `/tickets`, `/propose`, `/location`, and
`/archive/[year]` once the archive import runs.

---

## Testing

Tests were written before the code they cover. The genuinely testable core is the
pure logic, and that is where they concentrate:

- **`contrast.test.ts`** parses the real token file and asserts every colour pairing
  in use. It does not hardcode values, so it keeps its meaning when a token changes.
- **`status.test.ts`** pins the exact navigation and page composition for all six
  statuses, including the regressions that matter — no Propose link before
  `cfp-open`.
- **`status-rows.test.ts`** drives the six rows from an edition record and a clock.
- **`tests/build/output.test.ts`** asserts against the built HTML: zero JavaScript,
  self-hosted fonts, every image has alt text, every link has an accessible name,
  external links open in a new tab, and no page states a fact we cannot verify.

Every assertion has been checked by mutation — deliberately breaking the thing it
guards and confirming the suite fails.

---

## Deployment

Hosted on **Cloudflare Pages**, which deploys straight from this private repo, so
the code stays closed while the site is publicly shareable.

Every push to `main` publishes; every pull request gets its own preview URL.

**Build settings** (set once in the Cloudflare dashboard, under
Workers & Pages → the project → Settings → Build):

| Setting | Value |
| --- | --- |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | read from `.nvmrc` (22.12.0) |

**Environment variable.** Set `SITE_URL` to the site's real origin, with no
trailing slash — e.g. `https://devopsdays-amsterdam.pages.dev`, or the custom
domain once there is one. Everything derived from it (canonical URLs, Open Graph
tags, the sitemap) follows automatically. Left unset, the build falls back to a
placeholder that is deliberately not a real domain.

Pull requests also run the full check suite in `.github/workflows/ci.yml`: unit
tests, typecheck, build, build-output tests, axe, link check and Lighthouse.

Moving to a custom domain later is a DNS record plus updating `SITE_URL` — no code
change.

## Open decisions

- **Domain.** Not chosen. `amsterdam.devopsdays.org` needs devopsdays core to add a
  DNS record; an owned domain does not. Everything derives from `SITE.url`.
- **Newsletter.** There is no mailing list. "Stay in touch" points at channels that
  already work. A real list needs a provider, double opt-in, and a privacy note.
- **Privacy page.** Deliberately absent. It needs to be written by a person who can
  commit to what it says.
- **Logo monogram.** Unusable as a favicon until the year drawn into its paths is
  removed. That needs the designer's original artwork, which is not in this repo.
- **Code of Conduct contacts.** Reproduced verbatim from the previous edition, so it
  names that edition's team. Re-confirm before launch.
