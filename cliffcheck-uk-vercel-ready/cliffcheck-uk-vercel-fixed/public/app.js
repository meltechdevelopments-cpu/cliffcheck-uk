(function () {
  const cfg = window.CLIFFCHECK_CONFIG;
  const engine = window.CliffEngine;

  const STORAGE_PASS_KEY = "cliffcheck_pass_v1";
  const STORAGE_COUNT_KEY = "cliffcheck_free_used_v1";

  const tabPlate = document.getElementById("tabPlate");
  const tabSpec = document.getElementById("tabSpec");
  const plateForm = document.getElementById("plateForm");
  const specForm = document.getElementById("specForm");
  const regInput = document.getElementById("regInput");
  const plateGearbox = document.getElementById("plateGearbox");
  const plateMileageOverride = document.getElementById("plateMileageOverride");
  const resultsSection = document.getElementById("resultsSection");

  const passModal = document.getElementById("passModal");
  const openPassModalBtn = document.getElementById("openPassModalBtn");
  const closePassModalBtn = document.getElementById("closePassModalBtn");
  const buyPassLink = document.getElementById("buyPassLink");
  const licenseKeyInput = document.getElementById("licenseKeyInput");
  const activatePassBtn = document.getElementById("activatePassBtn");
  const passStatusMsg = document.getElementById("passStatusMsg");

  buyPassLink.href = cfg.checkoutUrl;

  function hasActivePass() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_PASS_KEY) || "null");
      return Boolean(raw && raw.valid && raw.expiresAt > Date.now());
    } catch {
      return false;
    }
  }

  function getFreeUsedCount() {
    return parseInt(localStorage.getItem(STORAGE_COUNT_KEY) || "0", 10) || 0;
  }

  function incrementFreeUsedCount() {
    localStorage.setItem(STORAGE_COUNT_KEY, String(getFreeUsedCount() + 1));
  }

  function updatePassBadge() {
    if (hasActivePass()) {
      openPassModalBtn.textContent = "✅ 30-Day Pass Active (Unlimited)";
      openPassModalBtn.classList.add("active");
    } else {
      const left = Math.max(0, cfg.freeChecksAllowedWeb - getFreeUsedCount());
      openPassModalBtn.textContent =
        left > 0 ? `🎁 ${left} Free Full Check Left · Unlock Pass` : "🔒 Unlock 30-Day Pass (£9.99)";
      openPassModalBtn.classList.remove("active");
    }
  }

  updatePassBadge();

  // Auto-open Pass activation modal if buyer returns from Polar Success URL (?purchased=1)
  if (window.location.search.includes("purchased=1") && !hasActivePass()) {
    passModal.classList.add("open");
    passStatusMsg.textContent = "🎉 Payment complete! Copy your CLIFF-... Pass code from Polar / your email and paste it above.";
    passStatusMsg.style.color = "#34d399";
  }

  // Tab switching
  tabPlate.addEventListener("click", () => {
    tabPlate.classList.add("active");
    tabSpec.classList.remove("active");
    plateForm.classList.remove("hidden");
    specForm.classList.add("hidden");
  });

  tabSpec.addEventListener("click", () => {
    tabSpec.classList.add("active");
    tabPlate.classList.remove("active");
    specForm.classList.remove("hidden");
    plateForm.classList.add("hidden");
  });

  // Pass Modal controls
  openPassModalBtn.addEventListener("click", () => passModal.classList.add("open"));
  closePassModalBtn.addEventListener("click", () => passModal.classList.remove("open"));
  passModal.addEventListener("click", (e) => {
    if (e.target === passModal) passModal.classList.remove("open");
  });

  let lastReport = null;

  activatePassBtn.addEventListener("click", async () => {
    const code = licenseKeyInput.value.trim();
    if (!code) return;
    passStatusMsg.textContent = "Checking your Polar Pass code...";
    passStatusMsg.style.color = "#facc15";

    try {
      const data = await cfg.validatePolarKey(code);
      if (data && data.valid) {
        localStorage.setItem(STORAGE_PASS_KEY, JSON.stringify(data));
        passStatusMsg.textContent = "✅ Pass activated! Unlimited checks & haggling scripts unlocked.";
        passStatusMsg.style.color = "#34d399";
        updatePassBadge();
        setTimeout(() => {
          passModal.classList.remove("open");
          if (lastReport) renderReport(lastReport, true);
        }, 700);
        return;
      }
      passStatusMsg.textContent = "❌ " + (data.error || "Invalid Pass code.");
      passStatusMsg.style.color = "#f87171";
    } catch {
      passStatusMsg.textContent = "Could not reach Polar verification server.";
      passStatusMsg.style.color = "#f87171";
    }
  });

  // Sample UK Plate Chips
  document.querySelectorAll("[data-sample]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-sample");
      const demo = engine.DEMO_VEHICLES[key];
      if (!demo) return;
      tabPlate.click();
      regInput.value = demo.registration;
      plateGearbox.value = demo.transmission || "";
      plateMileageOverride.value = demo.mileage || "";
      runVehicleCheck(demo);
    });
  });

  // Plate Form Submit
  plateForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cleanReg = regInput.value.replace(/\s+/g, "").toUpperCase();
    if (!cleanReg) return;

    // 1. Check built-in realistic UK sample plates first for instant demo speed
    if (engine.DEMO_VEHICLES[cleanReg]) {
      const clone = Object.assign({}, engine.DEMO_VEHICLES[cleanReg]);
      if (plateGearbox.value) clone.transmission = plateGearbox.value;
      if (Number(plateMileageOverride.value) > 0) clone.mileage = Number(plateMileageOverride.value);
      runVehicleCheck(clone);
      return;
    }

    // 2. Otherwise query live /api/check-plate (DVSA MOT History v1)
    const btn = document.getElementById("checkPlateBtn");
    const origText = btn.textContent;
    btn.textContent = "Checking UK DVSA Register...";
    btn.disabled = true;

    try {
      const resp = await fetch("/api/check-plate?reg=" + encodeURIComponent(cleanReg));
      const data = await resp.json();

      if (data && data.mode === "LIVE_DVSA" && data.vehicle) {
        const veh = data.vehicle;
        if (plateGearbox.value) veh.transmission = plateGearbox.value;
        if (Number(plateMileageOverride.value) > 0) veh.mileage = Number(plateMileageOverride.value);
        runVehicleCheck(veh);
      } else if (data && data.mode === "DEMO_FALLBACK") {
        // DVSA API keys not yet added in Cloudflare — smoothly switch user to Quick Spec with reg pre-filled!
        tabSpec.click();
        resultsSection.classList.remove("hidden");
        resultsSection.innerHTML = `
          <div class="cliff-item" style="border-color:#facc15;">
            <strong style="color:#facc15;">⚡ Instant Spec Mode Ready for ${escapeHtml(cleanReg)}</strong>
            <p style="margin:6px 0 0;font-size:0.88rem;color:#cbd5e1;">
              Live DVSA plate lookup activates as soon as your free DVSA API key is pasted into Cloudflare settings. Right now, pick the car's <strong>Make, Year, Engine &amp; Mileage</strong> above (or tap any of the 6 UK example plates) to run the full cliff check immediately!
            </p>
          </div>
        `;
      } else {
        resultsSection.classList.remove("hidden");
        resultsSection.innerHTML = `<div class="cliff-item" style="border-color:#ef4444;color:#fca5a5;">${escapeHtml(
          data.error || "Could not find that registration — try the Quick Spec tab!"
        )}</div>`;
      }
    } catch {
      tabSpec.click();
    } finally {
      btn.textContent = origText;
      btn.disabled = false;
    }
  });

  // Quick Spec Form Submit
  specForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const litres = parseFloat(document.getElementById("specLitres").value) || 0;
    const rawVehicle = {
      registration: regInput.value.trim().toUpperCase() || "SPEC CHECK",
      make: document.getElementById("specMake").value,
      model: document.getElementById("specModel").value,
      derivative: document.getElementById("specModel").value,
      year: parseInt(document.getElementById("specYear").value, 10) || 2018,
      fuelType: document.getElementById("specFuel").value,
      engineSizeCc: Math.round(litres * 1000),
      transmission: document.getElementById("specGearbox").value,
      mileage: parseInt(document.getElementById("specMileage").value, 10) || 55000,
      askingPrice: parseInt(document.getElementById("specPrice").value, 10) || 0,
      motTests: []
    };
    runVehicleCheck(rawVehicle);
  });

  function runVehicleCheck(vehicleData) {
    const report = engine.analyzeVehicle(vehicleData);
    lastReport = report;

    const isPro = hasActivePass();
    let unlockedThisCheck = isPro;

    if (!isPro) {
      const used = getFreeUsedCount();
      if (used < cfg.freeChecksAllowedWeb) {
        unlockedThisCheck = true;
        incrementFreeUsedCount();
      }
    }

    updatePassBadge();
    renderReport(report, unlockedThisCheck);
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderReport(report, isUnlocked) {
    resultsSection.classList.remove("hidden");
    const v = report.vehicleSummary;
    const affUrl = cfg.buildHistoryAffiliateUrl(v.registration);

    const exposureStr =
      report.cliffCount === 0
        ? "£0 Major Cliffs"
        : `£${report.totalExposureMin.toLocaleString()} – £${report.totalExposureMax.toLocaleString()}`;

    let detailsHtml = "";

    if (report.cliffCount === 0) {
      detailsHtml = `
        <div class="cliff-item" style="border-color:rgba(16,185,129,0.45);">
          <strong style="color:#34d399;">✅ No Notorious Wet-Belt, Chain or Gearbox Timebombs Flagged</strong>
          <p class="cliff-reason" style="margin-top:6px;">
            This engine/age/mileage combination avoids the UK's high-failure wet-belt and rear-chain traps. Still verify annual oil service receipts and run a finance/write-off check before paying a deposit.
          </p>
        </div>
      `;
    } else if (isUnlocked) {
      detailsHtml = `
        <div class="cliff-list">
          ${report.cliffs
            .map(
              (c) => `
            <div class="cliff-item">
              <div class="cliff-head">
                <div>
                  <span class="badge-sev ${c.severity}">${escapeHtml(c.category)}</span>
                  <div style="font-weight:800;font-size:1.02rem;margin-top:5px;">${escapeHtml(c.title)}</div>
                </div>
                <div class="cliff-cost">£${c.costMin.toLocaleString()}–£${c.costMax.toLocaleString()}</div>
              </div>
              <div class="cliff-due">⏱ ${escapeHtml(c.dueText)}</div>
              <p class="cliff-reason">${escapeHtml(c.plainReason)}</p>
              <div class="cliff-proof"><strong>Ask Seller / Check on Viewing:</strong> ${escapeHtml(c.proofToAsk)}</div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    } else {
      // Paywalled Check #2+: Show exact count + ££ exposure + Affiliate CTA, blur the exact breakdown & script!
      detailsHtml = `
        <div class="paywall-wrap">
          <div class="blurred-teaser">
            <div class="cliff-item">
              <strong>Hidden Maintenance Cliff #1 — £1,050 to £1,550 Specialist Job</strong>
              <p>Exact mileage countdown, engine-code reason, oil-strainer check &amp; seller VAT invoice proof...</p>
            </div>
          </div>
          <div class="paywall-box">
            <span class="eyebrow">You've Used Your 1 Free Full Report</span>
            <h3>Reveal All ${report.cliffCount} Flagged Cost Trap(s) &amp; Exact Haggling Script</h3>
            <ul class="paywall-perks">
              <li>✅ Unlock exact fault breakdown &amp; UK garage repair costs (${exposureStr})</li>
              <li>✅ Copy-paste WhatsApp / AutoTrader message to knock <strong>~£${report.suggestedDiscount.toLocaleString()}</strong> off asking price</li>
              <li>✅ <strong>Unlimited checks for 30 days</strong> on both Phone &amp; Chrome AutoTrader Add-On</li>
            </ul>
            <button type="button" id="inlineUnlockBtn" class="btn-primary" style="max-width:380px;">
              Unlock 30-Day Pass — Just ${cfg.passPriceText} Once →
            </button>
            <div style="margin-top:10px;font-size:0.8rem;color:#94a3b8;">
              One-off payment · No subscription · Instant access
            </div>
          </div>
        </div>
      `;
    }

    const haggleHtml = isUnlocked
      ? `
      <div class="haggle-card">
        <h3>
          <span>💬 Ready-to-Send Seller Haggling Message</span>
          ${
            report.suggestedDiscount > 0
              ? `<span style="font-size:0.8rem;color:#facc15;">Target ~£${report.suggestedDiscount.toLocaleString()} Off</span>`
              : ""
          }
        </h3>
        <textarea id="haggleText" class="haggle-textarea" readonly>${escapeHtml(report.hagglingScript)}</textarea>
        <div class="action-row">
          <button type="button" id="copyScriptBtn" class="btn-secondary" style="border-color:#facc15;color:#facc15;">
            📋 Copy Message for Seller / Dealer
          </button>
          <a href="${escapeHtml(affUrl)}" target="_blank" rel="noopener" class="btn-affiliate">
            🛡 Check Stolen / Finance / Write-Off (${escapeHtml(v.registration)}) →
          </a>
        </div>
      </div>
    `
      : `
      <div style="margin-top:14px;">
        <a href="${escapeHtml(affUrl)}" target="_blank" rel="noopener" class="btn-affiliate" style="width:100%;">
          🛡 Run Official Stolen / Finance / Write-Off Check on ${escapeHtml(v.registration)} →
        </a>
      </div>
    `;

    resultsSection.innerHTML = `
      <div class="verdict-banner ${report.overallVerdict}">
        <div>
          <div style="font-size:0.78rem;font-weight:800;color:#facc15;text-transform:uppercase;">
            ${escapeHtml(v.registration)} · ${escapeHtml(v.carLabel)} (${v.mileage.toLocaleString()} miles · ${escapeHtml(v.transmission)})
          </div>
          <div class="verdict-title">${escapeHtml(report.verdictLabel)}</div>
          <div class="verdict-sub">
            ${report.cliffCount} upcoming schedule / tax item(s) flagged · Avg ${v.avgAnnualMiles.toLocaleString()} mi/yr
          </div>
        </div>
        <div class="exposure-box">
          <div class="exposure-label">Unverified Bill Exposure</div>
          <div class="exposure-amount">${exposureStr}</div>
        </div>
      </div>
      ${detailsHtml}
      ${haggleHtml}
    `;

    const copyBtn = document.getElementById("copyScriptBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(report.hagglingScript);
        copyBtn.textContent = "✅ Copied! Paste into AutoTrader / WhatsApp";
        setTimeout(() => {
          copyBtn.textContent = "📋 Copy Message for Seller / Dealer";
        }, 2200);
      });
    }

    const inlineUnlockBtn = document.getElementById("inlineUnlockBtn");
    if (inlineUnlockBtn) {
      inlineUnlockBtn.addEventListener("click", () => passModal.classList.add("open"));
    }
  }
})();
