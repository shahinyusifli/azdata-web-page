# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static marketing site for AZ Data ("Data from A to Z"), a real-time context-layer product for Snowflake: schema docs published as Markdown/OKF/graph to Git, plus an MCP server for AI agents. The information architecture and visual language are modelled on data.world's marketing site (announcement bar, dropdown nav, centered hero with product mockup, three-column capability cards, dark stat band, "built differently" split row, integrations strip, use-case grid, gradient CTA band, five-column footer with legal links, floating "talk to us" pill). No build system, package manager, or framework — plain HTML pages share one stylesheet and one script. Domain is `azdata.app` (see [CNAME](CNAME)); `sitemap.xml`, `robots.txt`, and JSON-LD use that real URL.

Pages:
- [index.html](index.html) — Home
- [product.html](product.html) — Product overview (architecture diagram + three components)
- [product-tracking.html](product-tracking.html), [product-publishing.html](product-publishing.html), [product-agents.html](product-agents.html) — one page per capability (Track / Publish / Serve)
- [solutions.html](solutions.html) — six use cases as alternating split rows, anchored (`#agents`, `#alerts`, `#audit`, `#onboarding`, `#migration`, `#pipelines`)
- [pricing.html](pricing.html) — 3 tiers + FAQ accordion
- [blog.html](blog.html) + [blog/](blog/) — listing plus one file per post (relative paths `../`)
- [careers.html](careers.html), [careers-openings.html](careers-openings.html) — culture; roles with requirements, salary, hiring process, benefits
- [about.html](about.html), [demo.html](demo.html), [legal.html](legal.html) (noindex placeholder — see below)
- [assets/css/style.css](assets/css/style.css), [assets/js/main.js](assets/js/main.js) — shared by every page
- [robots.txt](robots.txt), [sitemap.xml](sitemap.xml), [llms.txt](llms.txt)

## Working with this repo

- No build/lint/test — edit files directly and preview with `python3 -m http.server`. Plain links, so `file://` works too.
- Deployment is GitHub Pages via `CNAME`.
- Fonts: Google Fonts `Inter`. No JS libraries.
- **Forms have a real backend**: [worker/](worker/) is a Cloudflare Worker (`worker/src/index.js`, config in `worker/wrangler.toml`, setup in `worker/README.md`) that receives every form (`demo`, `application`, `cv`, `referral`) and emails it via Resend. The recipient address lives only in the Worker secret `TO_EMAIL` — it must never appear in HTML/JS. The frontend posts `FormData` to `API_BASE` (top of `main.js`, currently the deployed `https://azdata-forms.azdata-forms.workers.dev`); any `<form data-form="…">` with a `.form-note` and a hidden honeypot `<input name="website" class="hp">` is handled automatically. Deploy changes to the Worker with `cd worker && npx wrangler deploy` (Node was installed via Homebrew for this). Secrets `TO_EMAIL` and `RESEND_API_KEY` are both set and delivery is verified; see `worker/README.md` for how to rotate the key. Never write either value into the repo or chat.
- **Header and footer are duplicated in every page** (no templating). Don't hand-edit them per file: the canonical markup lives in the injection script pattern used to build the site — the simplest safe way to change nav/footer is a small Python script that regex-replaces `<header class="nav">…</header>` and `<footer class="site-footer">…</footer>` in every `*.html` and `blog/*.html`, using a `../` prefix for `blog/`. The announcement bar (`.announce`) sits just above `<header>` and the floating `.float-cta` just after `</footer>`.

## Design system (style.css)

- Tokens in `:root`: `--blue` (primary), `--cyan`, `--violet`, `--bg-navy` (dark band), `--grad` / `--grad-band` gradients, `--bg-soft` alternating section bg, `--shadow-soft` / `--shadow-glow`.
- Section rhythm: `section` (80px), `.section-soft` (light gray band), `.section-dark` (navy band), `.section-tight`.
- Components: `.hero` (Home only, with `.mockup` product UI built in HTML/CSS), `.page-hero` (inner pages), `.cap-grid`/`.cap-card` (capability cards with `.cap-art` inline-SVG illustrations using `.art-*` classes), `.stat-grid`/`.stat`, `.split` (+ `.reverse`) text/art rows with `.split-art`, `.integrations`/`.integration`, `.usecase-grid`/`.usecase`, `.cta-band`, plus the older `.grid`/`.feature-card`, `.pricing-grid`/`.price-card.featured`, `.faq`, `.blog-*`, `.role-*`, `.demo-*`, `.story-panel`, `.office-card`.
- Motion: `[data-reveal]` fade-in via IntersectionObserver; direct children of grids/lists inside a `[data-reveal]` stagger via `nth-child` delays; `.diagram-edge`/`.art-line` dash animation; hero cursor spotlight via `--mx/--my`. Everything is disabled under `prefers-reduced-motion`.

## Behavior (main.js)

Announcement dismiss (localStorage, try/catch-wrapped), dropdown nav (`.nav-item` hover on desktop, click on ≤900px, Escape/outside-click closes), mobile hamburger, active-link highlighting (also marks the parent dropdown button), scroll progress bar + `.is-scrolled` header state, hero spotlight, FAQ accordion (one open at a time), generic `form[data-form]` submit handler (client-side required/email/5 MB checks → `fetch` to the Worker → inline success/error), and `a[data-role]` links that preselect the role in the application form on careers-openings.html.

## Content that needs attention before publishing

- **Home "built for teams operating at this scale" strip**: fictional placeholder companies (Northwind Bank, Acme Payments, Vertex Cloud, Meridian Group) with generic icons. The original plan named Bolt/Wise/Pipedrive/Playtech as illustrative-only; real company names/logos in a logo strip read as a customer claim, so they are not used. Swap in real logos only with each customer's permission.
- **Announcement bar copy** is a sample — replace with real news or remove the `.announce` block.
- **legal.html** is a structural placeholder with `noindex`; counsel must write the actual policy text, then remove the noindex meta.
- **Pricing FAQ answers, hiring process, benefits, salary ranges** are drafts — confirm before publishing. Starter/Team buttons route to the demo page because no self-serve checkout exists yet.
- **Integrations strip** lists Snowflake, GitHub, Bitbucket, MCP, Claude/Claude Code, Cursor — verify each is genuinely supported before launch.
- **Customer quote placeholder** on demo.html — add a real one once available.
