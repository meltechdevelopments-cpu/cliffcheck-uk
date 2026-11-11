// ============================================================================
// VERCEL SERVERLESS FUNCTION (£0/MO) — LIVE UK DVSA MOT + OPTIONAL DVLA VES LOOKUP
// Endpoint: GET /api/check-plate?reg=AB18XYZ
// CommonJS export — works out-of-the-box on all Vercel Node runtimes
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

  if (!resp.ok) {
    throw new Error("DVSA OAuth failed: " + resp.status);
  }
  const data = await resp.json();
  cachedToken = data.access_token;
  cachedTokenExpiresAt = now + (Number(data.expires_in) || 3500) * 1000;
  return cachedToken;
}

async function fetchOptionalDvlaVes(rawReg) {
  if (!process.env.DVLA_VES_API_KEY) return null;
  try {
    const resp = await fetch(
      "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
      {
        method: "POST",
        headers: {
          "x-api-key": process.env.DVLA_VES_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ registrationNumber: rawReg })
      }
    );
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const hasDvsaKeys = Boolean(
    process.env.MOT_API_KEY &&
      process.env.MOT_CLIENT_ID &&
      process.env.MOT_CLIENT_SECRET &&
      process.env.MOT_TOKEN_URL
  );

  if (req.query && req.query.status === "1") {
    return res.status(200).json({
      live: hasDvsaKeys,
      dvlaVes: Boolean(process.env.DVLA_VES_API_KEY)
    });
  }

  const rawReg = String((req.query && req.query.reg) || "")
    .replace(/\s+/g, "")
    .toUpperCase();

  if (!rawReg || rawReg.length < 2 || rawReg.length > 8) {
    return res.status(400).json({ error: "Please enter a valid UK registration plate." });
  }

  if (!hasDvsaKeys) {
    return res.status(200).json({
      mode: "DEMO_FALLBACK",
      message: "Use Car Spec or Paste Advert while plate register syncs."
    });
  }

  try {
    const [token, dvlaData] = await Promise.all([
      getDvsaBearerToken(),
      fetchOptionalDvlaVes(rawReg)
    ]);

    const dvsaResp = await fetch(
      "https://history.mot.api.gov.uk/v1/trade/vehicles/registration/" + encodeURIComponent(rawReg),
      {
        headers: {
          Authorization: "Bearer " + token,
          "X-API-Key": process.env.MOT_API_KEY,
          Accept: "application/json"
        }
      }
    );

    if (dvsaResp.status === 404) {
      return res.status(404).json({
        error: "Plate not found in DVSA MOT register (brand-new cars or unlisted cherished plates — try Select Car tab!)."
      });
    }
    if (!dvsaResp.ok) {
      return res.status(502).json({ error: "DVSA lookup error (" + dvsaResp.status + ")" });
    }

    const data = await dvsaResp.json();
    const vehicle = Array.isArray(data) ? data[0] : data;

    const motTests = Array.isArray(vehicle.motTests)
      ? vehicle.motTests.map((t) => {
          const rawDefects = Array.isArray(t.defects) ? t.defects : [];
          const advisories = rawDefects
            .filter((d) => d && d.text && (d.type === "ADVISORY" || d.type === "MINOR" || !d.type))
            .map((d) => d.text);
          const failures = rawDefects
            .filter((d) => d && d.text && (d.type === "FAIL" || d.type === "MAJOR" || d.type === "DANGEROUS" || d.type === "PRS"))
            .map((d) => (d.dangerous ? "[DANGEROUS] " + d.text : d.text));

          return {
            date: t.completedDate || "",
            mileage: Number(t.odometerValue) || 0,
            unit: t.odometerUnit || "MI",
            result: t.testResult || "",
            expiryDate: t.expiryDate || "",
            regAtTest: t.registrationAtTimeOfTest || "",
            advisories,
            failures,
            allDefects: rawDefects
              .filter((d) => d && d.text)
              .map((d) => ({
                text: d.text,
                type: d.type || "ADVISORY",
                dangerous: Boolean(d.dangerous)
              }))
          };
        })
      : [];

    const firstUsed =
      vehicle.firstUsedDate ||
      vehicle.registrationDate ||
      vehicle.manufactureDate ||
      (dvlaData && dvlaData.monthOfFirstRegistration ? dvlaData.monthOfFirstRegistration + "-01" : "");

    const resolvedYear = firstUsed
      ? parseInt(String(firstUsed).slice(0, 4), 10)
      : (dvlaData && Number(dvlaData.yearOfManufacture)) || 2018;

    return res.status(200).json({
      mode: "LIVE_DVSA",
      vehicle: {
        registration: rawReg,
        make: vehicle.make || (dvlaData && dvlaData.make) || "",
        model: vehicle.model || "",
        derivative: "",
        year: resolvedYear,
        firstUsedDate: firstUsed,
        manufactureDate: vehicle.manufactureDate || "",
        fuelType: vehicle.fuelType || (dvlaData && dvlaData.fuelType) || "Petrol",
        engineSizeCc: Number(vehicle.engineSize) || (dvlaData && Number(dvlaData.engineCapacity)) || 0,
        primaryColour: vehicle.primaryColour || (dvlaData && dvlaData.colour) || "",
        hasOutstandingRecall: vehicle.hasOutstandingRecall || "Unknown",
        mileage: motTests.length > 0 ? motTests[0].mileage : 0,
        dvlaCrossRef: dvlaData
          ? {
              taxStatus: dvlaData.taxStatus || "",
              taxDueDate: dvlaData.taxDueDate || "",
              dateOfLastV5CIssued: dvlaData.dateOfLastV5CIssued || "",
              markedForExport: Boolean(dvlaData.markedForExport),
              markedAsScrapped: Boolean(dvlaData.markedAsScrapped),
              euroStatus: dvlaData.euroStatus || "",
              co2Emissions: dvlaData.co2Emissions || 0,
              artEndDate: dvlaData.artEndDate || ""
            }
          : null,
        motTests
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Lookup failed" });
  }
};
