(function () {
  const cfg = window.CLIFFCHECK_CONFIG;
  const engine = window.CliffEngine;
  const carDir = window.UK_CAR_DIRECTORY;

  const STORAGE_PASS_KEY = "cliffcheck_pass_v1";
  const STORAGE_COUNT_KEY = "cliffcheck_free_used_v1";
  const STORAGE_SHORTLIST_KEY = "cliffcheck_shortlist_v1";

  const tabPlate = document.getElementById("tabPlate");
  const tabSpec = document.getElementById("tabSpec");
  const tabPaste = document.getElementById("tabPaste");
  const plateForm = document.getElementById("plateForm");
  const specForm = document.getElementById("specForm");
  const pasteForm = document.getElementById("pasteForm");

  const regInput = document.getElementById("regInput");
  const plateGearbox = document.getElementById("plateGearbox");
  const plateMileageOverride = document.getElementById("plateMileageOverride");

  const specMake = document.getElementById("specMake");
  const specModelSelect = document.getElementById("specModelSelect");
  const specModelCustom = document.getElementById("specModelCustom");
  const specTrim = document.getElementById("specTrim");
  const specFuel = document.getElementById("specFuel");
  const specLitres = document.getElementById("specLitres");

  const advertPasteInput = document.getElementById("advertPasteInput");
  const pasteErrorMsg = document.getElementById("pasteErrorMsg");

  const shortlistBar = document.getElementById("shortlistBar");
  const shortlistPills = document.getElementById("shortlistPills");
  const clearShortlistBtn = document.getElementById("clearShortlistBtn");
  const resultsSection = document.getElementById("resultsSection");

  const passModal = document.getElementById("passModal");
  const openPassModalBtn = document.getElementById("openPassModalBtn");
  const closePassModalBtn = document.getElementById("closePassModalBtn");
  const buyPassLink = document.getElementById("buyPassLink");
  const licenseKeyInput = document.getElementById("licenseKeyInput");
  const activatePassBtn = document.getElementById("activatePassBtn");
  const passStatusMsg = document.getElementById("passStatusMsg");

  const installPhoneBtn = document.getElementById("installPhoneBtn");
  const phoneModal = document.getElementById("phoneModal");
  const closePhoneModalBtn = document.getElementById("closePhoneModalBtn");
  const firefoxDownloadBtn = document.getElementById("firefoxDownloadBtn");

  buyPassLink.href = cfg.checkoutUrl;

  if (cfg.firefoxAmoStoreUrl && firefoxDownloadBtn) {
    firefoxDownloadBtn.href = cfg.firefoxAmoStoreUrl;
    firefoxDownloadBtn.removeAttribute("download");
    firefoxDownloadBtn.target = "_blank";
    firefoxDownloadBtn.textContent = "🦊 Add to Firefox (Free)";
  }

  // ==========================================================================
  // AUTO-CHECK IF LIVE DVSA PLATE API IS CONFIGURED IN VERCEL
  // ==========================================================================
  fetch("/api/check-plate?status=1")
    .then((r) => r.json())
    .then((st) => {
      if (st && st.live && tabPlate) {
        tabPlate.classList.remove("hidden");
        activateTab("plate");
      }
    })
    .catch(() => {});

  // ==========================================================================
  // CLEAN 3-TAB SWITCHER
  // ==========================================================================
  function activateTab(which) {
    [tabPlate, tabSpec, tabPaste].forEach((t) => t && t.classList.remove("active"));
    [plateForm, specForm, pasteForm].forEach((f) => f && f.classList.add("hidden"));

    if (which === "plate" && tabPlate) {
      tabPlate.classList.add("active");
      plateForm.classList.remove("hidden");
    } else if (which === "paste" && tabPaste) {
      tabPaste.classList.add("active");
      pasteForm.classList.remove("hidden");
    } else {
      tabSpec.classList.add("active");
      specForm.classList.remove("hidden");
    }
  }

  if (tabPlate) tabPlate.addEventListener("click", () => activateTab("plate"));
  if (tabSpec) tabSpec.addEventListener("click", () => activateTab("spec"));
  if (tabPaste) tabPaste.addEventListener("click", () => activateTab("paste"));

  // ==========================================================================
  // POPULATE ALL 55 AUTOTRADER UK MAKES & MODELS
  // ==========================================================================
  if (carDir && specMake && specModelSelect) {
    const makeKeys = Object.keys(carDir.makesModels).sort((a, b) => {
      const la = carDir.makeLabels[a] || a;
      const lb = carDir.makeLabels[b] || b;
      return la.localeCompare(lb);
    });

    makeKeys.forEach((mk) => {
      const opt = document.createElement("option");
      opt.value = mk;
      opt.textContent = carDir.makeLabels[mk] || mk;
      specMake.appendChild(opt);
    });

    const otherMakeOpt = document.createElement("option");
    otherMakeOpt.value = "OTHER";
    otherMakeOpt.textContent = "Other / Unlisted Make...";
    specMake.appendChild(otherMakeOpt);

    specMake.addEventListener("change", () => populateModelsForMake(specMake.value));

    specModelSelect.addEventListener("change", () => {
      if (specModelSelect.value === "__CUSTOM__") {
        specModelCustom.classList.remove("hidden");
        specModelCustom.required = true;
        specModelCustom.focus();
      } else {
        specModelCustom.classList.add("hidden");
        specModelCustom.required = false;
      }
    });
  }

  function populateModelsForMake(selectedMake) {
    specModelSelect.innerHTML = "";
    if (!selectedMake) {
      specModelSelect.disabled = true;
      const ph = document.createElement("option");
      ph.value = "";
      ph.textContent = "— Select Make First —";
      specModelSelect.appendChild(ph);
      specModelCustom.classList.add("hidden");
      specModelCustom.required = false;
      return;
    }

    specModelSelect.disabled = false;
    const models = (carDir && carDir.makesModels[selectedMake]) || [];

    if (models.length === 0) {
      const customOpt = document.createElement("option");
      customOpt.value = "__CUSTOM__";
      customOpt.textContent = "Type Model Name Below";
      specModelSelect.appendChild(customOpt);
      specModelCustom.classList.remove("hidden");
      specModelCustom.required = true;
      return;
    }

    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "— Select Model —";
    specModelSelect.appendChild(defaultOpt);

    models.forEach((m) => {
      const o = document.createElement("option");
      o.value = m;
      o.textContent = m;
      specModelSelect.appendChild(o);
    });

    const customModelOpt = document.createElement("option");
    customModelOpt.value = "__CUSTOM__";
    customModelOpt.textContent = "Other / Type Manually...";
    specModelSelect.appendChild(customModelOpt);

    specModelCustom.classList.add("hidden");
    specModelCustom.required = false;
  }

  if (specFuel && specLitres) {
    specFuel.addEventListener("change", () => {
      if (specFuel.value === "Electric") {
        specLitres.value = "0";
      } else if (specLitres.value === "0") {
        specLitres.value = "";
      }
    });
  }

  // ==========================================================================
  // PHONE HOME-SCREEN INSTALL HANDLER
  // ==========================================================================
  let deferredInstallPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });

  if (installPhoneBtn && phoneModal) {
    installPhoneBtn.addEventListener("click", async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt = null;
      } else {
        phoneModal.classList.add("open");
      }
    });
    closePhoneModalBtn.addEventListener("click", () => phoneModal.classList.remove("open"));
    phoneModal.addEventListener("click", (e) => {
      if (e.target === phoneModal) phoneModal.classList.remove("open");
    });
  }

  // ==========================================================================
  // PASS & SHORTLIST STORAGE
  // ==========================================================================
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
      openPassModalBtn.textContent = "✅ 30-Day Pass Active";
      openPassModalBtn.classList.add("active");
    } else {
      const left = Math.max(0, cfg.freeChecksAllowedWeb - getFreeUsedCount());
      openPassModalBtn.textContent =
        left > 0 ? `🎁 ${left} Free Check · 30-Day Pass £9.99` : "🔒 Unlock 30-Day Pass (£9.99)";
      openPassModalBtn.classList.remove("active");
    }
  }

  function getShortlist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_SHORTLIST_KEY) || "[]") || [];
    } catch {
      return [];
    }
  }

  function saveToShortlist(vehicleData, report) {
    const list = getShortlist();
    const label = report.vehicleSummary.carLabel + " (" + Math.round(report.vehicleSummary.mileage / 1000) + "k)";
    const filtered = list.filter((item) => item.label !== label);
    filtered.unshift({
      label,
      cliffCount: report.cliffCount,
      verdict: report.overallVerdict,
      vehicleData
    });
    localStorage.setItem(STORAGE_SHORTLIST_KEY, JSON.stringify(filtered.slice(0, 6)));
    renderShortlist();
  }

  function renderShortlist() {
    const list = getShortlist();
    if (!shortlistBar || !shortlistPills) return;
    if (list.length === 0) {
      shortlistBar.classList.add("hidden");
      return;
    }
    shortlistBar.classList.remove("hidden");
    shortlistPills.innerHTML = "";
    list.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "shortlist-pill";
      const dot = item.cliffCount === 0 ? "🟢 " : item.verdict === "CRITICAL" ? "🔴 " : "🟠 ";
      btn.textContent = `${dot}${item.label} · ${item.cliffCount} flag(s)`;
      btn.addEventListener("click", () => {
        const rep = engine.analyzeVehicle(item.vehicleData);
        lastReport = rep;
        renderReport(rep, hasActivePass());
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      shortlistPills.appendChild(btn);
    });
  }

  if (clearShortlistBtn) {
    clearShortlistBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_SHORTLIST_KEY);
      renderShortlist();
    });
  }

  updatePassBadge();
  renderShortlist();

  if (window.location.search.includes("purchased=1") && !hasActivePass()) {
    passModal.classList.add("open");
    passStatusMsg.textContent = "🎉 Payment complete! Paste your CLIFF-... Pass code from Polar / your email above.";
    passStatusMsg.style.color = "#34d399";
  }

  openPassModalBtn.addEventListener("click", () => passModal.classList.add("open"));
  closePassModalBtn.addEventListener("click", () => passModal.classList.remove("open"));
  passModal.addEventListener("click", (e) => {
    if (e.target === passModal) passModal.classList.remove("open");
  });

  let lastReport = null;

  activatePassBtn.addEventListener("click", async () => {
    const code = licenseKeyInput.value.trim();
    if (!code) return;
    passStatusMsg.textContent = "Verifying Pass code...";
    passStatusMsg.style.color = "#facc15";

    try {
      const data = await cfg.validatePolarKey(code);
      if (data && data.valid) {
        localStorage.setItem(STORAGE_PASS_KEY, JSON.stringify(data));
        passStatusMsg.textContent = "✅ Pass activated! Unlimited checks unlocked.";
        passStatusMsg.style.color = "#34d399";
        updatePassBadge();
        setTimeout(() => {
          passModal.classList.remove("open");
          if (lastReport) renderReport(lastReport, true);
        }, 650);
        return;
      }
      passStatusMsg.textContent = "❌ " + (data.error || "Invalid Pass code.");
      passStatusMsg.style.color = "#f87171";
    } catch {
      passStatusMsg.textContent = "Could not reach verification server.";
      passStatusMsg.style.color = "#f87171";
    }
  });

  // ==========================================================================
  // FORM HANDLERS: SELECT CAR / PASTE ADVERT / UK PLATE / SAMPLES
  // ==========================================================================
  document.querySelectorAll("[data-sample]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-sample");
      const demo = engine.DEMO_VEHICLES[key];
      if (!demo) return;
      runVehicleCheck(demo, false);
    });
  });

  specForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const chosenModel =
      specModelSelect.value === "__CUSTOM__"
        ? specModelCustom.value.trim()
        : specModelSelect.value;
    const trimExtra = specTrim ? specTrim.value.trim() : "";
    const litres = parseFloat(specLitres.value) || 0;
    const driveVal = document.getElementById("specDrive") ? document.getElementById("specDrive").value : "2WD";

    const rawVehicle = {
      registration: "CAR CHECK",
      make: specMake.value,
      model: chosenModel,
      derivative: `${chosenModel} ${trimExtra}`.trim(),
      year: parseInt(document.getElementById("specYear").value, 10),
      fuelType: specFuel.value,
      engineSizeCc: Math.round(litres * 1000),
      transmission: document.getElementById("specGearbox").value,
      awd: driveVal === "AWD",
      mileage: parseInt(document.getElementById("specMileage").value, 10),
      askingPrice: parseInt(document.getElementById("specPrice").value, 10) || 0,
      motTests: []
    };
    runVehicleCheck(rawVehicle, true);
  });

  pasteForm.addEventListener("submit", (e) => {
    e.preventDefault();
    pasteErrorMsg.classList.add("hidden");
    const parsed = engine.parseAdvertText(advertPasteInput.value, carDir);

    if (!parsed || !parsed.make || !parsed.year || !parsed.mileage) {
      // Pre-fill whatever we found into Select Car so user only fills the missing box!
      activateTab("spec");
      if (parsed && parsed.make) {
        specMake.value = parsed.make;
        populateModelsForMake(parsed.make);
        if (parsed.model) specModelSelect.value = parsed.model;
      }
      if (parsed && parsed.year) document.getElementById("specYear").value = String(parsed.year);
      if (parsed && parsed.mileage) document.getElementById("specMileage").value = String(parsed.mileage);
      if (parsed && parsed.fuelType) specFuel.value = parsed.fuelType;
      if (parsed && parsed.litres) specLitres.value = String(parsed.litres);
      if (parsed && parsed.transmission) document.getElementById("specGearbox").value = parsed.transmission;
      if (parsed && parsed.askingPrice) document.getElementById("specPrice").value = String(parsed.askingPrice);
      return;
    }

    runVehicleCheck(
      {
        registration: "ADVERT CHECK",
        make: parsed.make,
        model: parsed.model || "",
        derivative: parsed.derivative,
        year: parsed.year,
        fuelType: parsed.fuelType,
        engineSizeCc: parsed.engineSizeCc,
        transmission: parsed.transmission,
        awd: parsed.awd,
        mileage: parsed.mileage,
        askingPrice: parsed.askingPrice,
        motTests: []
      },
      true
    );
  });

  plateForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const plateErrorMsg = document.getElementById("plateErrorMsg");
    if (plateErrorMsg) plateErrorMsg.classList.add("hidden");

    const cleanReg = regInput.value.replace(/\s+/g, "").toUpperCase();
    if (!cleanReg) return;

    const platePriceEl = document.getElementById("platePrice");
    const plateDriveEl = document.getElementById("plateDrive");
    const enteredPrice = platePriceEl ? parseInt(platePriceEl.value, 10) || 0 : 0;
    const enteredAwd = plateDriveEl ? plateDriveEl.value === "AWD" : false;

    if (engine.DEMO_VEHICLES[cleanReg]) {
      const clone = Object.assign({}, engine.DEMO_VEHICLES[cleanReg]);
      if (plateGearbox.value) clone.transmission = plateGearbox.value;
      if (Number(plateMileageOverride.value) > 0) clone.mileage = Number(plateMileageOverride.value);
      if (enteredPrice > 0) clone.askingPrice = enteredPrice;
      if (enteredAwd) clone.awd = true;
      runVehicleCheck(clone, false);
      return;
    }

    const btn = document.getElementById("checkPlateBtn");
    const origText = btn.textContent;
    btn.textContent = "Checking Official UK MOT & Spec Register...";
    btn.disabled = true;

    try {
      const resp = await fetch("/api/check-plate?reg=" + encodeURIComponent(cleanReg));
      const data = await resp.json();

      if (data && data.mode === "LIVE_DVSA" && data.vehicle) {
        const veh = data.vehicle;
        if (plateGearbox.value) veh.transmission = plateGearbox.value;
        if (Number(plateMileageOverride.value) > 0) veh.mileage = Number(plateMileageOverride.value);
        if (enteredPrice > 0) veh.askingPrice = enteredPrice;
        if (enteredAwd) veh.awd = true;
        runVehicleCheck(veh, true);
      } else if (data && data.error) {
        if (plateErrorMsg) {
          plateErrorMsg.textContent = "⚠️ " + data.error;
          plateErrorMsg.classList.remove("hidden");
        }
      } else {
        activateTab("spec");
        specMake.focus();
      }
    } catch {
      if (plateErrorMsg) {
        plateErrorMsg.textContent = "⚠️ Could not reach plate lookup — please retry or use Select Car.";
        plateErrorMsg.classList.remove("hidden");
      }
    } finally {
      btn.textContent = origText;
      btn.disabled = false;
    }
  });

  function runVehicleCheck(vehicleData, shouldSaveShortlist) {
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

    if (shouldSaveShortlist) {
      saveToShortlist(vehicleData, report);
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

  // ==========================================================================
  // RENDER BUYER REPORT (MOT + CROSS-REF + CLIFFS + ACCIDENT/CAT CHECK + HAGGLE)
  // ==========================================================================
  function renderReport(report, isUnlocked) {
    resultsSection.classList.remove("hidden");
    const v = report.vehicleSummary;
    const mot = report.motReport || { hasMotData: false };
    const xref = report.crossReference || {};
    const affUrl = cfg.buildHistoryAffiliateUrl(v.registration);

    const exposureStr =
      report.cliffCount === 0
        ? "£0 Major Cliffs"
        : `£${report.totalExposureMin.toLocaleString()}–£${report.totalExposureMax.toLocaleString()}`;

    const offerStripHtml =
      isUnlocked && v.askingPrice > 0
        ? `
      <div class="offer-strip">
        <div class="offer-metric">
          <small>Advertised Price</small>
          <strong>£${v.askingPrice.toLocaleString()}</strong>
        </div>
        <div class="offer-metric">
          <small>Unverified Bill Risk</small>
          <strong style="color:#fca5a5;">${exposureStr}</strong>
        </div>
        <div class="offer-metric">
          <small>Target Offer Price</small>
          <strong style="color:#34d399;">£${report.recommendedOfferPrice.toLocaleString()}</strong>
        </div>
      </div>
    `
        : "";

    // ========================================================================
    // 1. OFFICIAL UK MOT STATUS, ADVISORIES & V5C CROSS-REFERENCE CARD
    // ========================================================================
    let motAndXrefHtml = "";
    if (isUnlocked && mot.hasMotData) {
      let bannerClass = "clean";
      let bannerTitle = "✅ CLEAN LATEST MOT PASS — Zero Advisories Recorded";
      if (mot.latestResult === "FAILED" || mot.isMotExpired) {
        bannerClass = "fail";
        bannerTitle = mot.isMotExpired
          ? "🚨 MOT EXPIRED — Do Not Drive Away Without Fresh Pass"
          : "🚨 LATEST MOT FAILED — Check Failure Items Below";
      } else if (mot.latestAdvisories && mot.latestAdvisories.length > 0) {
        bannerClass = "warn";
        bannerTitle = `⚠️ MOT Passed With ${mot.latestAdvisories.length} Advisory Item(s) — Ask If Fixed`;
      }

      const currentItems = [...(mot.latestFailures || []), ...(mot.latestAdvisories || [])];
      const latestItemsHtml =
        currentItems.length > 0
          ? `
        <div style="margin:10px 0 6px;font-size:0.8rem;font-weight:800;color:#fde68a;">
          Items on Latest MOT (${escapeHtml(mot.latestDateUk)}):
        </div>
        <ul class="mot-adv-list">
          ${currentItems.map((it) => `<li>${escapeHtml(it)}</li>`).join("")}
        </ul>
      `
          : `
        <div style="margin:6px 0 10px;font-size:0.83rem;color:#a7f3d0;">
          Nothing flagged on the latest MOT test (${escapeHtml(mot.latestDateUk)} at ${v.mileage.toLocaleString()} miles) — passed with zero advisories or defects.
        </div>
      `;

      const plateSwapText =
        mot.previousPlates && mot.previousPlates.length > 0
          ? `⚠️ Was: ${escapeHtml(mot.previousPlates.join(", "))}`
          : "✅ Same plate on all MOTs";

      const recallText =
        xref.recallStatus && xref.recallStatus.toLowerCase() === "yes"
          ? "🚨 Outstanding Recall!"
          : xref.recallStatus && xref.recallStatus.toLowerCase() === "no"
          ? "✅ No open recalls"
          : "Check GOV.UK Recalls";

      const dvlaBoxesHtml = xref.dvla
        ? `
          <div class="xref-box">
            <small>Road Tax Status</small>
            <strong>${escapeHtml(xref.dvla.taxStatus || "Check GOV.UK")}${xref.dvla.taxDueDateUk ? " (to " + escapeHtml(xref.dvla.taxDueDateUk) + ")" : ""}</strong>
          </div>
          <div class="xref-box">
            <small>Last V5C Logbook Issued</small>
            <strong>${escapeHtml(xref.dvla.lastV5CIssuedUk || "—")}</strong>
          </div>
          <div class="xref-box">
            <small>DVLA Scrap / Export</small>
            <strong style="color:${xref.dvla.markedAsScrapped || xref.dvla.markedForExport ? "#fca5a5" : "#34d399"};">
              ${xref.dvla.markedAsScrapped ? "🚨 SCRAPPED" : xref.dvla.markedForExport ? "⚠️ EXPORTED" : "✅ Clear"}
            </strong>
          </div>
        `
        : "";

      const historyRowsHtml = mot.historyRows
        .map((row) => {
          const deltaStr =
            row.milesDelta !== null
              ? ` <span style="color:#94a3b8;font-weight:600;">(${row.milesDelta >= 0 ? "+" : ""}${row.milesDelta.toLocaleString()} mi)</span>`
              : "";
          const rowItems = [
            ...(row.failures || []).map((f) => `<li style="color:#fca5a5;">❌ Fail: ${escapeHtml(f)}</li>`),
            ...(row.advisories || []).map((a) => `<li>⚠️ Advisory: ${escapeHtml(a)}</li>`)
          ];
          return `
            <div class="mot-row">
              <div class="mot-row-head">
                <span>${escapeHtml(row.dateUk)} · ${row.mileage > 0 ? row.mileage.toLocaleString() + " mi" : "—"}${deltaStr}</span>
                <span class="${row.result === "FAILED" ? "pill-fail" : "pill-pass"}">${escapeHtml(row.result)}</span>
              </div>
              ${
                rowItems.length === 0
                  ? `<div style="color:#6ee7b7;font-size:0.79rem;margin-top:4px;">✅ Clean Pass — Zero advisories recorded</div>`
                  : `<ul class="mot-adv-list" style="margin:6px 0 0;">${rowItems.join("")}</ul>`
              }
            </div>
          `;
        })
        .join("");

      motAndXrefHtml = `
        <div class="mot-card">
          <div style="font-size:0.74rem;font-weight:800;color:#facc15;text-transform:uppercase;margin-bottom:8px;">
            🇬🇧 Official UK MOT Record &amp; V5C Logbook Cross-Reference
          </div>
          <div class="mot-status-banner ${bannerClass}">
            <div>
              <div style="font-weight:900;font-size:0.96rem;">${bannerTitle}</div>
              <div style="font-size:0.8rem;color:#cbd5e1;margin-top:2px;">
                MOT Pass Record: <strong>${mot.passCount} Pass / ${mot.failCount} Fail (${mot.passRatePct}%)</strong>
              </div>
            </div>
            ${
              mot.expiryDateUk
                ? `<div style="text-align:right;"><small style="display:block;font-size:0.68rem;color:#cbd5e1;text-transform:uppercase;">MOT Expires</small><strong style="font-size:0.95rem;">${escapeHtml(mot.expiryDateUk)}</strong></div>`
                : ""
            }
          </div>

          ${latestItemsHtml}

          <div style="font-size:0.75rem;font-weight:800;color:#94a3b8;text-transform:uppercase;margin-top:10px;">
            🔎 Cross-Reference Against Seller's Advert &amp; V5C Logbook:
          </div>
          <div class="xref-grid">
            <div class="xref-box">
              <small>Recorded Colour</small>
              <strong>${escapeHtml(xref.colour || "Check V5C")}</strong>
            </div>
            <div class="xref-box">
              <small>First Registered (True Age)</small>
              <strong>${escapeHtml(xref.firstUsedDateUk || String(v.year))}</strong>
            </div>
            <div class="xref-box">
              <small>Engine &amp; Fuel on Record</small>
              <strong>${xref.engineSizeCc ? xref.engineSizeCc + "cc " : ""}${escapeHtml(xref.fuelType || v.fuelType)}</strong>
            </div>
            <div class="xref-box">
              <small>Mileage Clocking Check</small>
              <strong style="color:${mot.mileageConsistent ? "#34d399" : "#fca5a5"};">
                ${mot.mileageConsistent ? `✅ Consistent (${mot.totalTests} MOTs)` : "🚨 DROP DETECTED"}
              </strong>
            </div>
            <div class="xref-box">
              <small>MOT Plate-Swap Check</small>
              <strong>${plateSwapText}</strong>
            </div>
            <div class="xref-box">
              <small>Safety Recall Status</small>
              <strong>${recallText}</strong>
            </div>
            ${dvlaBoxesHtml}
          </div>

          <details class="mot-history-details">
            <summary>📋 View Full Year-by-Year MOT History &amp; Past Advisories (${mot.totalTests} test${mot.totalTests === 1 ? "" : "s"}) ▾</summary>
            ${historyRowsHtml}
          </details>
        </div>
      `;
    }

    // ========================================================================
    // 2. MECHANICAL COST CLIFFS (WET BELTS, CHAINS, GEARBOX, DPF, TAX)
    // ========================================================================
    let detailsHtml = "";

    if (!isUnlocked) {
      detailsHtml = `
        <div class="paywall-wrap">
          <div class="blurred-teaser">
            <div class="cliff-item">
              <strong>MOT Advisories, Cross-Reference, Crash Clues &amp; Mechanical Cliffs</strong>
              <p>Full MOT advisory timeline, plate-swap check, garage repair bills &amp; seller haggling script...</p>
            </div>
          </div>
          <div class="paywall-box">
            <div style="font-size:0.75rem;font-weight:800;color:#facc15;text-transform:uppercase;margin-bottom:4px;">Free Check Used</div>
            <h3 style="margin:0 0 8px;">Unlock Full MOT Cross-Check, ${report.cliffCount} Cost Trap(s) &amp; Haggling Script</h3>
            <ul class="paywall-perks">
              <li>✅ Full UK MOT advisory timeline, clocking &amp; crash-clue scan</li>
              <li>✅ Hidden mechanical bill breakdown (${exposureStr})</li>
              <li>✅ Tailored 5-point phone forecourt viewing checklist</li>
              <li>✅ Ready-to-send seller message${report.suggestedDiscount > 0 ? ` to knock <strong>~£${report.suggestedDiscount.toLocaleString()}</strong> off asking price` : ""}</li>
              <li>✅ <strong>Unlimited checks for 30 days</strong> on Phone &amp; Mozilla Firefox Add-On</li>
            </ul>
            <button type="button" id="inlineUnlockBtn" class="btn-primary" style="max-width:360px;">
              Unlock 30-Day Pass — ${cfg.passPriceText} Once →
            </button>
            <div style="margin-top:8px;font-size:0.78rem;color:#94a3b8;">
              Single payment · No subscription · Instant unlock
            </div>
          </div>
        </div>
      `;
    } else if (report.cliffCount === 0) {
      detailsHtml = `
        <div class="cliff-item" style="border-color:rgba(16,185,129,0.45);">
          <strong style="color:#34d399;">✅ Clean Mechanical Spec — Avoids Notorious Wet-Belt &amp; Chain Traps</strong>
          <p class="cliff-reason" style="margin-top:6px;">
            This engine/age/mileage combination avoids the UK's high-failure wet-belt and rear-chain traps. Still check the Accident / Cat C-D-S-N Cross-Check and 5-point viewing list below before paying a deposit.
          </p>
        </div>
      `;
    } else {
      detailsHtml = `
        <div class="cliff-list">
          ${report.cliffs
            .map(
              (c) => `
            <div class="cliff-item">
              <div class="cliff-head">
                <div>
                  <span class="badge-sev ${c.severity}">${escapeHtml(c.category)}</span>
                  <div style="font-weight:800;font-size:1rem;margin-top:5px;">${escapeHtml(c.title)}</div>
                </div>
                <div class="cliff-cost">£${c.costMin.toLocaleString()}–£${c.costMax.toLocaleString()}</div>
              </div>
              <div class="cliff-due">⏱ ${escapeHtml(c.dueText)}</div>
              <p class="cliff-reason">${escapeHtml(c.plainReason)}</p>
              <div class="cliff-proof"><strong>Ask Seller:</strong> ${escapeHtml(c.proofToAsk)}</div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }

    // ========================================================================
    // 3. ACCIDENT, SALVAGE CLUES & CAT S / CAT N (OLD CAT C / CAT D) CARD
    // ========================================================================
    let writeOffCardHtml = "";
    if (isUnlocked) {
      const hasClues = mot.crashClues && mot.crashClues.length > 0;
      const clueScanHtml = mot.hasMotData
        ? hasClues
          ? `
          <div style="background:rgba(245,158,11,0.14);border:1px solid rgba(245,158,11,0.45);border-radius:10px;padding:10px 12px;margin-bottom:10px;">
            <strong style="color:#fde68a;font-size:0.86rem;">⚠️ Cross-Reference Alert — ${mot.crashClues.length} Clue(s) Spotted in MOT History:</strong>
            <ul class="mot-adv-list" style="margin:6px 0 0;">
              ${mot.crashClues.map((cl) => `<li>${escapeHtml(cl)}</li>`).join("")}
            </ul>
          </div>
        `
          : `
          <div style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.4);border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:0.84rem;color:#a7f3d0;">
            <strong>✅ Clean MOT Crash &amp; Gap Scan:</strong> Zero chassis/subframe damage advisories, SRS airbag lamp faults, plate swaps, or 16+ month off-road salvage gaps spotted across ${mot.totalTests} MOT test(s).
          </div>
        `
        : "";

      writeOffCardHtml = `
        <div class="writeoff-card">
          <div style="font-size:0.74rem;font-weight:800;color:#38bdf8;text-transform:uppercase;margin-bottom:6px;">
            🛡 Accident, Cat S / Cat N (Old Cat C / Cat D) &amp; Finance Cross-Check
          </div>
          ${clueScanHtml}
          <div style="font-size:0.83rem;color:#cbd5e1;line-height:1.5;margin-bottom:12px;">
            <div style="margin-bottom:5px;">
              • <strong>Cat S &amp; Old Cat C (Structural Write-Off):</strong> Check the front cover of the seller's paper <strong>V5C logbook ("3. Special Notes")</strong> — structural write-offs are permanently printed there.
            </div>
            <div>
              • <strong>Cat N &amp; Old Cat D + Unpaid Finance + Stolen Check:</strong> Non-structural insurance write-offs (Cat D / Cat N), salvage auction photos, and outstanding finance are <em>not</em> held on MOT records or V5C logbooks — run a final MIAFTR insurance check on the 1 car you decide to buy:
            </div>
          </div>
          <a href="${escapeHtml(affUrl)}" target="_blank" rel="noopener" class="btn-affiliate" style="width:100%;">
            🛡 Check Official Cat C / D / S / N Write-Off, Salvage Photos &amp; Finance →
          </a>
        </div>
      `;
    }

    const checklistHtml =
      isUnlocked && Array.isArray(report.forecourtChecklist)
        ? `
      <div class="checklist-card">
        <h3>
          <span>🔍 5-Point Forecourt Viewing Checklist</span>
          <span id="checklistProgress" style="font-size:0.78rem;color:#94a3b8;">0/${report.forecourtChecklist.length} checked</span>
        </h3>
        ${report.forecourtChecklist
          .map(
            (item, idx) => `
          <label class="check-row">
            <input type="checkbox" class="forecourt-cb" data-idx="${idx}" />
            <span>${escapeHtml(item)}</span>
          </label>
        `
          )
          .join("")}
      </div>
    `
        : "";

    const regBadge =
      v.registration && v.registration !== "CAR CHECK" && v.registration !== "ADVERT CHECK" && v.registration !== "SPEC CHECK"
        ? `${escapeHtml(v.registration)} · `
        : "";

    const haggleHtml = isUnlocked
      ? `
      <div class="haggle-card">
        <h3>
          <span>💬 Seller Haggling Message</span>
          ${
            report.suggestedDiscount > 0
              ? `<span style="font-size:0.8rem;color:#facc15;">Target ~£${report.suggestedDiscount.toLocaleString()} Off</span>`
              : ""
          }
        </h3>
        <textarea id="haggleText" class="haggle-textarea" readonly>${escapeHtml(report.hagglingScript)}</textarea>
        <div class="action-row">
          <button type="button" id="copyScriptBtn" class="btn-secondary" style="border-color:#facc15;color:#facc15;">
            📋 Copy Seller Message
          </button>
          <button type="button" id="printReportBtn" class="btn-secondary">
            🖨 Save / Print PDF Report
          </button>
        </div>
      </div>
    `
      : `
      <div style="margin-top:14px;">
        <a href="${escapeHtml(affUrl)}" target="_blank" rel="noopener" class="btn-affiliate" style="width:100%;">
          🛡 Check Official Cat C / D / S / N Write-Off &amp; Finance →
        </a>
      </div>
    `;

    resultsSection.innerHTML = `
      <div class="verdict-banner ${report.overallVerdict}">
        <div>
          <div style="font-size:0.76rem;font-weight:800;color:#facc15;text-transform:uppercase;">
            ${regBadge}${escapeHtml(v.carLabel)} · ${v.mileage.toLocaleString()} miles · ${escapeHtml(v.transmission)}
          </div>
          <div class="verdict-title">${escapeHtml(report.verdictLabel)}</div>
          <div class="verdict-sub">
            ${report.cliffCount} mechanical cliff(s) flagged${mot.hasMotData ? ` · ${mot.isLatestClean ? "Clean Latest MOT" : mot.latestAdvisories.length + " MOT advisory item(s)"}` : ""} · Avg ${v.avgAnnualMiles.toLocaleString()} mi/yr
          </div>
        </div>
        <div class="exposure-box">
          <div class="exposure-label">Unverified Bill Exposure</div>
          <div class="exposure-amount">${exposureStr}</div>
        </div>
      </div>
      ${offerStripHtml}
      ${motAndXrefHtml}
      ${detailsHtml}
      ${writeOffCardHtml}
      ${checklistHtml}
      ${haggleHtml}
    `;

    const cbs = resultsSection.querySelectorAll(".forecourt-cb");
    const prog = document.getElementById("checklistProgress");
    if (cbs.length && prog) {
      cbs.forEach((cb) => {
        cb.addEventListener("change", () => {
          const done = Array.from(cbs).filter((x) => x.checked).length;
          prog.textContent =
            done === cbs.length
              ? "✅ All 5 Checks Verified!"
              : `${done}/${cbs.length} checked`;
          prog.style.color = done === cbs.length ? "#34d399" : "#94a3b8";
        });
      });
    }

    const copyBtn = document.getElementById("copyScriptBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(report.hagglingScript);
        copyBtn.textContent = "✅ Copied! Paste into AutoTrader / WhatsApp";
        setTimeout(() => {
          copyBtn.textContent = "📋 Copy Seller Message";
        }, 2200);
      });
    }

    const printBtn = document.getElementById("printReportBtn");
    if (printBtn) {
      printBtn.addEventListener("click", () => window.print());
    }

    const inlineUnlockBtn = document.getElementById("inlineUnlockBtn");
    if (inlineUnlockBtn) {
      inlineUnlockBtn.addEventListener("click", () => passModal.classList.add("open"));
    }
  }
})();
