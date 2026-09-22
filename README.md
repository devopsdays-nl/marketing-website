# DevOpsDays Amsterdam

The website for DevOpsDays Amsterdam. Astro 7, static output, no CMS and no backend —
content is plain files in this repo, edited by pull request.

## Quick start

```sh
npm install
npm run dev        # http://localhost:4321
```

| Command              | What it does                                        |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Dev server                                          |
| `npm run build`      | Static build into `dist/`                           |
| `npm test`           | Unit tests (contrast, status machine, dates, logo)  |
| `npm run test:build` | Tests against `dist/` — run `npm run build` first   |
| `npm run typecheck`  | `astro check`                                       |

## Adding content

**[docs/adding-content.md](docs/adding-content.md)** — written for organisers, not
developers. Announcing the dates is a two-line edit on github.com.

## How the site knows what to show

One field, `status` in `src/content/editions/2027.yaml`, decides what renders. It is
what lets one codebase carry every edition instead of being rebuilt each year.

| Status         | Home                                  | Nav                                  |
| -------------- | ------------------------------------- | ------------------------------------ |
| `planning`     | nothing; previous edition still on `/` | —                                    |
| `announced`    | save-the-date, "Where things stand"    | Sponsor, Past editions, Contact      |
| `cfp-open`     | adds a Propose call to action          | + Propose                            |
| `tickets-open` | adds Get tickets as the primary action | + Tickets                            |
| `live`         | programme and speaker teasers          | everything                           |
| `archived`     | rolls to `/archive/[year]`             | —                                    |

A menu item never appears until it leads somewhere. Change `status`, and the nav,
the home page and the calls to action all change together — `/styleguide` shows the
whole table generated from the real code.

## Two rules worth knowing before you change anything

**Never invent a fact.** No guessed dates, prices or attendance numbers, including
in test data. An unknown value is left blank and renders as a `[TBC]` chip. Figures
that are safe to state, counted from the real 2025 data: 43 speakers, 17 workshops,
20 sponsors, 3 days, organised since 2013.

**Orange is never text on a light surface.** The logo orange is 2.84:1 on white,
which fails WCAG AA. The site is dark-first; on light sections orange text becomes
`--orange-ink`. `tests/contrast.test.ts` parses `src/styles/tokens.css` and fails
the build if any pairing in use drops below 4.5:1, so this is enforced rather than
remembered.

## Layout

```
src/
  config/site.ts          SITE_URL — the single swap point for the domain
  content.config.ts       Zod schemas for all collections
  content/                editions, pages, organisers (speakers/sessions/sponsors to come)
  lib/                    status machine, dates, colour maths, SVG surgery
  components/             Button, PlaceholderChip, SessionBadge, PersonCard, Logo, ...
  styles/tokens.css       the palette, sampled from the vector logo artwork
  assets/logo/            evergreen logo assets, generated from source/
scripts/prepare-logos.ts  strips the baked-in year from the artwork
tests/                    unit tests; tests/build/ runs against dist/
docs/                     organiser-facing guides
```

## Open decisions

- **Domain** — not chosen. Everything derives from `SITE.url` in
  `src/config/site.ts`; changing it is one line plus a CI variable.
- **Hosting** — not chosen. CI builds and checks but does not deploy.

See `docs/` for the rest.
