# PackEPR — Technical Architecture & Shopify Remix Specification

## 1. Target Tech Stack for Full Production
* **Framework:** Shopify Remix App Template (`npx @shopify/create-app@latest`) or Next.js App Router.
* **UI Component Library:** Shopify Polaris (`@shopify/polaris`) matching our `index.html` design.
* **Database:** Prisma ORM with SQLite (local dev) and **Supabase PostgreSQL** (free tier for production).
* **Hosting:** **Vercel** or **Fly.io** / **Render** free tier.
* **Billing:** **Shopify Billing API** (`appSubscriptionCreate` mutation) for embedded app installs, or **Paddle / Lemon Squeezy** (Merchant of Record) for standalone web calculator users.

---

## 2. Required Shopify OAuth Scopes (`shopify.app.toml`)
```toml
[access_scopes]
scopes = "read_orders,read_products,write_products"
```
*Why minimal scopes matter:* Asking only for `read_orders` and product metafields builds instant merchant trust and passes Shopify App Store review on the first submission.

---

## 3. Germany ZSVR LUCID XML Structure (`src/lucid_exporter.ts`)
Germany's Central Agency Packaging Register (`Zentrale Stelle Verpackungsregister — ZSVR`) and dual-system operators require structured XML reporting with the following fraction codes:
* `PPK`: Papier, Pappe, Karton (Paper, paperboard, cardboard) — expressed in `kg` (`0.000`).
* `KUNSTSTOFFE`: Plastics (LDPE poly mailers, air pillows, packing tape) — expressed in `kg` (`0.000`).
* `GLAS_SONSTIGE`: Glass, ferrous metals, aluminum, and other protective packaging — expressed in `kg` (`0.000`).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Datenmeldung xmlns="https://lucid.verpackungsregister.org/schema/2026/VerpackDG">
  <Kopfdaten>
    <Registrierungsnummer>DE5294810394812</Registrierungsnummer>
    <Meldezeitraum>2026-Y</Meldezeitraum>
    <SystembetreiberCode>INTERSEROH</SystembetreiberCode>
    <ErstelltAm>2026-10-16</ErstelltAm>
    <Rechtsgrundlage>VerpackDG-PPWR-2026</Rechtsgrundlage>
  </Kopfdaten>
  <Verpackungsmengen SendungenGesamt="4">
    <MaterialFraktion>
      <FraktionCode>PPK</FraktionCode>
      <Bezeichnung>Papier, Pappe, Karton</Bezeichnung>
      <MasseKg>0.890</MasseKg>
    </MaterialFraktion>
    <MaterialFraktion>
      <FraktionCode>KUNSTSTOFFE</FraktionCode>
      <Bezeichnung>Kunststoffe (LDPE Versandtaschen, Klebeband)</Bezeichnung>
      <MasseKg>0.042</MasseKg>
    </MaterialFraktion>
  </Verpackungsmengen>
</Datenmeldung>
```

---

## 4. Pricing & Feature Gating Logic
* **Free Audit Tier ($0/mo):**
  * Syncs up to 200 EU orders or allows CSV upload.
  * Displays total cardboard (`PPK`) and plastic (`Kunststoffe`) weight in `kg` per EU country and highlights which national thresholds were triggered.
* **Starter Plan ($14/mo or $129/yr — 7-day free trial):**
  * Unlocks 1-click download of **Germany `ZSVR LUCID` XML** and **France `Citeo` CSV**.
  * Unlimited custom Box Presets.
* **EU PPWR Pro Plan ($39/mo):**
  * Unlocks all 27 EU member state reports (`CONAI` Italy, `ARA` Austria, `MITECO` Spain, `Verpact` NL).
  * Generates the **EU Regulation 2025/40 (PPWR) Article 10 & Substance (PFAS/Heavy Metals) Declaration of Conformity**.
