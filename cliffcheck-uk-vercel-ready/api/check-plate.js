// ============================================================================
// VERCEL SERVERLESS FUNCTION (£0/MO HOBBY TIER) — LIVE UK DVSA MOT PLATE LOOKUP
// Endpoint: GET /api/check-plate?reg=AB18XYZ
// ============================================================================
let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getDvsaBearerToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt - 60000) {
    return cachedToken;
  }
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.MOT_CLIENT_ID,
    client_secret: process.env.MOT_CLIENT_SECRET,
    scope: process.env.MOT_SCOPE || "https://tapi.dvsa.gov.uk/.default"
  });

  const resp = await fetch(process.env.MOT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });

  if (!resp.ok) throw new Error("DVSA OAuth failed: " + resp.status);
  const data = await resp.json();
  cachedToken = data.access_token;
  cachedTokenExpiresAt = now + (Number(data.expires_in) || 3500) * 1000;
  return cachedToken;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const rawReg = String(req.query.reg || "").replace(/\s+/g, "").toUpperCase();

  if (!rawReg || rawReg.length < 2 || rawReg.length > 8) {
    return res.status(400).json({ error: "Please enter a valid UK registration plate." });
  }

  if (
    !process.env.MOT_API_KEY ||
    !process.env.MOT_CLIENT_ID ||
    !process.env.MOT_CLIENT_SECRET ||
    !process.env.MOT_TOKEN_URL
  ) {
    return res.status(200).json({
      mode: "DEMO_FALLBACK",
      message: "DVSA live API keys not yet added in Vercel Environment Variables."
    });
  }

  try {
    const token = await getDvsaBearerToken();
    const dvsaResp = await fetch(
      `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${encodeURIComponent(rawReg)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-API-Key": process.env.MOT_API_KEY,
          Accept: "application/json"
        }
      }
    );

    if (dvsaResp.status === 404) {
      return res.status(404).json({
        error: "Plate not found in DVSA MOT register (cars under 3 years old may not have an MOT yet — use Quick Spec tab!)."
      });
    }
    if (!dvsaResp.ok) {
      return res.status(502).json({ error: "DVSA lookup error (" + dvsaResp.status + ")" });
    }

    const data = await dvsaResp.json();
    const vehicle = Array.isArray(data) ? data[0] : data;
    const motTests = Array.isArray(vehicle.motTests)
      ? vehicle.motTests.map((t) => ({
          date: t.completedDate,
          mileage: Number(t.odometerValue) || 0,
          result: t.testResult,
          expiryDate: t.expiryDate,
          advisories: Array.isArray(t.defects) ? t.defects.map((d) => d.text).filter(Boolean) : []
        }))
      : [];

    const firstUsed = vehicle.firstUsedDate || vehicle.registrationDate || vehicle.manufactureDate || "";
    return res.status(200).json({
      mode: "LIVE_DVSA",
      vehicle: {
        registration: rawReg,
        make: vehicle.make || "",
        model: vehicle.model || "",
        derivative: "",
        year: firstUsed ? parseInt(String(firstUsed).slice(0, 4), 10) : 2018,
        firstUsedDate: firstUsed,
        fuelType: vehicle.fuelType || "Petrol",
        engineSizeCc: Number(vehicle.engineSize) || 0,
        primaryColour: vehicle.primaryColour || "",
        mileage: motTests.length > 0 ? motTests[0].mileage : 0,
        motTests
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Lookup failed" });
  }
}
