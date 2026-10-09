# VIDVIE UAE Official Website

A high-performance marketing and e-commerce discovery website for VIDVIE's official UAE distributor, Begad General Trading L.L.C. It includes the 92-product UAE catalog, searchable categories, an interactive shopping bag, seamless checkout handoff to Begad.ae, WhatsApp order enquiries, and a wholesale enquiry builder.

Retail orders, UAE delivery (Dubai Binjrash warehouse), customer service, and secure payments (Credit/Debit Card, Tabby, Apple Pay, Cash on Delivery) are powered directly through the Begad platform (`begad.ae`). Customers can add items to their shopping bag and transfer their entire cart directly into Begad's checkout in one click. Wholesale and B2B buyers can prepare an email to `Contact@begad.ae` or chat via WhatsApp.

## Development

Serve the directory with `python3 -m http.server 8000` and open `http://localhost:8000`. There is no build step or dependency install.

## Deployment

The live site is hosted in Begad's AWS account (279706066043): a private S3 bucket, `vidvie-site-279706066043` (us-east-1), behind CloudFront distribution `E1J25ISXSFTE16` (`d85jadl1m139k.cloudfront.net`). The bucket is not public; only that distribution can read it.

`.github/workflows/aws.yml` deploys on each push to `main`: it syncs the repository to the bucket (without `.git`, `.github`, `README.md`, `.gitignore`) and clears the CloudFront cache. It signs in with GitHub OIDC as the IAM role `vidvie-github-deploy`, which can only write to that bucket and invalidate that distribution. There are no stored AWS keys.

`vidvie.ae` is registered at AESERVER. Its DNS is the Route 53 hosted zone `Z02139873CGVQFOOKAUIY`, which also carries the domain's MXroute email records (MX, SPF, `x._domainkey`); do not remove them. The HTTPS certificate is in ACM (us-east-1) and renews itself as long as its two validation CNAMEs stay in the zone.

`.github/workflows/pages.yml` still publishes the GitHub Pages preview at `https://haresholmes.eu.org/vidvie-uae/`.

## Before retail launch

- Confirm customer-service hours, UAE address, and the approved public contact details.
- Refresh the SKU assortment, stock, and prices after the current price list expires.
- Add payment, fulfilment, returns, privacy, and terms flows before enabling checkout.
- Decide whether to keep email/WhatsApp enquiries or add a hosted form endpoint.

Product names, category placement, suggested retail prices, and images were derived from the provided `VIDVIE_UAE_Full_Catalog (6).pdf`. The B2B wholesale unit prices and the source PDF are excluded from the public repository. The deployed site contains only public product data in `catalog.js` and optimized product images in `assets/catalog/`. The header and footer use [VIDVIE's official wordmark](https://www.vidvie.hk/Public/public/img/logos.png), stored locally in `assets/vidvie-official-logo.png`. The charcoal, white and orange palette and the “Spice Up People's Life” and “Creative · Exquisite · Affordable” messaging follow [VIDVIE's global site](https://www.vidvie.hk/).
