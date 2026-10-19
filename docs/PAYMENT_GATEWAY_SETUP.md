# PackEPR — Payment Gateway Setup Guide (Lemon Squeezy / Paddle)

> **Why Lemon Squeezy as Merchant of Record (MoR):**
> 1. **Zero Tax Liability for You:** Lemon Squeezy handles all European VAT (MOSS), reverse-charge invoicing, and tax filings automatically. German & French merchants get legal B2B tax receipts.
> 2. **Direct Payouts to India:** Payouts are sent automatically via Stripe Connect / Wise directly to your Indian bank account in Rupees (₹).
> 3. **Global Payment Methods:** Accepts Visa, Mastercard, American Express, Apple Pay, Google Pay, and PayPal from EU merchants.

---

## 3-Step Setup Instructions

### Step 1: Create Your Free Lemon Squeezy Account
1. Go to **[https://app.lemonsqueezy.com](https://app.lemonsqueezy.com)** and create a free store account (e.g. named **PackEPR**).
2. Complete the store verification and set your payout method (bank transfer to your Indian bank account).

---

### Step 2: Create Your 2 Subscription Products
Under **Store → Products**, click **+ New Product**:

1. **Starter Plan (€14 / month)**
   * **Name:** `PackEPR Starter Plan — Germany & France`
   * **Pricing Model:** Subscription
   * **Price:** `€14.00` / Month (or add an annual variant for `€129.00` / Year)
   * **Copy the Checkout URL** (e.g. `https://packepr.lemonsqueezy.com/buy/starter-plan`).

2. **EU PPWR Pro Plan (€39 / month)**
   * **Name:** `PackEPR EU PPWR Pro Plan — All 27 EU States`
   * **Pricing Model:** Subscription
   * **Price:** `€39.00` / Month
   * **Copy the Checkout URL** (e.g. `https://packepr.lemonsqueezy.com/buy/pro-plan`).

---

### Step 3: Connect Webhook & Checkout URLs to PackEPR

#### A. In `index.html`:
Replace the placeholder URLs in `window.PACKEPR_CHECKOUT`:
```javascript
window.PACKEPR_CHECKOUT = {
  starter: 'https://packepr.lemonsqueezy.com/buy/YOUR_STARTER_VARIANT_ID',
  pro: 'https://packepr.lemonsqueezy.com/buy/YOUR_PRO_VARIANT_ID'
};
```

#### B. In Lemon Squeezy Dashboard:
1. Navigate to **Settings → Webhooks**.
2. Click **+ Add Webhook**.
3. Set **Callback URL**:
   ```
   https://pack-epr.vercel.app/api/webhook/payment
   ```
4. Check these **Events**:
   * `order_created`
   * `subscription_created`
   * `subscription_updated`
   * `subscription_payment_success`
5. Copy your **Signing Secret**.
6. In **Vercel Project Settings → Environment Variables**, add:
   * `LEMON_SQUEEZY_WEBHOOK_SECRET` = `your_signing_secret_here`

---

## What Happens When a Merchant Pays:
1. Merchant selects plan or clicks *"💳 Direct EU VAT Checkout"*.
2. Lemon Squeezy opens secure checkout modal with EU VAT, tax ID validation, and card/PayPal payment.
3. Lemon Squeezy fires a webhook to `https://pack-epr.vercel.app/api/webhook/payment`.
4. PackEPR immediately:
   * Upgrades the merchant's store record to `converted` and plan to `starter`/`pro`.
   * Unlocks unlimited XML & CSV downloads.
   * Sends the Euro earnings to your Lemon Squeezy balance for automatic payout to India!
