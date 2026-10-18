# PackEPR — Shopify EU Packaging Weight & LUCID XML Exporter

> **Project Status:** Working Shopify Polaris Light-Mode MVP + Backend Starters  
> **Target Market:** European & Global Shopify Merchants shipping to Germany (`LUCID`), France (`Citeo`), Austria (`ARA`), Italy (`CONAI`), Spain (`MITECO`), and the Netherlands (`Verpact`).  
> **Regulatory Catalyst:** EU Packaging and Packaging Waste Regulation (`PPWR` — Regulation (EU) 2025/40) & Germany's `VerpackDG` (effective August 12, 2026).

## 1. Repository Structure & Context Memory Files

When you open this folder in **Antigravity**, the AI agent can read these Markdown files for full project context and memory:

* **`README.md` / `ANTIGRAVITY_README.md`** — Main entry point, project structure, and quickstart commands.
* **`CONTEXT_MEMORY.md` & `AGENTS.md`** — Persistent AI agent rules, founder constraints, strict **Shopify Polaris Light-Mode UI rules** (no AI dark-mode neon clichés), and EU packaging law math.
* **`ARCHITECTURE_AND_SHOPIFY_SPEC.md`** — Step-by-step backend engineering spec (Shopify OAuth scopes, Prisma DB models, GraphQL Order Sync, Germany `ZSVR LUCID` XML schema, France `Citeo` CSV schema, and Shopify Billing API tiers).
* **`GO_TO_MARKET_AND_OUTREACH.md`** — Zero-budget India-to-Europe distribution playbook, Shopify App Store ASO keywords, German `Impressum` Google search dorks, and copy-paste cold outreach emails to get your first 10 reviews.
* **`STARTUP_VAULT_MEMORY.md`** — Complete archive of all **12 stress-tested startup ideas** (Global, India, Europe, and the Jaipur-to-Europe Export Corridor) researched from Y Combinator Fall 2026 RFS, a16z Big Ideas 2026, Product Hunt, GitHub, and Reddit.
* **`index.html` / `packepr_app.html`** — Working standalone **Shopify Polaris Light-Mode Web App** (CSV upload, box tare-weight presets, live EU country threshold calculator, Chart.js analytics, and 1-click `.XML` / `.CSV` / `.TXT` downloads).
* **`prisma/schema.prisma`** — Prisma database models (`MerchantConfig`, `BoxPreset`, `OrderPackagingLog`).
* **`src/lucid_exporter.ts`** — TypeScript module that generates official Germany `LUCID` XML and France `Citeo` CSV reports.
* **`src/shopify_orders_sync.ts`** — Shopify Admin GraphQL query for pulling fulfilled EU orders.

## 2. Two Ways to Launch This Project

### Path A: Instant Free Lead-Magnet Calculator (Deploy in 2 Minutes for ₹0)
1. Deploy `index.html` directly to **Vercel**, **Netlify**, or **Cloudflare Pages** as a static site.
2. Send the live URL to German and French Shopify store owners found via the `Impressum` Google search dork in `GO_TO_MARKET_AND_OUTREACH.md`.
3. Merchants can drag-and-drop their Shopify `orders_export.csv` file in the browser, see their exact cardboard (`PPK`) and plastic (`Kunststoffe`) kilogram totals, and download their `LUCID` XML report.
4. To charge standalone web users in Euros (€) from India without registering for EU VAT in 27 countries, wrap the download button with a **Paddle** or **Lemon Squeezy** checkout link (they act as your Merchant of Record and handle all EU VAT automatically).

### Path B: Full Embedded Shopify App Store Plugin (Build in Antigravity)
1. Open this folder in **Antigravity**.
2. In the Antigravity chat prompt, run:
   > "Read CONTEXT_MEMORY.md and ARCHITECTURE_AND_SHOPIFY_SPEC.md. Initialize a Shopify Remix app around prisma/schema.prisma, src/lucid_exporter.ts, and src/shopify_orders_sync.ts, preserving the clean Shopify Polaris light-mode UI from index.html."
3. Connect a free **Shopify Partner** developer account (`partners.shopify.com`), test on a free development store, and submit to the Shopify App Store.
