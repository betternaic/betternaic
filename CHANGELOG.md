# Changelog

## 0.2.0 (2026-10-17)

Readability and accessibility pass (Laws of UX/UI, WCAG 2.2 AA).

- Large text mode ("AA" button): 21px text and wider line spacing, remembered
  per browser, reflows down to 320px phones.
- Body text 17px; neutral grays retuned so all text meets AA contrast; input
  borders at 3:1; two-tone focus ring visible on white and blue.
- Every control at least 44x44px; language and text size moved to the top bar
  on wide screens; phone search moved into the menu.
- Calmer, plainer design: no gradients, pill chips, uppercase labels, icon
  tiles or hover lifts; plain-language hero with a visible search label;
  services as an underlined link list.
- Requirement checklists in guides are real, tickable checkboxes.
- axe-core audit: 0 violations across 21 routes at desktop and phone widths,
  normal and large text.

## 0.1.0 (2026-10-16)

First release, live at https://betternaic.vercel.app.

- Started from the Local Government Website Starter Kit (CC0) and its setup tool;
  removed the unused Meilisearch search, Kapwa styles, Terraform and Husky setup.
- 35 service guides in 12 categories, checked against national laws and agency
  sites.
- Officials (2025–2028), offices, 30 barangays with census population,
  statistics, history, places to visit, emergency hotlines, transparency links.
- BetterNaic logo: default BetterLGU tile and sun, Naic silhouette, fish, waves
  and rice stalks from the municipal seal.
- Report form and moderator console backed by a Cloudflare Worker, D1,
  Turnstile and Workers rate limiting; announcements on the home page.
- English and Filipino interface, client-side search, sitemap, Open Graph
  image, strict security headers.
