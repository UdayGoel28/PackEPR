# CONTEXT_MEMORY.md — Persistent Memory & Rules for Antigravity Agent

> **IMPORTANT FOR AI CODING AGENTS (ANTIGRAVITY / CURSOR / WINDSURF):**  
> Read this file before modifying any UI, database schema, or export logic in this workspace.

## 1. Founder Profile & Bootstrap Strategy
* **Founder:** 2nd-year engineering student based in Jaipur (Dahmi Kalan), Rajasthan, India.
* **Goal:** Bootstrapped Monthly Recurring Revenue (MRR) in Euros (€) / Dollars ($) with ₹0 upfront capital.
* **Why PackEPR Was Selected:**
  * On **August 12, 2026**, the EU Packaging and Packaging Waste Regulation (`PPWR` — Regulation (EU) 2025/40) and Germany's `VerpackDG` took effect.
  * Every Shopify merchant shipping even **1 parcel** into Germany (`LUCID`) or France (`Citeo`) must report total kilograms of empty packaging (`Paper/Cardboard PPK`, `Plastics/Film`, `Glass/Metal`) per country—or face fines up to €100,000–€200,000 in Germany and €30,000 in France.
  * **Shopify's Native Product Weight Bug:** Shopify's built-in product weight field only measures shipping weight for courier rates, NOT the tare weight of the empty shipping carton, poly mailer, bubble wrap, and tape.
  * **Competitor Gap (Verified Sept 2026):** Only ~7–9 EPR apps exist on the Shopify App Store; **6 out of 7 have 0 reviews**, and the category leader (`EPR Insights`) has only **3 reviews**. Getting 5–10 reviews ranks PackEPR #1 globally.

## 2. Strict UI / UX Design System Rules (Human-Made Shopify Polaris Look)
The founder explicitly requested that the app look **100% genuine and human-engineered**, NOT like an AI-generated template:
1. **NO Dark-Mode Neon Gradients:** Never use `bg-slate-950`, glowing neon emerald/purple shadows, or crypto-style rounded-full pills.
2. **Use Authentic Shopify Polaris Light Mode:**
   * Page background: `#F6F6F7`
   * Card background: `#FFFFFF` with `1px solid #E1E3E5` border and `8px` border-radius.
   * Primary text: `#202223`; Secondary/muted text: `#6D7175`.
   * Primary action button: Shopify Forest Green (`#008060`, hover `#006E52`, border `#006E52`).
   * Secondary action button: `#FFFFFF` with `1px solid #BABFC3` border.
   * Focus ring: `#005BD3` (Shopify Admin accessible blue).
3. **Accounting-Grade Typography:** Always use `font-variant-numeric: tabular-nums` on weight columns, order counts, and Euro fee estimates so decimal points align vertically like German accounting software (`Datev` / `Lexoffice`).

## 3. Core Packaging Math & EU Regulatory Rules
1. **Tare Weight Calculation:**
   * Each order is mapped to a `BoxPreset` containing `cardboardGrams` (PPK), `plasticGrams` (LDPE mailer, bubble wrap, packing tape), and `otherGrams` (glass/aluminum/composite).
   * `Country Mass (kg) = SUM(order_preset_grams for country) / 1000` rounded to **3 decimal places** (`0.000 kg`).
2. **Country Threshold Rules Built Into PackEPR:**
   * **Germany (`DE` — ZSVR LUCID / VerpackDG):** `0 kg` threshold (applies from the very 1st parcel). Dual-system license starts at ~€39/year (`Lizenzero` / `Landbell`). Non-EU sellers must also appoint an EU Authorised Representative under `VerpackDG § 5(2)`.
   * **France (`FR` — Citeo / Adelphe IDU):** `0 kg` threshold (applies from the 1st parcel). Flat annual fee of `€110/year` (excl. VAT) for under 10,000 packaging units (`CSU`).
   * **Austria (`AT` — ARA):** `0 kg` threshold; simplified lump-sum tier for `<= 1,500 kg/year` (~€90–€150/year).
   * **Italy (`IT` — CONAI):** Charged per tonne by material (`Art. 178-quater`).
   * **Spain (`ES` — MITECO):** Simplified filing under `15 tonnes/year`; non-established sellers require a Spanish Authorised Representative (`RD 1055/2022`).
   * **Netherlands (`NL` — Verpact):** `50,000 kg/year` general threshold (`0 kg` for single-use plastics).
