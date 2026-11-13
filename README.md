# VIDVIE UAE (vidvie.ae)

The official VIDVIE store for the UAE, run by Begad General Trading L.L.C. It is laid out like a marketplace: departments and categories, a search box, filters, product pages and a bag. Checkout is Begad's: the bag hands its products to `begad.ae/en/cart?add_items=<id>:<qty>,...&checkout=1`, and the customer pays and is delivered by Begad as on begad.ae.

## Products come from Begad

Nothing about a product is kept by hand here. The site lists every published product of the **Vidvie** brand on begad.ae, with Begad's name, photos, description, price (including VAT and any running deal) and stock.

- `GET https://begad.ae/api/agent/prices?brand=vidvie&details=1` (public, cached on Begad for about a minute) is the product list. The build reads it, and every page reads it again in the browser so prices and stock are current.
- `GET https://begad.ae/api/agent/products/<id>` gives each product's description, photos, warranty and returns line. The build keeps them in `data/details.json`, fetching new products at once and refreshing 40 older ones per run (every product about every 1.5 days).
- `catalog.js` is a snapshot of the list: the first paint, and the fallback when Begad cannot be reached during a build.
- To add, remove, rename, re-photograph or re-price a product, do it on Begad. Prices and stock show here within about a minute; a new product gets its own page with the next build (every 6 hours). Until then its card links to Begad.
- A VIDVIE product that is missing is either not `Published` on Begad or does not have the Vidvie brand.
- Begad's categories are grouped into departments by `DEPARTMENTS` in `site.js`. A Begad category not listed there appears under the department "More"; add it to the right place.

The endpoints live in the Begad repository (`app/api-agent-prices.php`, `app/api-agent-catalog.php`).

## How the site is built

There is no framework. `site.js` draws every page as HTML text; it is used both by `tools/build.mjs` (Node, at build time) and by `app.js` (in the browser).

`node tools/build.mjs` writes `dist/`:

| URL | Page |
| --- | --- |
| `/` | home: categories, deals, a row per department, new arrivals |
| `/products/`, `/deals/`, `/search/?q=` | listings |
| `/c/<department>/`, `/c/<department>/<category>/` | department and category listings |
| `/p/<Begad product slug>/` | product page |
| `/wholesale/` | wholesale enquiry |
| `/404.html`, `/sitemap.xml`, `/robots.txt` | |

Each page is a copy of `template.html` with its own title, description, canonical address, structured data (schema.org Product, BreadcrumbList, Organization) and pre-drawn content, so search engines see the full page without running JavaScript. Filters, sort and "show more" are query parameters (`?sale=1&min=50&sort=price-asc`) handled in the browser.

`node tools/build.mjs --offline` builds from `catalog.js` and `data/details.json` without calling Begad.

## Hero picture

The product cut-outs in `assets/hero/` were made from Begad's full-size product photos (white background) with `tools/cutout.py <photo> <out.webp> [max side] [keep left fraction]` (needs `numpy`, `scipy`, `pillow`). It only works on products clearly darker than their background.

## Development

```
node tools/build.mjs --offline
python3 -m http.server 8000 -d dist
```

## Deployment

The live site is in Begad's AWS account (279706066043): private S3 bucket `vidvie-site-279706066043` (us-east-1) behind CloudFront distribution `E1J25ISXSFTE16` (`d85jadl1m139k.cloudfront.net`). Only that distribution can read the bucket.

- `.github/workflows/aws.yml` deploys on each push to `main`: it builds `dist/`, syncs it to the bucket and clears the CloudFront cache. It signs in with GitHub OIDC as IAM role `vidvie-github-deploy`, which can only write that bucket and invalidate that distribution.
- `.github/workflows/sync-catalog.yml` runs every 6 hours: it rebuilds, commits `catalog.js` and `data/details.json` when they changed, and starts the deploy.
- **CloudFront Function `vidvie-pages`** (viewer request, default behaviour; source in `deploy/cloudfront-function.js`) serves `/c/audio/` from `c/audio/index.html`, adds the missing slash to `/c/audio`, and sends `www.vidvie.ae` to `vidvie.ae` with a 301. S3 has no directory index of its own, so without this function every page except the home page answers 403. To change it: `aws cloudfront update-function --name vidvie-pages --if-match <ETag> --function-config Comment=...,Runtime=cloudfront-js-2.0 --function-code fileb://deploy/cloudfront-function.js`, then `aws cloudfront publish-function`.
- **Custom error responses** on the distribution (added 2026-11-13): 403 and 404 from S3 answer `/404.html` with status 404 (a missing key in a private bucket is a 403).
- The GitHub Pages preview (`haresholmes.eu.org/vidvie-uae/`) was switched off on 2026-11-13: the site now uses root-relative links, and a second copy would compete with vidvie.ae in Google.

`vidvie.ae` is registered at AESERVER. Its DNS is the Route 53 hosted zone `Z02139873CGVQFOOKAUIY`, which also carries the domain's email records (MX, SPF, DKIM, DMARC, autoconfig); do not remove them. The HTTPS certificate is in ACM (us-east-1) and renews itself while its two validation CNAMEs stay in the zone.

## Google Search Console

Not added yet (2026-11-13): it needs the owner's Google account. Add a **Domain** property `vidvie.ae`, put the `google-site-verification=...` value Google shows into the root TXT record of the Route 53 zone (next to the existing SPF value, not instead of it), verify, then submit `https://vidvie.ae/sitemap.xml`. Every page already has a canonical address on `https://vidvie.ae`, structured data, and is listed in the sitemap; `/search/` is excluded by robots.txt.

The company's Google service account (Merchant Center sync) cannot do this: the Site Verification API is not enabled in its project, and a property it owned would not appear in a person's Search Console.

The logo is [VIDVIE's official wordmark](https://www.vidvie.hk/), stored in `assets/vidvie-official-logo.png`; `assets/vidvie-icon.png` (favicon) and `assets/og-image.jpg` (link previews) were made from it.
