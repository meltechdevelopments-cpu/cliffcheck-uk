const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".zip": "application/zip"
};

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const parsed = url.parse(req.url, true);

  // Local API mock matching Cloudflare Pages Functions (/api/check-plate & /api/verify-pass)
  if (parsed.pathname === "/api/check-plate" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({
        mode: "DEMO_FALLBACK",
        message: "Add free DVSA MOT API keys in Cloudflare Pages Settings to enable live plate lookup on all 42M UK cars."
      })
    );
  }

  if (parsed.pathname === "/api/verify-pass" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const data = JSON.parse(body || "{}");
        const code = String(data.licenseKey || "").trim();
        if (code.toUpperCase() === "VIP-TEST-2026") {
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              valid: true,
              expiresAt: Date.now() + 30 * 86400000,
              plan: "30-Day Car-Hunter Pass"
            })
          );
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            valid: false,
            error: "In preview mode, use VIP-TEST-2026 (live site checks real Lemon Squeezy customer keys automatically)."
          })
        );
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ valid: false, error: "Bad request" }));
      }
    });
    return;
  }

  // Serve static files from /public
  let reqPath = parsed.pathname === "/" ? "/index.html" : parsed.pathname;
  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, "");
  const fullPath = path.join(PUBLIC_DIR, safePath);

  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not Found");
    }
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(fullPath).pipe(res);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`CliffCheck UK Live Preview running at http://0.0.0.0:${PORT}`);
});
