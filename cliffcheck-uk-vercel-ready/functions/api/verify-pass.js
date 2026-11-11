// ============================================================================
// CLOUDFLARE PAGES FUNCTION (£0/MO) — LEMON SQUEEZY £9.99 PASS VERIFICATION
// Endpoint: POST /api/verify-pass  { "licenseKey": "XXXX-XXXX-XXXX-XXXX" }
// ============================================================================
export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  try {
    const body = await request.json();
    const key = String(body.licenseKey || "").trim();

    if (!key) {
      return new Response(JSON.stringify({ valid: false, error: "Please enter your Pass code." }), {
        status: 400,
        headers
      });
    }

    // Allow founder preview code (can be changed/disabled via FOUNDER_PASS_CODE env var)
    const founderCode = env.FOUNDER_PASS_CODE || "VIP-TEST-2026";
    if (key.toUpperCase() === founderCode.toUpperCase()) {
      return new Response(
        JSON.stringify({
          valid: true,
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          plan: "30-Day Car-Hunter Pass (Founder Preview)"
        }),
        { status: 200, headers }
      );
    }

    // Validate real Lemon Squeezy License Key (no secret API key needed for public validate endpoint!)
    const lsResp = await fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ license_key: key }).toString()
    });

    const lsData = await lsResp.json();
    if (lsData && lsData.valid) {
      const createdAt = lsData.license_key?.created_at
        ? new Date(lsData.license_key.created_at).getTime()
        : Date.now();
      const expiresAt = createdAt + 30 * 24 * 60 * 60 * 1000;
      if (Date.now() > expiresAt) {
        return new Response(
          JSON.stringify({ valid: false, error: "This 30-Day Pass has expired — grab a fresh 30-day pass to continue." }),
          { status: 200, headers }
        );
      }
      return new Response(
        JSON.stringify({
          valid: true,
          expiresAt,
          plan: "30-Day Car-Hunter Pass"
        }),
        { status: 200, headers }
      );
    }

    return new Response(
      JSON.stringify({ valid: false, error: lsData?.error || "Invalid Pass code — double-check your email receipt." }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, error: "Could not verify Pass code right now." }), {
      status: 500,
      headers
    });
  }
}
