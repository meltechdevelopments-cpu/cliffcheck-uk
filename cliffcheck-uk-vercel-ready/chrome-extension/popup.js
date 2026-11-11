(function () {
  const cfg = window.CLIFFCHECK_CONFIG;
  const statusBox = document.getElementById("statusBox");
  const keyInput = document.getElementById("keyInput");
  const activateBtn = document.getElementById("activateBtn");
  const msg = document.getElementById("msg");
  const buyBtn = document.getElementById("buyBtn");

  buyBtn.href = cfg.checkoutUrl;

  function refreshStatus() {
    chrome.storage.local.get(["cliffcheck_pass", "cliffcheck_ext_used"], (st) => {
      const pass = st.cliffcheck_pass;
      if (pass && pass.valid && pass.expiresAt > Date.now()) {
        const days = Math.ceil((pass.expiresAt - Date.now()) / 86400000);
        statusBox.innerHTML = `<strong style="color:#34d399;">✅ 30-Day Pass Active</strong><br><span style="color:#94a3b8;">${days} day(s) of unlimited AutoTrader, eBay &amp; CarGurus checks left.</span>`;
        buyBtn.style.display = "none";
      } else {
        const left = Math.max(0, cfg.freeChecksAllowedExtension - (st.cliffcheck_ext_used || 0));
        statusBox.innerHTML = `<strong>🎁 ${left} Free Full Listing Check(s) Left</strong><br><span style="color:#94a3b8;">Browse any car on AutoTrader.co.uk, eBay Motors or CarGurus.co.uk to see the floating CliffCheck card.</span>`;
      }
    });
  }

  refreshStatus();

  activateBtn.addEventListener("click", async () => {
    const code = keyInput.value.trim();
    if (!code) return;
    msg.textContent = "Verifying Polar Pass code...";
    msg.style.color = "#facc15";

    try {
      const result = await cfg.validatePolarKey(code);
      if (result && result.valid) {
        chrome.storage.local.set({ cliffcheck_pass: result }, () => {
          msg.style.color = "#34d399";
          msg.textContent = "✅ Pass Activated! Reload your AutoTrader tab.";
          refreshStatus();
        });
      } else {
        msg.style.color = "#f87171";
        msg.textContent = "❌ " + (result.error || "Invalid Pass code.");
      }
    } catch {
      msg.style.color = "#f87171";
      msg.textContent = "Network error verifying Polar code.";
    }
  });
})();
