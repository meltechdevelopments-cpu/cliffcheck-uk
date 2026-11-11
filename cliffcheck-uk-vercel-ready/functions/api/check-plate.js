// ============================================================================
// CLOUDFLARE PAGES FUNCTION (£0/MO FREE TIER) — LIVE UK DVSA MOT PLATE LOOKUP
// Endpoint: GET /api/check-plate?reg=AB18XYZ
// Add these 5 free DVSA secrets in Cloudflare Pages -> Settings -> Environment Variables:
//   MOT_API_KEY, MOT_CLIENT_ID, MOT_CLIENT_SECRET, MOT_SCOPE, MOT_TOKEN_URL
// ============================================================================
let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getDvsaBearerToken(env) {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt - 60000) {
    return cachedToken;
  }
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.MOT_CLIENT_ID,
    client_secret: env.MOT_CLIENT_SECRET,
    scope: env.MOT_SCOPE || "https://tapi.dvsa.gov.uk/.default"
  });

  const resp = await fetch(env.MOT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });

  if (!resp.ok) {
    throw new Error("DVSA OAuth token request failed: " + resp.status);
  }
  const data = await resp.json();
  cachedToken = data.access_token;
  cachedTokenExpiresAt = now + (Number(data.expires_in) || 3500) * 1000;
  return cachedToken;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const rawReg = (url.searchParams.get("reg") || "").replace(/\s+/g, "").toUpperCase();

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  if (!rawReg || rawReg.length < 2 || rawReg.length > 8) {
    return new Response(JSON.stringify({ error: "Please enter a valid UK registration plate." }), {
      status: 400,
      headers
    });
  }

  // If DVSA keys aren't added yet, tell the frontend cleanly so Demo / Quick-Spec mode kicks in
  if (!env.MOT_API_KEY || !env.MOT_CLIENT_ID || !env.MOT_CLIENT_SECRET || !env.MOT_TOKEN_URL) {
    return new Response(
      JSON.stringify({
        mode: "DEMO_FALLBACK",
        message: "DVSA live API keys not yet added in Cloudflare Settings — using built-in UK vehicle demo / Quick-Spec mode."
      }),
      { status: 200, headers }
    );
  }

  try {
    const token = await getDvsaBearerToken(env);
    const dvsaResp = await fetch(
      `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${encodeURIComponent(rawReg)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-API-Key": env.MOT_API_KEY,
          Accept: "application/json"
        }
      }
    );

    if (dvsaResp.status === 404) {
      return new Response(
        JSON.stringify({
          error: "Plate not found in DVSA MOT register (brand-new cars under 3 years old may not have an MOT yet — use Quick Spec tab!)."
        }),
        { status: 404, headers }
      );
    }

    if (!dvsaResp.ok) {
      return new Response(JSON.stringify({ error: "DVSA lookup error (" + dvsaResp.status + ")" }), {
        status: 502,
        headers
      });
    }

    const data = await dvsaResp.json();
    const vehicle = Array.isArray(data) ? data[0] : data;
    const motTests = Array.isArray(vehicle.motTests)
      ? vehicle.motTests.map((t) => ({
          date: t.completedDate,
          mileage: Number(t.odometerValue) || 0,
          result: t.testResult,
          expiryDate: t.expiryDate,
          advisories: Array.isArray(t.defects)
            ? t.defects.map((d) => d.text).filter(Boolean)
            : Array.isArray(t.rfrAndComments)
            ? t.rfrAndComments.map((d) => d.text).filter(Boolean)
            : []
        }))
      : [];

    const latestMileage = motTests.length > 0 ? motTests[0].mileage : 0;
    const firstUsed = vehicle.firstUsedDate || vehicle.registrationDate || vehicle.manufactureDate || "";

    return new Response(
      JSON.stringify({
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
          mileage: latestMileage,
          motTests
        }
      }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Lookup failed" }), {
      status: 500,
      headers
    });
  }
}
