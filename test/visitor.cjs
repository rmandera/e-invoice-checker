// Uses the page the way a visitor does: picks real files through the file input - including the wrong kinds of
// file people will inevitably try - on a desktop and a phone-sized screen, and checks each gets a sensible answer
// with no script error and no request to another origin.
//   BASE=https://rmandera.github.io/e-invoice-checker/ node test/visitor.cjs
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const os = require("os");
const path = require("path");

const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find(fs.existsSync);
const K = path.join(__dirname, "kosit", "instances", "standard");
const S = path.join(__dirname, "samples");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "checker-visitor-"));
const make = (name, content) => { const p = path.join(tmp, name); fs.writeFileSync(p, content); return p; };
const valid = fs.readFileSync(path.join(S, "valid-xrechnung-ubl.xml"), "utf8");

const CASES = [
  ["official UBL invoice", path.join(K, "01.01a-INVOICE_ubl.xml"), "verdict:valid"],
  ["official CII invoice", path.join(K, "01.01a-INVOICE_uncefact.xml"), "verdict:valid"],
  ["UBL credit note", path.join(S, "valid-xrechnung-creditnote-ubl.xml"), "verdict:valid"],
  ["broken invoice", path.join(S, "broken-no-seller-phone.xml"), "verdict:invalid"],
  ["cut-off XML file", make("truncated.xml", valid.slice(0, Math.floor(valid.length / 2))), "verdict:invalid"],
  ["XML that is not an invoice", make("order.xml", '<?xml version="1.0"?><Order xmlns="urn:example:order"><Id>1</Id></Order>'), "verdict:unsupported"],
  ["text renamed to .xml", make("notes.xml", "hello, this is not xml"), "status:This file is not XML"],
  ["empty file", make("empty.xml", ""), "status:This file is not XML"],
  ["ZUGFeRD PDF (EN 16931)", path.join(__dirname, "zugferd", "valid", "EN16931_Einfach.pdf"), "verdict:valid"],
  ["ZUGFeRD PDF credit note", path.join(__dirname, "zugferd", "valid", "EN16931_Gutschrift.pdf"), "verdict:valid"],
  ["outdated XRechnung 2.1 PDF", path.join(__dirname, "zugferd", "outdated", "XRECHNUNG_Einfach.pdf"), "verdict:invalid"],
  ["ZUGFeRD 1.0 PDF", path.join(__dirname, "zugferd", "zugferd1", "ZUGFeRD_1p0_COMFORT_Einfach.pdf"), "verdict:zugferd1"],
  ["MINIMUM profile PDF", path.join(__dirname, "zugferd", "not-einvoice", "Facture_FR_MINIMUM.pdf"), "verdict:not-einvoice"],
  ["plain PDF without XML", make("invoice.pdf", "%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n"), "status:This PDF contains no XML invoice"],
];

async function outcome(page) {
  const end = Date.now() + 90000;
  while (Date.now() < end) {
    const state = await page.evaluate(() => {
      const r = document.querySelector("#result");
      const v = r && !r.hidden && r.querySelector(".verdict");
      const s = document.querySelector("#status").textContent.trim();
      return v ? "verdict:" + [...v.classList].find((c) => c !== "verdict") : (s && !s.includes("…") ? "status:" + s : null);
    });
    if (state) return state;
    await new Promise((r) => setTimeout(r, 250));
  }
  return "TIMEOUT";
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new", args: ["--no-first-run"] });
  let failed = 0;
  for (const [device, viewport] of [["desktop", { width: 1366, height: 900 }], ["phone", { width: 390, height: 844, isMobile: true, hasTouch: true }]]) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("lang", "en"); } catch {} });
    const problems = [];
    page.on("pageerror", (e) => problems.push("script error: " + e.message));
    page.on("request", (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) problems.push("request to other origin: " + r.url()); });
    await page.goto(BASE, { waitUntil: "load" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) problems.push("page is wider than the screen (horizontal scrolling)");
    for (const [label, file, want] of CASES) {
      await page.evaluate(() => { document.querySelector("#result").hidden = true; document.querySelector("#status").textContent = ""; });
      await (await page.$("#file")).uploadFile(file);
      const got = await outcome(page);
      const ok = got.startsWith(want);
      if (!ok) failed++;
      console.log(`${ok ? "ok  " : "FAIL"} ${device.padEnd(7)} ${label.padEnd(28)} -> ${got.slice(0, 110)}`);
    }
    problems.forEach((p) => { failed++; console.log(`FAIL ${device.padEnd(7)} ${p}`); });
    await page.close();
  }
  await browser.close();
  console.log(failed ? `${failed} problem(s)` : "every case answered correctly, no script errors, no outside requests");
  process.exit(failed ? 1 : 0);
})();
