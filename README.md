# VIDVIE UAE Official Website

A high-performance marketing and e-commerce discovery website for VIDVIE's official UAE distributor, Begad General Trading L.L.C. It includes the 92-product UAE catalog, searchable categories, an interactive shopping bag, seamless checkout handoff to Begad.ae, WhatsApp order enquiries, and a wholesale enquiry builder.

Retail orders, UAE delivery (Dubai Binjrash warehouse), customer service, and secure payments (Credit/Debit Card, Tabby, Apple Pay, Cash on Delivery) are powered directly through the Begad platform (`begad.ae`). Customers can add items to their shopping bag and transfer their entire cart directly into Begad's checkout in one click. Wholesale and B2B buyers can prepare an email to `Contact@begad.ae` or chat via WhatsApp.

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

Product names, category placement, suggested retail prices, and images were derived from the provided `VIDVIE_UAE_Full_Catalog (6).pdf`. The B2B wholesale unit prices and the source PDF are excluded from the public repository. The deployed site contains only public product data in `catalog.js` and optimized product images in `assets/catalog/`. The header and footer use [VIDVIE's official wordmark](https://www.vidvie.hk/Public/public/img/logos.png), stored locally in `assets/vidvie-official-logo.png`. The charcoal, white and orange palette and the “Spice Up People's Life” and “Creative · Exquisite · Affordable” messaging follow [VIDVIE's global site](https://www.vidvie.hk/).
