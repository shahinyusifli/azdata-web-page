# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static marketing site for AZ Data, a data engineering consultancy. There is no build system, no package manager, and no framework — three plain HTML pages share one stylesheet and one script.

- [index.html](index.html) — Home (hero, services, AI/Claude offering, case studies, testimonials, stack)
- [about.html](about.html) — About (company story, approach principles, founder bio)
- [contact.html](contact.html) — Contact (contact details + a client-side-only inquiry form)
- [assets/css/style.css](assets/css/style.css) — all styling, shared across the three pages
- [assets/js/main.js](assets/js/main.js) — all behavior, shared across the three pages
- [assets/img/founder.jpg](assets/img/founder.jpg) — founder headshot used on the About page
- [CNAME](CNAME) — GitHub Pages custom domain config (`azdata.app`)

## Working with this repo

- There is no build, lint, or test command — edit the HTML/CSS/JS directly and open the pages in a browser (or use a local static server, e.g. `python3 -m http.server`) to preview changes. Opening via `file://` works fine since navigation is plain links, not `fetch`.
- Deployment is GitHub Pages, driven by the `CNAME` file and whatever branch/directory is configured in the repo's Pages settings — there is no CI pipeline in this repo.
- Fonts are loaded from Google Fonts (`IBM Plex Mono`, `IBM Plex Sans`) via `<link>` tags; there are no other external dependencies (no JS libraries, no CSS frameworks, no backend for the contact form — it builds a `mailto:` link client-side).
- The three pages duplicate the same `<header class="nav">` / `<footer>` markup rather than sharing an include, since there's no templating layer — when changing nav/footer structure, update it in all three files.

## Structure

Each page is organized as sequential `<section>` elements inside `<main>`, each with an anchor id (e.g. `#services`, `#ai`, `#work`, `#testimonials`, `#stack` on Home; `#approach`, `#founder` on About). When editing content, find the relevant section by its id rather than searching by content.

Styling conventions in [style.css](assets/css/style.css):
- CSS custom properties are defined once in `:root` (colors: `--bg`, `--text`, `--amber`, `--cyan`, etc.) — reuse these variables rather than hardcoding new colors.
- `.mono` / `IBM Plex Mono` is used for headings, labels, and technical text; `IBM Plex Sans` is the body font.
- Repeated layout patterns (`.grid` + `.card`, `.case-grid` + `.case-card`, `.principle` rows, `.chip` list, `.stats` + `.stat`) are reused across sections — follow the existing pattern when adding a new card or row rather than introducing a new structure.
- The hero's schema-diagram graphic is hand-authored inline SVG (`.blueprint`), styled via the `.schema-*` classes and animated with CSS `@keyframes` (respecting `prefers-reduced-motion`).

Behavior in [main.js](assets/js/main.js), all vanilla JS with no dependencies:
- **Page transitions**: any link with `data-transition` triggers a short slide/fade-out (`.is-leaving` class) before navigating, and every page fades/slides in on load (`main`'s `page-in` animation) — this is real page navigation, not an SPA/fetch swap, so it works over `file://` too.
- **Scroll reveal**: elements with `data-reveal` fade/slide into view via `IntersectionObserver`.
- **Testimonial slider**: any `.testimonials` block with 2+ `.testimonial-slide` children gets auto-generated dots, prev/next buttons, and autoplay (pauses on hover); add a new slide by copying the `.testimonial-slide` markup, no JS changes needed.
- **Mobile nav**: `.nav-toggle` button slides `.nav-links` open/closed below 720px.
- **Contact form**: `#contact-form` validates required fields client-side and redirects to a pre-filled `mailto:` link — there is no backend, so this only works if the visitor has a mail client configured.

All motion respects `prefers-reduced-motion`.

## Content that needs personalizing before publishing

Several sections currently hold placeholder content (each flagged with an HTML comment in the source) — replace before this goes live:
- **Case studies** ([index.html](index.html) `#work`) and **testimonials** (`#testimonials`) are illustrative examples, not real client engagements or quotes.
- **Founder bio** ([about.html](about.html) `#founder`) has draft copy — personalize before publishing. The photo itself is real ([assets/img/founder.jpg](assets/img/founder.jpg)).
