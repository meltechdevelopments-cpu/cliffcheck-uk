// ============================================================================
// CLIFFCHECK UK — CHROME ADD-ON OVERLAY SCRIPT (AutoTrader, eBay, CarGurus)
// ============================================================================
(function () {
  const cfg = window.CLIFFCHECK_CONFIG;
  const engine = window.CliffEngine;
  if (!cfg || !engine) return;

  let lastParsedUrl = "";

  function extractVehicleFromPage() {
    let data = {
      registration: "",
      make: "",
      model: "",
      derivative: "",
      year: 0,
      fuelType: "",
      engineSizeCc: 0,
      transmission: "",
      mileage: 0,
      askingPrice: 0,
      motTests: []
    };

    // 1. Check JSON-LD Vehicle schema (used by AutoTrader UK, CarGurus & our Demo Page!)
    const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const s of ldScripts) {
      try {
        const parsed = JSON.parse(s.textContent);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (item && (item["@type"] === "Vehicle" || item["@type"] === "Car" || item["@type"] === "Product")) {
            data.make = item.brand?.name || item.manufacturer || data.make;
            data.model = item.model || data.model;
            data.derivative = item.name || item.vehicleConfiguration || data.derivative;
            data.year = parseInt(item.vehicleModelDate || item.productionDate || "0", 10) || data.year;
            data.fuelType = item.fuelType || data.fuelType;
            data.transmission = item.vehicleTransmission || data.transmission;
            if (item.mileageFromOdometer) {
              const mVal =
                typeof item.mileageFromOdometer === "object"
                  ? item.mileageFromOdometer.value
                  : item.mileageFromOdometer;
              data.mileage = parseInt(String(mVal).replace(/[^0-9]/g, ""), 10) || data.mileage;
            }
            if (item.vehicleEngine && item.vehicleEngine.engineDisplacement) {
              const disp = String(item.vehicleEngine.engineDisplacement.value || item.vehicleEngine.engineDisplacement);
              const num = parseFloat(disp);
              if (num > 500) data.engineSizeCc = Math.round(num);
              else if (num > 0) data.engineSizeCc = Math.round(num * 1000);
            }
            if (item.offers && item.offers.price) {
              data.askingPrice = parseInt(String(item.offers.price).replace(/[^0-9]/g, ""), 10) || data.askingPrice;
            }
            if (item.vehicleIdentificationNumber && item.vehicleIdentificationNumber.length <= 8) {
              data.registration = item.vehicleIdentificationNumber;
            }
          }
        }
      } catch {}
    }

    // 2. Fallback / Enrich from visible page title & spec text
    const h1 = document.querySelector("h1")?.innerText || document.title || "";
    const bodyText = document.body?.innerText?.slice(0, 6000) || "";

    if (!data.make) {
      const makes = [
        "LAND ROVER", "RANGE ROVER", "MERCEDES-BENZ", "MERCEDES", "VOLKSWAGEN",
        "FORD", "PEUGEOT", "VAUXHALL", "CITROEN", "CITROËN", "BMW", "AUDI",
        "NISSAN", "RENAULT", "HONDA", "TOYOTA", "HYUNDAI", "KIA", "SKODA",
        "ŠKODA", "SEAT", "VOLVO", "JAGUAR", "MINI", "MAZDA", "FIAT"
      ];
      const upperH1 = h1.toUpperCase();
      for (const mk of makes) {
        if (upperH1.includes(mk)) {
          data.make = mk === "MERCEDES-BENZ" ? "MERCEDES" : mk;
          data.model = upperH1.replace(mk, "").trim().split(/\s+/).slice(0, 2).join(" ");
          break;
        }
      }
    }

    if (!data.derivative) data.derivative = h1;

    if (!data.year) {
      const ym = bodyText.match(/\b(200[5-9]|201[0-9]|202[0-6])\s*\(\d{2}\s*reg\)/i) || h1.match(/\b(200[5-9]|201[0-9]|202[0-6])\b/);
      if (ym) data.year = parseInt(ym[1], 10);
    }

    if (!data.mileage) {
      const mm = bodyText.match(/\b([0-9]{1,3}(?:,[0-9]{3})+)\s*miles\b/i);
      if (mm) data.mileage = parseInt(mm[1].replace(/,/g, ""), 10);
    }

    if (!data.engineSizeCc) {
      const lm = `${h1} ${bodyText}`.match(/\b([0-4]\.[0-9])\s*(?:L|litre|T|TSI|TDI|EcoBoost|PureTech|EcoBlue|d|i)\b/i);
      if (lm) data.engineSizeCc = Math.round(parseFloat(lm[1]) * 1000);
    }

    if (!data.fuelType) {
      if (/\bDiesel\b/i.test(bodyText)) data.fuelType = "Diesel";
      else if (/\bHybrid\b/i.test(bodyText)) data.fuelType = "Hybrid Electric";
      else if (/\bElectric\b/i.test(bodyText) && !data.engineSizeCc) data.fuelType = "Electric";
      else data.fuelType = "Petrol";
    }

    if (!data.transmission) {
      data.transmission = /\b(Automatic|Auto|DSG|S tronic|Powershift)\b/i.test(`${h1} ${bodyText}`)
        ? "Automatic"
        : "Manual";
    }

    if (!data.askingPrice) {
      const pm = bodyText.match(/£([0-9]{1,3}(?:,[0-9]{3})+)/);
      if (pm) data.askingPrice = parseInt(pm[1].replace(/,/g, ""), 10);
    }

    return data.make ? data : null;
  }

  function getStorage(cb) {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["cliffcheck_pass", "cliffcheck_ext_used"], cb);
    } else {
      cb({
        cliffcheck_pass: JSON.parse(localStorage.getItem("cliffcheck_pass_v1") || "null"),
        cliffcheck_ext_used: parseInt(localStorage.getItem("cliffcheck_ext_used") || "0", 10) || 0
      });
    }
  }

  function setStorage(obj) {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(obj);
    } else {
      if (obj.cliffcheck_pass) localStorage.setItem("cliffcheck_pass_v1", JSON.stringify(obj.cliffcheck_pass));
      if (typeof obj.cliffcheck_ext_used === "number") {
        localStorage.setItem("cliffcheck_ext_used", String(obj.cliffcheck_ext_used));
      }
    }
  }

  function injectWidget() {
    if (location.href === lastParsedUrl && document.getElementById("cliffcheck-floating-widget")) return;
    const veh = extractVehicleFromPage();
    if (!veh) return;
    lastParsedUrl = location.href;

    const existing = document.getElementById("cliffcheck-floating-widget");
    if (existing) existing.remove();

    const report = engine.analyzeVehicle(veh);

    getStorage((st) => {
      const pass = st.cliffcheck_pass;
      const isPro = Boolean(pass && pass.valid && pass.expiresAt > Date.now());
      const used = Number(st.cliffcheck_ext_used) || 0;
      const isUnlocked = isPro || used < cfg.freeChecksAllowedExtension;

      if (!isPro && used < cfg.freeChecksAllowedExtension) {
        setStorage({ cliffcheck_ext_used: used + 1 });
      }

      renderFloatingCard(report, isUnlocked);
    });
  }

  function renderFloatingCard(report, isUnlocked) {
    const v = report.vehicleSummary;
    const affUrl = cfg.buildHistoryAffiliateUrl(v.registration);
    const isDanger = report.overallVerdict === "CRITICAL" || report.overallVerdict === "HIGH";
    const accent = report.cliffCount === 0 ? "#10b981" : isDanger ? "#ef4444" : "#f59e0b";
    const exposure =
      report.cliffCount === 0
        ? "£0 Major Cliffs"
        : `£${report.totalExposureMin.toLocaleString()}–£${report.totalExposureMax.toLocaleString()}`;

    const root = document.createElement("div");
    root.id = "cliffcheck-floating-widget";
    root.style.cssText = `
      position: fixed;
      bottom: 18px;
      right: 18px;
      width: 375px;
      max-width: calc(100vw - 24px);
      background: #0f172a;
      color: #f8fafc;
      border: 2px solid ${accent};
      border-radius: 14px;
      box-shadow: 0 20px 45px rgba(0,0,0,0.55);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      z-index: 2147483640;
      overflow: hidden;
    `;

    root.innerHTML = `
      <div id="cc-header" style="padding:12px 14px;background:#16213a;display:flex;justify-content:space-between;align-items:center;cursor:pointer;border-bottom:1px solid #283655;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="background:#facc15;color:#0f172a;font-weight:900;font-size:11px;padding:3px 6px;border-radius:4px;">GB</span>
          <div>
            <div style="font-size:12px;font-weight:800;color:#facc15;">CliffCheck · ${report.cliffCount} Cost Trap(s)</div>
            <div style="font-size:13px;font-weight:900;">${exposure} Unverified Risk</div>
          </div>
        </div>
        <button id="cc-toggle" style="background:#283655;border:none;color:#fff;border-radius:6px;padding:5px 9px;font-size:11px;font-weight:700;cursor:pointer;">Details ▾</button>
      </div>
      <div id="cc-body" style="padding:14px;max-height:410px;overflow-y:auto;">
        <div style="font-size:12px;color:#94a3b8;margin-bottom:8px;">
          Detected: <strong style="color:#fff;">${v.carLabel}</strong> · ${v.mileage.toLocaleString()} mi · ${v.transmission}
        </div>
        ${
          report.cliffCount === 0
            ? `<div style="background:rgba(16,185,129,0.14);border:1px solid #10b981;padding:10px;border-radius:9px;font-size:12.5px;">
                ✅ <strong>Clean Engine Spec:</strong> Avoids notorious wet-belt &amp; rear-chain traps. Still verify service receipts!
              </div>`
            : isUnlocked
            ? report.cliffs
                .map(
                  (c) => `
                <div style="background:#16213a;border:1px solid #283655;border-radius:9px;padding:10px;margin-bottom:8px;">
                  <div style="display:flex;justify-content:space-between;gap:6px;font-size:12.5px;font-weight:800;">
                    <span style="color:#fde047;">⚠ ${c.title}</span>
                    <span style="color:#fca5a5;white-space:nowrap;">£${c.costMin}–£${c.costMax}</span>
                  </div>
                  <div style="font-size:11.5px;color:#cbd5e1;margin-top:4px;">${c.dueText}</div>
                  <div style="font-size:11.5px;color:#94a3b8;margin-top:4px;"><strong>Ask Seller:</strong> ${c.proofToAsk}</div>
                </div>
              `
                )
                .join("") +
              `<button id="cc-copy-haggle" style="width:100%;background:#facc15;color:#0f172a;border:none;border-radius:8px;padding:10px;font-weight:900;font-size:12.5px;cursor:pointer;margin-top:4px;">
                📋 Copy Seller Haggling Message (~£${report.suggestedDiscount} Off)
              </button>`
            : `<div style="background:#16213a;border:1px solid #facc15;border-radius:10px;padding:12px;text-align:center;">
                <div style="font-weight:800;font-size:13px;margin-bottom:4px;">🔒 Unlock All ${report.cliffCount} Cost Cliffs &amp; Haggling Script</div>
                <div style="font-size:11.5px;color:#cbd5e1;margin-bottom:10px;">Unlimited AutoTrader + Phone checks for 30 days — £9.99 once.</div>
                <a href="${cfg.checkoutUrl}" target="_blank" style="display:block;background:#facc15;color:#0f172a;text-decoration:none;padding:9px;border-radius:8px;font-weight:900;font-size:12.5px;">
                  Unlock 30-Day Pass (£9.99) →
                </a>
              </div>`
        }
        <a href="${affUrl}" target="_blank" rel="noopener" style="display:block;margin-top:8px;text-align:center;background:rgba(16,185,129,0.16);border:1px solid rgba(16,185,129,0.45);color:#6ee7b7;text-decoration:none;padding:9px;border-radius:8px;font-weight:800;font-size:12px;">
          🛡 Check Stolen / Finance / Write-Off History →
        </a>
      </div>
    `;

    document.body.appendChild(root);

    const bodyEl = root.querySelector("#cc-body");
    const toggleBtn = root.querySelector("#cc-toggle");
    root.querySelector("#cc-header").addEventListener("click", () => {
      const hidden = bodyEl.style.display === "none";
      bodyEl.style.display = hidden ? "block" : "none";
      toggleBtn.textContent = hidden ? "Hide ▴" : "Details ▾";
    });

    const copyBtn = root.querySelector("#cc-copy-haggle");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(report.hagglingScript);
        copyBtn.textContent = "✅ Haggling Script Copied!";
        setTimeout(() => {
          copyBtn.textContent = `📋 Copy Seller Haggling Message (~£${report.suggestedDiscount} Off)`;
        }, 2200);
      });
    }
  }

  injectWidget();
  setInterval(injectWidget, 2500);
})();
