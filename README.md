# Ottawa Premium Detailing

Static site for a mobile car detailing business in Ottawa. Light, friendly design
with a self-contained online booking pipeline — no backend, no build step.

## Pages

- `index.html` — the homepage: hero with postal-code entry, how-it-works,
  services, package tiers, comparison tables, add-ons, recurring plan pitch,
  service area, FAQ and a contact form.
- `book.html` — the booking pipeline. Six steps: location → vehicle → services
  → add-ons → schedule → contact. A live summary sidebar tracks the estimated
  total as choices change.

## How booking works

1. Every "Book Online" / "See My Price" entry point funnels into `book.html`.
   Postal-code forms submit `?postal=…` (and stash the code in
   `sessionStorage`), so the flow starts pre-filled; a valid in-area code skips
   straight to the vehicle step.
2. The flow validates each step inline (status text sits next to the buttons,
   never below the fold) and keeps a running estimate. Sedan prices are exact;
   SUVs, trucks and vans show "from" pricing — the exact price is confirmed
   with the customer before any work starts.
3. Submitting sends the request through EmailJS, formatted as a plain-text
   summary, then shows a confirmation screen with a recap. Nothing is charged
   online; bookings are confirmed by phone or text. The EmailJS
   service/template IDs are duplicated in **both** `assets/js/main.js` (contact
   form) and `assets/js/booking.js` (booking flow) — change them together.

Deep links: `book.html?pre=interior:2,exterior:1&vehicle=SUV&recurring=1`
preselects options — the tier cards and comparison tables on the homepage use
these.

## Editing prices

Prices are hand-duplicated — when one changes, update **all six** places:

1. Tier cards in `index.html` (Packages section)
2. Comparison tables in `index.html` (Compare section)
3. Add-on list in `index.html` (Extras section)
4. Option rows in `book.html` — both the visible text and the `data-price`
   attributes, which drive the estimate and the emailed total
5. The JSON-LD `priceRange` in `index.html`'s head (`$70 - $650`)
6. The meta description in `index.html`'s head (`from $150`, `from $70`)

Add-on *names* must also match exactly between `index.html` and the `value=`
attributes in `book.html` — the `value` string is what gets emailed.

## Files

- `assets/css/main.css` — design tokens and all styles for both pages.
- `assets/css/noscript.css` — fallbacks; without JS the postal forms still
  navigate to `book.html`, which shows call/email instructions instead of the
  flow.
- `assets/js/main.js` — homepage: nav state, postal gate modal, scroll
  reveals, contact form (EmailJS).
- `assets/js/booking.js` — the booking pipeline.
- `images/` — logo and photos.

Serve locally with any static server, e.g. `python3 -m http.server 8080`.
