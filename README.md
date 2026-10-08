# Spind landing page

Static site for https://spind.io/. `index.html` is the final design (Spind Landing v4); `support.js` is the design-component runtime it needs.

## SEO files

| File | Purpose |
| --- | --- |
| `index.html` `<head>` | Title, description, canonical, Open Graph, X card, favicons, Organization + WebSite JSON-LD. All static, so crawlers and link-preview bots see it without running JavaScript. |
| `og-image.jpg` | 1200 × 630 social preview (LinkedIn, WhatsApp, X) |
| `favicon.ico`, `favicon-*.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest` | Browser, iOS and Android icons |
| `robots.txt`, `sitemap.xml` | Crawl rules and the list of public pages |

## Indexing rules

- Only `spind.io` is indexable. `vercel.json` sends `X-Robots-Tag: noindex, nofollow` on every other host (preview deployments and `*.vercel.app` URLs), and a script in `<head>` adds the same rule as a fallback.
- `www.spind.io` redirects permanently to `https://spind.io`.
- Only public, indexable pages go in `sitemap.xml`. Update `<lastmod>` when page content changes.
- When `/privacy` and `/terms` are published, give each its own `<title>`, meta description, canonical (`https://spind.io/privacy`, `https://spind.io/terms`) and OG tags, and add them to `sitemap.xml`.

## Deploying on Vercel

- Framework preset: **Other**. No build command; the output directory is the repo root.
- Add both `spind.io` and `www.spind.io` under Project → Domains; `vercel.json` handles the www redirect.
- `.vercelignore` keeps `README.md` and the Apps Script out of the deployment.
- Clean URLs are on, so a future `privacy.html` is served at `/privacy`.

## Waitlist

`google-sheet-waitlist.gs` is the Apps Script that receives waitlist submissions. Its deployment URL goes in the `sheetUrl` prop.
