# Ottawa Premium Detailing

Single-page site for Ottawa Premium Detailing. Plain HTML, CSS and JavaScript —
no build step, no dependencies to install. Open `index.html` in a browser, or
serve the folder (`python3 -m http.server`) and visit <http://localhost:8000>.

## Layout

```
index.html            markup + the inline SVG icon sprite
assets/css/main.css   all styling (sections are numbered in the header comment)
assets/css/noscript.css  shows the banner when JavaScript is disabled
assets/js/main.js     intro animation, header show/hide, contact form
assets/css/images/    arrow.svg (the "Learn More" chevron)
images/               photos (webp) and the logo
```

## Editing notes

**Text and sections** live in `index.html`. Each section has an id — `#banner`,
`#services`, `#packages`, `#cta` — matching the numbered blocks in `main.css`.

**Colours** are CSS custom properties at the top of `main.css` (`:root`), so the
red, the section backgrounds and the focus colour are each defined once.

**Icons** are inline SVG. Every icon is defined once as a `<symbol>` in the
sprite at the top of `<body>` and used as
`<svg class="icon" viewBox="0 0 W 512"><use href="#i-name"></use></svg>`.
To add one, grab the SVG from <https://fontawesome.com/icons> (free set), paste
its `<path>` into a new `<symbol>`, and copy its `viewBox` onto the `<use>`.

**Contact form** posts through [EmailJS](https://www.emailjs.com). The service,
template and public key are at the top of `assets/js/main.js`; the field names
in the form (`name`, `email`, `tel`, `message`) must match the EmailJS template.

**Background photo**: `images/banner.webp` is fixed behind the page on desktop
and applied to the banner directly on phones/tablets (see section 13 of
`main.css`). `images/banner1.webp` sits behind the booking section on phones.

The layout is adapted from [Spectral](https://html5up.net/spectral) by HTML5 UP,
CCA 3.0 — see `LICENSE.txt`.
