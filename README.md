# AI in Medicine · Western

**Live site:** https://ashishsara.github.io/ai-in-medicine/

A small, accessible resource and events site for the student-led AI in Medicine club at Western, serving London and Windsor. Plain HTML, CSS, and JavaScript; no framework, package installation, database, analytics, or API key.

## Updating resources

Edit **`data/resources.json`** to add a verified study resource whose link is authorized for this public site. Only categories with links appear. Keep private notes and source contents out of this public file; the website does not change Google sharing permissions or copy course materials.

| Field | Value |
| --- | --- |
| `id` | Unique lowercase slug with hyphens. |
| `kind` | `website`, `notebooklm`, `obsidian`, or `drive`. |
| `title` | Clear notebook, file, folder, or course-block title. |
| `description` | Short plain-text explanation of what the resource contains. |
| `url` | Verified HTTPS destination, without embedded credentials or private access tokens. |
| `access` | `public` for an openly available resource; `google-sign-in` when a Google account is required; `drive-permissions` for a Drive folder whose owner controls access to individual files. |
| `embed` | Optional boolean for a public `website` resource. Set to `true` only after verifying that the site permits framing and its preview works. Omit or set to `false` for a direct link without a preview. |
| `collections` | Optional array for a `drive` folder. Each entry has `id`, `title`, `description`, and a verified Google Drive folder `url`. IDs must be unique; `all` is reserved for the root folder. An empty array still enables the root folder browser. |

Before adding a link, verify that publishing the link is authorized and that its access label is accurate. A URL visible in your signed-in account alone is not evidence of anonymous access. Do not upload Obsidian vaults, course files, or Drive contents to this public repository unless their contents and public distribution have been reviewed and explicitly authorized.

The Preclerkship Drive browser displays Google's `embeddedfolderview` for the selected folder. The **All resources**, **Year 1**, **Year 2**, and **Clinical Skills** shortcuts were verified against the approved folder. These shortcut names and destinations are a manually maintained index, not an automatically synchronized folder tree. Each embedded folder listing is fetched from Google when loaded; file and subfolder links open Google Drive. The site does not mirror files, authenticate visitors, or maintain a cached file inventory.

The **Open in Drive** link always points to the selected folder and remains available if embedding is blocked or a visitor needs to sign in. Individual file access remains controlled by the owner. Google content is cross-origin, so the site does not pretend to detect whether every visitor has access or whether an embedded listing loaded successfully. All three destinations are also linked with JavaScript disabled.

**Study Website** uses the same section heading and white layout as **Pre-Clerkship Drive**. Its compact, scrollable preview loads the original website in a titled, lazy-loaded iframe. **Explore the website** opens the full site in a new tab and remains available if the external preview cannot load. Website content is not copied into this repository, and the preview follows the source site's own theme and updates. The sandbox allows normal study-page scripts, forms, downloads, and user-opened links while blocking navigation of the club page by the embedded site.

**Focus Sounds** uses that same website preview template for [Still](https://ashishsara.github.io/still/), a configurable background sound player with soundscapes, mix controls and session timers. Its public player was verified live before adding it. Audio starts only after a visitor presses play; the club page does not trigger playback or make claims about cognitive or medical effects. The Still project is maintained separately.

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
- `assets/styles.css`: responsive purple, lavender, orchid, and white design.
- `assets/club-logo.png`: user-supplied club logo, preserved as provided.
- `assets/app.js`: accessible event rendering and actions.
- `assets/events.js`: validation, event grouping, time formatting, calendar export.
- `data/events.json`: the only file needed for routine event updates.
- `data/resources.json`: verified study websites, NotebookLM, Obsidian, and Drive links, plus curated Drive category shortcuts.
- `assets/resources.js` and `assets/resources-app.js`: resource validation and rendering.

There are no externally loaded fonts, site analytics, site accounts, or forms. The folder browser loads content directly from Google Drive, subject to Google's behavior and the visitor's browser settings. The header uses the user-supplied club logo; no university seal is used. The homepage opens directly with resources. Orchid and white are the accent colors.

Asset URLs use a `?v=` release number to refresh browser caches. When changing CSS or JavaScript, increment the affected version in `index.html` and any changed module import URL. Routine event and resource data edits need no version change; JSON is revalidated on page load.

## Public content sources

- [Schulich Hippocratic Council club directory](https://uwomeds.com/clubs_directory/ai-in-medicine/): club identity, London and Windsor campuses, balanced exploration of AI across specialties. Older officer details are deliberately omitted.
- [@western.aimed on Instagram](https://www.instagram.com/western.aimed/): verified public club identity and updates.
- [Schulich Pre-clerkship](https://schulichmed.github.io/preclerkship/): verified title and course-block notes/practice-question portal.
- [Preclerkship Drive](https://drive.google.com/drive/folders/1Dn4awPOxOo0gqo8yoCTwYPSEZkyJxXqh?usp=sharing): user-approved folder display and verified Year 1, Year 2, and Clinical Skills shortcuts. Files remain in Drive.

No confirmed public upcoming or past event was available at launch, so the event data starts empty.
