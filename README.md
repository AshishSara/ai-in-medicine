# AI in Medicine · Western

**Live site:** https://ashishsara.github.io/ai-in-medicine/

A small, accessible resource and events site for the student-led AI in Medicine club at Western, serving London and Windsor. Plain HTML, CSS, and JavaScript; no framework, package installation, database, analytics, or API key.

## Updating resources

Edit **`data/resources.json`** to add a verified study resource. Only categories with links appear on the site. Keep unpublished, unverified, or restricted materials out of this public file; the website does not change Google sharing permissions or copy source content.

| Field | Value |
| --- | --- |
| `id` | Unique lowercase slug with hyphens. |
| `kind` | `notebooklm`, `obsidian`, or `drive`. |
| `title` | Clear notebook, file, folder, or course-block title. |
| `description` | Short plain-text explanation of what the resource contains. |
| `url` | Verified HTTPS destination, without embedded credentials or private access tokens. |
| `access` | `public` for an openly available resource, or `google-sign-in` for a publicly shared resource that requires a Google account. |

Before adding a link, verify that its owner intends it to be shared publicly and that the sharing setting allows the intended audience to open it. A URL visible in your own signed-in account is not sufficient evidence of public sharing. Link to the original Drive folder when appropriate so updates stay in one place. Do not upload Obsidian vaults, course files, or Drive contents to this public repository unless their contents and public distribution have been reviewed and explicitly authorized.

## Updating events

Edit **`data/events.json`** in GitHub and commit the change. Keep the surrounding array (`[]`) and separate multiple event objects with commas. Only add confirmed, public information. An empty array intentionally displays “No upcoming events announced.” Do not put draft events, private planning notes, participant information, or email content in this public file.

Every event has these fields:

| Field | Value |
| --- | --- |
| `id` | Permanent unique lowercase slug, with hyphens between words. Never rename it after sharing. |
| `title` | Confirmed public event title. |
| `description` | Plain text description. Use `\n` for a new line. HTML is displayed as text. |
| `start`, `end` | Confirmed ISO date and time, including seconds and UTC offset: `YYYY-MM-DDTHH:MM:SS-04:00` in Toronto daylight time or `-05:00` in standard time. Check the offset for the event date. |
| `timeZone` | IANA zone, usually `America/Toronto`. Dates on the site are shown in this zone, independent of the visitor’s device. |
| `location` | Public venue, campus, or “Online”; do not include a private meeting passcode. |
| `sourceUrl` | Public HTTPS event announcement confirming the details. Required. |
| `registrationUrl` | Optional confirmed public HTTPS registration link. Omit if none. |
| `resourcesUrl` | Optional public HTTPS recap or resources link, shown for past events. |
| `status` | Optional `scheduled` (default) or `cancelled`. Keep cancellations listed so shared links still work. |

Events automatically move to **Past events** once their end time has passed. Registration and calendar buttons are hidden for past and cancelled events. Direct links stay stable: append `#event-YOUR-ID` to the homepage. The “Link to event” control provides that URL. Calendar downloads work in calendar apps supporting `.ics` files.

Do not delete past events merely because they have finished. Preserve their IDs and add a public resources link when available. These event controls appear only when real events are added; no demonstration events ship on the public site.

## Preview and checks

Serve the project folder with any static HTTP server:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/`. A server is needed because the page fetches event JSON; opening the HTML with `file://` will not load the calendar.

For validation, use Node.js 22 or newer. No `npm install` is needed:

```sh
node --test
node scripts/check.mjs
node scripts/build.mjs
```

`dist/` contains only the deployable HTML, styles, scripts, and public data. Test fixtures and documentation are excluded. The CI check runs tests and validates event data on pushes and pull requests. Tests use synthetic fixtures solely under `tests/`; these never appear in the event feed.

## GitHub Pages

This site supports GitHub project subpaths. In this repository, select **Settings → Pages → Deploy from a branch → main → /(root)**. The `.nojekyll` file disables Jekyll. Committing a change updates Pages automatically. No custom domain or paid service is required.

Before sharing a new event, make sure the **Check site** run and GitHub’s **pages build and deployment** run succeed, then open its event permalink on the live site. Branch-based Pages may publish even if a separate check fails, so review checks when editing data; use a pull request if you want to inspect validation before merging.

## Editing the design

- `index.html`: club introduction, navigation, and honest empty states.
- `assets/styles.css`: responsive navy, amber, and warm-paper design.
- `assets/app.js`: accessible event rendering and actions.
- `assets/events.js`: validation, event grouping, time formatting, calendar export.
- `data/events.json`: the only file needed for routine event updates.
- `data/resources.json`: verified NotebookLM, Obsidian, and Drive links.
- `assets/resources.js` and `assets/resources-app.js`: resource validation and rendering.

There are no externally loaded fonts, image trackers, accounts, or forms. Illustrations are original decorative SVGs; no university logo or seal is used.

## Public content sources

- [Schulich Hippocratic Council club directory](https://uwomeds.com/clubs_directory/ai-in-medicine/): club identity, London and Windsor campuses, balanced exploration of AI across specialties. Older officer details are deliberately omitted.
- [@western.aimed on Instagram](https://www.instagram.com/western.aimed/): verified public club identity and updates.

No confirmed public upcoming or past event was available at launch, so the event data starts empty.
