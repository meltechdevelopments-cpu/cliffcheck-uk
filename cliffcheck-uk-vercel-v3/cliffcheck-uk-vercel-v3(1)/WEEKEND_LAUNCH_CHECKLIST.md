# CliffCheck UK — Your Plain-English "Live By This Weekend" Guide (Polar.sh Edition)

Because your **Polar (`polar.sh`) account is already verified**, you skip all payment-account approval delays and can accept **Apple Pay, Google Pay, and cards today**!

Everything is already wired directly to **Polar's official License Key system** inside `/home/user/cliffcheck-uk/`.

---

## Step 1: Create Your £9.99 Pass Inside Your Polar.sh Dashboard (3 Minutes · £0 Cost)
1. Log in to **[polar.sh](https://polar.sh)** and go to **Benefits → Create Benefit**:
   - **Type:** `License Keys`
   - **Prefix:** `CLIFF` (so buyers get neat codes like `CLIFF-A82F-...`)
   - **Expiration:** Toggle **ON** → set to **30 days** (Polar automatically expires the code after 30 days—zero work for you!)
   - **Activation Limit:** Optional (leave off, or set to `3` so one buyer can unlock their phone + laptop).
   - Click **Create**.
2. Go to **Products → Create Product**:
   - **Name:** `CliffCheck UK — 30-Day Car-Hunter Pass`
   - **Pricing:** `One-time purchase` → **£9.99** (GBP)
   - **Benefits:** Attach the **`License Keys`** benefit you just created.
   - Click **Create**, then create a **Checkout Link** (`https://buy.polar.sh/polar_cl_...`).
3. Grab two things from Polar and paste them into `/public/shared/config.js`:
   - **`polarOrganizationId`**: Found in Polar **Settings → General → Organization ID**
   - **`checkoutUrl`**: Your `https://buy.polar.sh/polar_cl_...` link

*(That's it! Polar handles UK VAT automatically, emails the buyer their `CLIFF-...` code instantly, and your app validates it straight against Polar's free public API with zero server keys needed.)*

---

## Step 2: Grab Your Instant-Approval Car History Referral Link (5 Minutes · £0 Cost)
Every single check on your site shows a green **"Check Stolen / Finance / Write-Off History"** button—paying you extra money even from free users!
1. Sign up free at **[MotorCheck UK Affiliate Programme](https://help.motorcheck.co.uk/en/articles/9759759-motorcheck-affiliate-programme)** or **[Total Car Check Affiliates](https://totalcarcheck.co.uk)** (approves in ~10 minutes, zero follower minimums).
2. Paste your **Affiliate ID** into `motorCheckAffiliateId` inside `/public/shared/config.js`.
*(Once you post your first 3–5 TikToks, also apply to **carVertical's Affiliate Program** for 25% commissions—around £4 to £6 per report!)*

---

## Step 3: Put Your Phone & Web App Live on the Internet (10 Minutes · £0/Month)
1. Create a free account at **[Cloudflare Pages](https://pages.cloudflare.com)** (£0/month forever).
2. Upload your `cliffcheck-uk` folder (set Output Directory to `public`). Your site goes live **instantly** on a free link like `cliffcheck-uk.pages.dev` (or connect `cliffcheck.co.uk` for ~£5/year).
3. **Request your Free Official UK Government MOT Key** at **[documentation.history.mot.api.gov.uk](https://documentation.history.mot.api.gov.uk)** (100% free for commercial use).
   - *Zero delay:* Even before DVSA emails your key, your **Quick Spec Mode** works on 100% of cars immediately, so **you can start taking £9.99 Polar sales today**!
   - When DVSA emails your key, paste `MOT_API_KEY`, `MOT_CLIENT_ID`, `MOT_CLIENT_SECRET`, `MOT_SCOPE`, and `MOT_TOKEN_URL` into **Cloudflare Pages → Settings → Environment Variables** and live 7-letter number-plate lookups switch on automatically!

---

## Step 4: Upload the Laptop AutoTrader Add-On to Google (~£4 One-Time Fee)
1. Go to the **[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)** and pay the one-time $5 (~£4) registration fee (this single account also covers `PhobiaSkip` later for £0 extra!).
2. Click **New Item** and upload `/public/cliffcheck-chrome-extension.zip`.
3. Google usually approves simple add-ons in **24 to 48 hours**.

---

## Step 5: 3 Word-for-Word 20-Second Videos to Get Weekend Buyers for £0
Film your laptop or phone screen—**no need to show your face**. Post 1 a day on **TikTok, Instagram Reels, and YouTube Shorts** with your website link in your bio:

* **Video 1 ("The £7,500 Fiesta Trap"):**  
  *"Looking at a 2018 Ford Fiesta on AutoTrader this weekend? 57,000 miles, 12 months clean MOT. Now watch what happens when I put it through CliffCheck... £1,250 oil-bath wet belt due in 2,500 miles unless they have the garage receipt—plus it writes the exact message to knock £800 off the price. Link in bio—first check is free."*
* **Video 2 ("Why Are So Many Golf GTIs Sold at 39,000 Miles?"):**  
  *"Ever wondered why AutoTrader is full of automatic VW Golfs and Audis at 38,000 miles? Watch the CliffCheck badge in the corner... Mandatory £380 DSG gearbox oil & filter service at 40k—skip it and the gearbox brain blows up for £1,800. Always check before you view."*
* **Video 3 ("The Hidden £620/Year Road Tax Trap"):**  
  *"Buying a 3-year-old used BMW, Audi, or Volvo for £24,000? Most buyers have no idea they're about to get hit with £620 a year road tax because the car cost £40,100 when brand new. Check any car in 3 seconds before Saturday viewings—link in bio."*
