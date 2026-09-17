# Card Locker

A digital portfolio for tradable cards — football, baseball, Pokémon, anything you slab.
Built as a mobile-first, single-page app in plain HTML, CSS and JavaScript: no build step,
no dependencies, no server. Open `index.html` and it runs.

## What it does

- **Tap to flip.** Every card shows its photo on the front; tapping flips it over to the
  price, a **Buy now** button that opens the listing, and the **PSA rating** underneath it.
- **Sorting.** Date added (newest / oldest), price (low→high / high→low) and alphabetical
  (A→Z / Z→A). Your choice is remembered between visits.
- **Search.** Filter by player, team, set or year as you type.
- **Add your own cards.** Pick a photo from your camera roll, fill in name, set, year,
  price, PSA grade and buy link. Photos are downscaled on-device and stored in
  `localStorage`, so your additions survive a reload and never leave the phone.
- **Portfolio summary.** Card count, book value and average PSA grade across the locker.
- Mobile-first throughout: 44px tap targets, safe-area padding for notched phones, sticky
  toolbar, lazy-loaded art, and a reduced-motion fallback for the flip animation.

## Demo contents

The locker ships with 20 mock football cards. Their artwork is generated as SVG
(`tools/generate-card-art.mjs`), so nothing is hotlinked and the whole portfolio works
offline. Set names, parallels, prices, cert numbers and grades are realistic placeholders
for a modern graded-football collection, not live market data. Cards without their own
buy link fall back to an eBay search for that player, set and grade.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Page shell: app bar, summary, toolbar, grid, add-card sheet |
| `styles.css` | All styling, including the 3D flip and the responsive grid |
| `app.js` | Rendering, sorting, search, flipping, add/remove, localStorage |
| `cards.js` | The 20 demo cards |
| `assets/cards/*.svg` | Generated card artwork |
| `tools/generate-card-art.mjs` | Regenerates that artwork (`node tools/generate-card-art.mjs`) |

## Running it

Open `index.html` directly, or serve the folder for a phone on the same network:

```sh
python3 -m http.server 8000
```

Then browse to `http://<your-computer-ip>:8000` on the phone.

## Notes

Added cards live in `localStorage` under `cardlocker:cards:v1` on that one browser —
clearing site data clears the locker. The demo 20 are always present and cannot be removed.
