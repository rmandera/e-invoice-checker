// Drives the installed Microsoft Edge through the real page: loads it, runs a check, and reports the outcome.
const puppeteer = require("puppeteer-core");
const fs = require("fs");
// BASE=https://rmandera.github.io/e-invoice-checker/ runs the same checks against the live site.
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find(fs.existsSync);
(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new", args: ["--no-first-run"] });
  let failed = 0;
  for (const [file, want] of [["valid-xrechnung.xml", "valid"], ["broken-xrechnung.xml", "invalid"]]) {
    const page = await browser.newPage();
    if (process.argv.includes("--light")) await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
    await page.evaluateOnNewDocument((l) => { try { localStorage.setItem("lang", l); } catch {} }, process.argv.includes("--en") ? "en" : "de");
    const problems = [];
    page.on("console", (m) => { if (["error", "warning"].includes(m.type())) problems.push(`${m.type()}: ${m.text()}`); });
    page.on("pageerror", (e) => problems.push("pageerror: " + e.message));
    page.on("requestfailed", (r) => problems.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
    const external = [];
    page.on("request", (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith("data:")) external.push(r.url()); });
    const t = Date.now();
    await page.goto(`${BASE}index.html?selftest=${file}`, { waitUntil: "load" });
    let outcome = null;
    try {
      await page.waitForSelector("body[data-selftest]", { timeout: 120000 });
      outcome = JSON.parse(await page.$eval("body", (b) => b.getAttribute("data-selftest")));
    } catch { outcome = { status: "TIMEOUT", note: await page.$eval("#status", (s) => s.textContent) }; }
    const ok = outcome.status === want;
    if (!ok) failed++;
    console.log(`${ok ? "ok  " : "FAIL"} ${file.padEnd(22)} want=${want} got=${outcome.status} errors=${JSON.stringify(outcome.errors || [])} ` +
      `ruleSets=${JSON.stringify(outcome.ruleSets || [])} (${Date.now() - t} ms, ${outcome.note || ""})`);
    if (external.length) { failed++; console.log("  REQUESTS TO OTHER ORIGINS:", external); }
    problems.slice(0, 6).forEach((p) => console.log("   ", p.slice(0, 220)));
    if (process.argv.includes("--shot")) await page.screenshot({ path: `test/shot-${want}.png`, fullPage: true });
    await page.close();
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
