# VIDVIE UAE Official Website

A high-performance marketing and e-commerce discovery website for VIDVIE's official UAE distributor, Begad General Trading L.L.C. It lists every VIDVIE product sold on Begad.ae, with searchable categories, an interactive shopping bag, seamless checkout handoff to Begad.ae, WhatsApp order enquiries, and a wholesale enquiry builder.

Retail orders, UAE delivery (Dubai Binjrash warehouse), customer service, and secure payments (Credit/Debit Card, Tabby, Apple Pay, Cash on Delivery) are powered directly through the Begad platform (`begad.ae`). Customers can add items to their shopping bag and transfer their entire cart directly into Begad's checkout in one click. Wholesale and B2B buyers can prepare an email to `Contact@begad.ae` or chat via WhatsApp.

## Products come from Begad

Nothing about a product is kept here. The page lists every published product of the **Vidvie** brand on Begad.ae, with Begad's name, photo, price (including VAT, and the deal price when one is running) and stock:

- On every visit `loadCatalog()` in `app.js` calls `GET https://begad.ae/api/agent/prices?brand=vidvie&details=1` (public, no key, cached on Begad's side for about a minute) and rebuilds the grid, the category tiles and the counts from the answer. Photos are Begad's own 400px thumbnails, loaded from begad.ae.
- `catalog.js` is a snapshot of the same answer, so the page has something to paint before the call returns and something to show if Begad cannot be reached. `.github/workflows/sync-catalog.yml` regenerates it every six hours with `node tools/sync-catalog.mjs`, commits it if it changed and starts the deploy.
- To add, remove, rename, re-photograph or re-price a product, do it on Begad. It shows here within about a minute. A VIDVIE product that is missing here is either not `Published` on Begad or does not have the Vidvie brand set.
- Begad's categories are folded into this site's groups by `CATEGORY_GROUPS` in `app.js`. A Begad category that is not in that table appears under "More"; add it to the right group there.
- Out-of-stock products stay listed, at the end, with the bag button disabled.
- The bag sends Begad product ids to `begad.ae/en/cart?add_items=<id>:<qty>,...`.

The endpoint lives in the Begad repository (`app/api-agent-prices.php`).

## Hero picture

The hero is seven product cut-outs in `assets/hero/`, positioned by the `.scene-*` rules in `styles.css`; clicking one searches the grid for that model. The cut-outs were made from Begad's full-size product photos (white studio background) with `tools/cutout.py <photo> <out.webp> [max side] [keep left fraction]` (needs `numpy`, `scipy`, `pillow`). It only works on products that are clearly darker than their background: white chargers and light metal lose parts of themselves. `tools/` is not uploaded to the site.

## Development

Serve the directory with `python3 -m http.server 8000` and open `http://localhost:8000`. There is no build step or dependency install.

## Deployment

The live site is hosted in Begad's AWS account (279706066043): a private S3 bucket, `vidvie-site-279706066043` (us-east-1), behind CloudFront distribution `E1J25ISXSFTE16` (`d85jadl1m139k.cloudfront.net`). The bucket is not public; only that distribution can read it.

`.github/workflows/aws.yml` deploys on each push to `main`: it syncs the repository to the bucket (without `.git`, `.github`, `README.md`, `.gitignore`) and clears the CloudFront cache. It signs in with GitHub OIDC as the IAM role `vidvie-github-deploy`, which can only write to that bucket and invalidate that distribution. There are no stored AWS keys.

`vidvie.ae` is registered at AESERVER. Its DNS is the Route 53 hosted zone `Z02139873CGVQFOOKAUIY`, which also carries the domain's MXroute email records (MX, SPF, `x._domainkey`); do not remove them. The HTTPS certificate is in ACM (us-east-1) and renews itself as long as its two validation CNAMEs stay in the zone.

`.github/workflows/pages.yml` still publishes the GitHub Pages preview at `https://haresholmes.eu.org/vidvie-uae/`.

## Before retail launch

- Confirm customer-service hours, UAE address, and the approved public contact details.
- Add payment, fulfilment, returns, privacy, and terms flows before enabling checkout.
- Decide whether to keep email/WhatsApp enquiries or add a hosted form endpoint.

The header and footer use [VIDVIE's official wordmark](https://www.vidvie.hk/Public/public/img/logos.png), stored locally in `assets/vidvie-official-logo.png`. The charcoal, white and orange palette and the “Spice Up People's Life” and “Creative · Exquisite · Affordable” messaging follow [VIDVIE's global site](https://www.vidvie.hk/).
