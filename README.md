# VIDVIE UAE website preview

A static marketing and product discovery site for VIDVIE's official UAE distributor, Begad General Trading L.L.C. It includes the 92-product UAE catalog, searchable categories, a saved product shortlist, WhatsApp order enquiries, and an email-based wholesale enquiry builder.

The site is intentionally a **preview**. Suggested retail prices from the catalog issued 1 September 2026 are shown through 1 October 2026, then automatically change to “Price on enquiry.” These are indicative prices excluding 5% VAT, not a live checkout price. Customers can enquire or request an order through WhatsApp; wholesale buyers can prepare an email to `Contact@begad.ae`. The site does not process payment or store lead data.

## Development

Serve the directory with `python3 -m http.server 8000` and open `http://localhost:8000`. There is no build step or dependency install.

## Deployment

The GitHub Actions workflow in `.github/workflows/pages.yml` deploys the repository to GitHub Pages on each push to `main`. GitHub Pages must be set to **GitHub Actions** as its source.

When `vidvie.ae` is purchased, configure its DNS with GitHub Pages and add the custom domain in repository Pages settings. Keep the preview URL until the official domain is ready.

## Before retail launch

- Confirm customer-service hours, UAE address, and the approved public contact details.
- Refresh the SKU assortment, stock, and prices after the current price list expires.
- Add payment, fulfilment, returns, privacy, and terms flows before enabling checkout.
- Decide whether to keep email/WhatsApp enquiries or add a hosted form endpoint.

Product names, category placement, suggested retail prices, and images were derived from the provided `VIDVIE_UAE_Full_Catalog (6).pdf`. The B2B wholesale unit prices and the source PDF are excluded from the public repository. The deployed site contains only public product data in `catalog.js` and optimized product images in `assets/catalog/`. The header and footer use [VIDVIE's official wordmark](https://www.vidvie.hk/Public/public/img/logos.png), stored locally in `assets/vidvie-official-logo.png`. Brand background was checked against [VIDVIE's global site](https://www.vidvie.hk/about/index.html).
