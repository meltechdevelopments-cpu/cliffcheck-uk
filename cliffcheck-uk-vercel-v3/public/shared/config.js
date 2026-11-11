// ============================================================================
// CLIFFCHECK UK — FOUNDER CONFIGURATION (POLAR.SH + CARVERTICAL READY!)
// ============================================================================
(function (root) {
  const HUNDRED_YEARS_MS = 100 * 365 * 24 * 60 * 60 * 1000;

  const CLIFFCHECK_CONFIG = {
    brandName: "CliffCheck UK",
    siteUrl: "https://cliffcheck-uk.vercel.app",
    passPriceText: "£9.99",
    passDurationText: "Lifetime Unlimited Pass",

    // 1. Free full checks before the £9.99 Lifetime Pass unlock kicks in:
    freeChecksAllowedWeb: 1,
    freeChecksAllowedExtension: 2,

    // 2. YOUR VERIFIED POLAR.SH SETTINGS (LIVE & CONNECTED!):
    polarOrganizationId: "f54cc5b7-b9ad-443e-9c8c-60a686a6ac1c",
    checkoutUrl: "https://buy.polar.sh/polar_cl_tXauD5HrRHsmVMa5FHZQETxkp50WND4iLzxPw2wX0le",

    // 3. Car History Check Affiliate Link:
    // As soon as carVertical (Everflow) approves your application, paste your tracking URL inside the quotes below!
    carVerticalAffiliateUrl: "",
    motorCheckAffiliateId: "cliffcheck",

    // 4. Optional Mozilla Firefox Add-ons Store URL (paste once Mozilla signs your free add-on!):
    firefoxAmoStoreUrl: "",

    // 5. Founder test code so YOU & your husband have unlimited checks forever:
    founderTestCode: "VIP-TEST-2026"
  };

  // Shared Polar.sh License Key Validator (safe public endpoint — zero secret keys needed!)
  CLIFFCHECK_CONFIG.validatePolarKey = async function (rawKey) {
    const key = String(rawKey || "").trim();
    if (!key) return { valid: false, error: "Please enter your Pass code." };

    if (key.toUpperCase() === CLIFFCHECK_CONFIG.founderTestCode.toUpperCase()) {
      return {
        valid: true,
        expiresAt: Date.now() + HUNDRED_YEARS_MS,
        plan: "Lifetime Unlimited Pass (Founder VIP)"
      };
    }

    if (
      !CLIFFCHECK_CONFIG.polarOrganizationId ||
      CLIFFCHECK_CONFIG.polarOrganizationId.includes("REPLACE_WITH")
    ) {
      return {
        valid: false,
        error: "Paste your Polar Organization ID into config.js first."
      };
    }

    const resp = await fetch("https://api.polar.sh/v1/customer-portal/license-keys/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: key,
        organization_id: CLIFFCHECK_CONFIG.polarOrganizationId
      })
    });

    if (resp.status === 404) {
      return { valid: false, error: "Pass code not found — check the code in your Polar email receipt." };
    }
    if (resp.status === 403 || resp.status === 422) {
      return { valid: false, error: "This Pass code is inactive or has reached its household device limit." };
    }
    if (!resp.ok) {
      return { valid: false, error: "Could not verify Pass code (" + resp.status + ")." };
    }

    const data = await resp.json();
    const expiresAt = data.expires_at
      ? new Date(data.expires_at).getTime()
      : Date.now() + HUNDRED_YEARS_MS;

    if (data.status === "granted" && expiresAt > Date.now()) {
      return {
        valid: true,
        expiresAt: expiresAt,
        plan: "Lifetime Unlimited Pass"
      };
    }

    return { valid: false, error: "This Pass code is no longer active." };
  };

  CLIFFCHECK_CONFIG.buildHistoryAffiliateUrl = function (reg) {
    const cleanReg = (reg || "").replace(/\s+/g, "").toUpperCase();
    const cv = String(CLIFFCHECK_CONFIG.carVerticalAffiliateUrl || "").trim();
    if (cv) {
      if (cv.endsWith("=")) {
        return cv + encodeURIComponent(cleanReg);
      }
      return cv;
    }
    return (
      "https://www.carvertical.com/gb" +
      (cleanReg && cleanReg !== "SPECCHECK" ? "?vin=" + encodeURIComponent(cleanReg) : "")
    );
  };

  root.CLIFFCHECK_CONFIG = CLIFFCHECK_CONFIG;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = CLIFFCHECK_CONFIG;
  }
})(typeof self !== "undefined" ? self : window);
