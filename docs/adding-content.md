# Adding and changing content

This page is for organisers, not developers. You do not need to know how the site
is built, and you do not need to run anything on your computer. Everything here is
done on github.com in a browser.

Nothing you do here can break the live site by accident. Changes go through a pull
request, the site is rebuilt and checked automatically, and somebody has to approve
it before it goes live.

---

## The one rule

**Never invent a fact.**

If the dates are not confirmed, leave them blank. The site will show a `[DATES TBC]`
chip by itself, and that is the correct thing to show. A guessed date that turns out
wrong is much worse than an honest "being confirmed".

The same goes for prices, attendee numbers and venue names.

---

## Announcing the dates

This is the most common change, and it is two lines.

1. Go to `src/content/editions/2027.yaml` on GitHub and click the pencil icon.
2. Find these two lines:

   ```yaml
   # startDate: 2027-06-16
   # endDate: 2027-06-18
   ```

3. Delete the `# ` from the start of each, and put in the real dates:

   ```yaml
   startDate: 2027-06-16
   endDate: 2027-06-18
   ```

4. Scroll down, write a short note like "Confirm 2027 dates", and choose
   **Create a new branch for this commit and start a pull request**.
5. Click **Propose changes**, then **Create pull request**.

That is it. The home page will stop saying `[DATES TBC]` and start showing the real
dates, in the right format, everywhere they appear. You do not have to edit anything
else.

Dates are written as `YYYY-MM-DD`. So 16 June 2027 is `2027-06-16`.

## Announcing the venue

Same file, same method:

```yaml
venueName: Pakhuis de Zwijger
venueAddress: Piet Heinkade 179, 1019 HC Amsterdam
```

## Opening the call for papers

Same file. Uncomment and fill in all three:

```yaml
cfpOpens: 2026-12-15
cfpCloses: 2027-01-31
cfpUrl: https://talks.devopsdays.org/devopsdays-amsterdam-2027/cfp
```

Then change the `status:` line near the top to:

```yaml
status: cfp-open
```

The "Propose" link appears in the menu, the big button on the home page becomes
"Propose a talk", and the call-for-papers row switches from "Not open yet" to
"Open". The CFP row will also close itself on the `cfpCloses` date without anyone
touching it.

## The status line

The `status:` line controls what the whole site shows. Set it to whichever stage
you are actually at:

| Set it to      | When                                             |
| -------------- | ------------------------------------------------ |
| `announced`    | You have announced the edition but nothing is open |
| `cfp-open`     | People can submit talks                          |
| `tickets-open` | People can buy tickets                           |
| `live`         | The programme is published                       |
| `archived`     | The event is over and the next one takes over     |

---

## Adding a speaker

1. Put their photo in `src/assets/speakers/2027/`, named after them:
   `firstname-lastname.jpg`. Square is best; it will be cropped to a circle.
2. Create a file at `src/content/speakers/2027/firstname-lastname.md` with this
   shape:

   ```markdown
   ---
   edition: "2027"
   name: Ada Lovelace
   pronouns: she/her
   photo: ../../../assets/speakers/2027/ada-lovelace.jpg
   links:
     - label: Website
       url: https://example.com
     - label: Mastodon
       url: https://hachyderm.io/@example
   ---

   Ada's bio goes here, as normal prose. A paragraph or two is plenty.
   ```

Only `edition` and `name` are required.

- **No photo?** Leave the `photo:` line out entirely. The site shows their initials
  in the same circle. Do not use a placeholder image.
- **No pronouns given?** Leave the line out. Do not guess.
- **One link, or none?** Include only what they actually gave you. The `links:`
  section can be left out completely.

To add a speaker to the site you do not need to touch any other file.

## Adding a session

Create `src/content/sessions/2027/some-talk-title.md`:

```markdown
---
edition: "2027"
title: What we learned running a platform team
type: talk
day: 2
startTime: "10:30"
endTime: "10:55"
speakers:
  - ada-lovelace
---

The abstract goes here.
```

- `type` is one of `talk`, `workshop`, `ignite`, `open-space` or `custom`
  (`custom` is for lunch, breaks, registration and so on).
- `day` is 1, 2 or 3.
- Times are 24-hour, in quotes: `"09:00"`, not `9:00`.
- **Do not add a duration.** The site works it out from the start and end times,
  so it can never disagree with them.
- The names under `speakers:` are the filenames of the speaker files, without
  `.md`.

Once the call for papers is running through pretalx, accepted talks are imported
automatically and you will not need to do this by hand.

## Adding a sponsor

1. Put the logo in `src/assets/sponsors/2027/`.
2. Create `src/content/sponsors/2027/company-name.yaml`:

   ```yaml
   edition: "2027"
   name: Example B.V.
   tier: gold
   logo: ../../../assets/sponsors/2027/example.svg
   url: https://example.com
   ```

`tier` is one of `gold`, `silver`, `bronze`, `coffee` or `lanyard`. An SVG logo is
much better than a PNG if they have one.

## Adding yourself as an organiser

Create `src/content/organisers/your-name.yaml`, copying one of the existing files.
If you helped in a previous year too, list every year:

```yaml
editions: [2025, 2027]
```

---

## Editing a normal page

The Code of Conduct, privacy note and Conference Buddy pages are ordinary text
files in `src/content/pages/`. Edit them on GitHub the same way. They are written
in Markdown: `##` starts a heading, `- ` starts a bullet, and `[text](https://url)`
makes a link.

---

## What happens after you open a pull request

The site is built and checked automatically. If something is wrong you will see a
red cross, and clicking it tells you what. The usual causes:

| Message mentions      | What it means                                            |
| --------------------- | -------------------------------------------------------- |
| `Expected HH:MM`      | A time is missing its quotes or its leading zero          |
| `Invalid url`         | A link is missing the `https://` at the front             |
| `does not exist`      | A photo filename does not match the file you uploaded     |
| `contrast`            | A colour was changed to something unreadable              |
| `Invalid input`       | A required line is missing, or `type`/`tier` is misspelled |

None of this reaches the live site. Fix the file and the checks run again.

If you get stuck, open the pull request anyway and ask in it — someone will help.
