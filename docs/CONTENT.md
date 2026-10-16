# Editing content

Most content is YAML or Markdown. Edit the file, run `npm run build` to check,
then deploy (or push to `main`). Always cite a public source for facts.

| What | File |
| --- | --- |
| Service categories (home page grid) | `src/data/services.yaml` |
| Guides in a category | `content/services/<category>/index.yaml` + one `<slug>.md` per guide |
| Officials, barangays, population, history | `src/data/naic.yaml` |
| Offices and what they handle | `src/data/offices.yaml` |
| Hotlines, facilities, preparedness tips | `src/data/hotlines.yaml` |
| Places to visit, photos, getting there | `src/data/places.yaml` |
| About, privacy, terms, accessibility | `content/pages/*.md` |
| Filipino interface text | `src/locales/fil.json` (English text lives inline in the components) |
| Announcements | Sign in at `/admin`; no deploy needed |

## Writing a guide

- First line `# Title`, then a one or two sentence summary in plain text (it is
  used as the page description).
- Keep the "Confirm before you go" blockquote.
- Use the headings the other guides use: Who can apply, Requirements (as a
  `- [ ]` checklist), Steps, Where to go, Fees, Related.
- National requirements only, from the law or the agency's own site. Anything
  local (fees, schedules, office floors, phone numbers, names) needs a source from
  the municipality itself, otherwise write "ask the office".
- Link other guides as `/services/<category>/<slug>`.
- Add the page to its category's `index.yaml`. New categories are picked up
  automatically once they are in `services.yaml` and have an `index.yaml`.

## Adding a barangay or changing one

`src/data/naic.yaml` and the list in `worker/src/lib.ts` must match (the report
form validates barangays). `cd worker && npm test` fails if they drift.

## Photos

Use Wikimedia Commons or your own photos. Resize to about 1200 px wide, save as
WebP under `public/images/naic/`, and keep the credit (author, license, file
page URL) next to the photo in `places.yaml`.

## Logo

Source and pipeline are in `brand/`. `python brand/build.py` regenerates the SVG
favicon and every PNG size from `brand/logo-source.png`.
