// E-Invoice Checker - page logic. Validation itself lives in checker-core.js, shared with the tests.
// Every request this page makes goes to its own origin (see the Content-Security-Policy in index.html):
// the invoice is read from the visitor's disk into memory and is never sent anywhere.

const CONTACT = "rajumanderaonly@gmail.com";

const T = {
  de: {
    h1: "XRechnung &amp; E-Rechnung kostenlos prüfen",
    lead: "Prüfen Sie XRechnung, ZUGFeRD und Factur-X – als XML oder PDF – gegen die offiziellen Regelwerke, direkt in Ihrem Browser.",
    promise: "Ihre Rechnung verlässt Ihren Computer nicht. Sie wird nicht hochgeladen und nicht gespeichert.",
    dropTitle: "XML- oder ZUGFeRD-PDF hierher ziehen", dropSub: "oder klicken, um eine Datei auszuwählen",
    pilotTitle: "Alle Rechnungen automatisch – auch für Polen und Frankreich",
    pilotText: "Hinter diesem Prüfwerkzeug steht eine Plattform, die Rechnungen aus Ihrem ERP-System in das Format jedes Landes umwandelt, vor dem Versand prüft und an das richtige Netzwerk übergibt – XRechnung, Peppol und das polnische KSeF. Für ausgewählte Unternehmen gibt es ein kostenloses Pilotprogramm.",
    pilotButton: "Am kostenlosen Pilot teilnehmen",
    whatTitle: "Was wird geprüft?",
    what1: "<b>Struktur</b> gegen die offiziellen XML-Schemas (UBL 2.1, UN/CEFACT CII D16B) – bei ZUGFeRD- und Factur-X-PDFs für die eingebettete XML-Rechnung.",
    what2: "<b>Geschäftsregeln der EN 16931</b>, der europäischen Norm für E-Rechnungen.",
    what3: "<b>XRechnung 3.0.2</b> – die zusätzlichen deutschen Regeln (BR-DE), wenn die Rechnung sich als XRechnung ausweist.",
    howTitle: "Wie funktioniert das ohne Upload?",
    howText: "Die offiziellen Regelwerke werden einmalig in Ihren Browser geladen. Die Prüfung läuft dann vollständig auf Ihrem Gerät – mit denselben Regeln, die auch der offizielle Validator der KoSIT verwendet. Nach dem Laden funktioniert die Seite sogar offline.",
    whoTitle: "Wer braucht das?",
    whoText: "Seit dem 1. Januar 2025 müssen alle Unternehmen in Deutschland E-Rechnungen empfangen können. Ab 2027 wird der Versand für Unternehmen mit mehr als 800.000 € Vorjahresumsatz Pflicht, ab 2028 für alle. Wer eine E-Rechnung erhält oder versendet, sollte wissen, ob sie gültig ist.",
    footNote: "Kein Ersatz für steuerliche Beratung. Geprüft wird die formale Gültigkeit, nicht der Inhalt.",
    imprint: "Impressum", privacy: "Datenschutz", licences: "Lizenzen",
    tryValid: "Beispiel: gültige XRechnung", tryBroken: "Beispiel: fehlerhafte XRechnung", tryPdf: "Beispiel: ZUGFeRD-PDF",
    loadingEngines: "Prüfwerkzeuge werden geladen …",
    loadingRules: "Offizielle Regelwerke werden geladen (nur beim ersten Mal, einige Sekunden) …",
    checking: "Rechnung wird geprüft …",
    notXml: "Diese Datei ist keine XML-Datei. Bitte wählen Sie die XML-Rechnung (XRechnung, UBL oder CII).",
    pdfEncrypted: "Diese PDF ist verschlüsselt und kann deshalb im Browser nicht gelesen werden.",
    pdfNoXml: "Diese PDF enthält keine XML-Rechnung. Eine ZUGFeRD-, Factur-X- oder XRechnung-PDF trägt die Rechnung als XML-Anhang – diese PDF hat keinen. Eine reine PDF-Rechnung ist keine E-Rechnung.",
    pdfNoInvoice: "Diese PDF hat XML-Anhänge, aber keiner davon ist eine E-Rechnung.",
    fromPdf: "Aus der PDF gelesen", profile: "Profil",
    zugferd1: "ZUGFeRD 1.0 – keine gültige E-Rechnung mehr",
    zugferd1Text: "Diese Rechnung verwendet ZUGFeRD 1.0. Seit 2025 gilt dieses Format in Deutschland nicht mehr als E-Rechnung. Anerkannt sind ZUGFeRD ab Version 2.0.1 (außer den Profilen MINIMUM und BASIC WL) sowie XRechnung.",
    "not-einvoice": "Profil {profile} – keine E-Rechnung",
    notEinvoiceText: "Die Profile MINIMUM und BASIC WL enthalten keine vollständigen Rechnungsdaten, zum Beispiel keine Rechnungspositionen. Die deutsche Finanzverwaltung erkennt sie seit 2025 nicht als E-Rechnung an. Verwenden Sie mindestens das Profil BASIC, besser EN 16931.",
    oldXRechnung: "Die Rechnung weist XRechnung {version} aus. Seit dem 1. Februar 2024 gilt XRechnung 3.0, geprüft wurde deshalb gegen XRechnung 3.0.2. Fehler wie fehlende elektronische Adressen (BT-34, BT-49) entstehen meist genau durch diesen Versionssprung.",
    readError: "Die Datei konnte nicht gelesen werden.",
    failed: "Die Prüfung konnte nicht abgeschlossen werden: ",
    valid: "Gültig", invalid: "Ungültig", unsupported: "Kein unterstütztes Rechnungsformat",
    unsupportedText: "Erkannt wurde das Wurzelelement „{root}“. Unterstützt werden UBL-Invoice, UBL-CreditNote und UN/CEFACT CrossIndustryInvoice.",
    validText: "Die Rechnung erfüllt alle geprüften Regeln.",
    format: "Format", spec: "Spezifikation", rules: "Regelwerke", time: "Dauer",
    errors: "Fehler", warnings: "Warnungen", infos: "Hinweise", schema: "Strukturfehler (XML-Schema)",
    schemaFirst: "Die Geschäftsregeln werden erst geprüft, wenn die Struktur korrekt ist – wie beim offiziellen Validator.",
    noXRechnung: "Die Rechnung weist sich nicht als XRechnung aus. Geprüft wurde deshalb nur die EN 16931, nicht die zusätzlichen deutschen Regeln.",
    line: "Zeile", where: "Stelle",
    fix: "So beheben Sie es:", explainedEn: "Erläuterung (auf Englisch):",
    again: "Weitere Datei prüfen",
    mailSubject: "Pilotprogramm E-Invoice Control Tower",
    mailBody: "Guten Tag,\n\nwir interessieren uns für das kostenlose Pilotprogramm.\n\nUnternehmen:\nERP-System:\nLänder, in die wir Rechnungen senden:\n\nViele Grüße",
  },
  en: {
    h1: "Check XRechnung &amp; e-invoices for free",
    lead: "Validate XRechnung, ZUGFeRD and Factur-X – as XML or PDF – against the official rule sets, right in your browser.",
    promise: "Your invoice never leaves your computer. It is not uploaded and not stored.",
    dropTitle: "Drop an XML or ZUGFeRD PDF here", dropSub: "or click to choose a file",
    pilotTitle: "Every invoice, automatically – for Poland and France too",
    pilotText: "Behind this checker is a platform that converts invoices from your ERP system into each country's format, validates them before sending and delivers them to the right network – XRechnung, Peppol and Poland's KSeF. Selected companies can join a free pilot.",
    pilotButton: "Join the free pilot",
    whatTitle: "What is checked?",
    what1: "<b>Structure</b> against the official XML schemas (UBL 2.1, UN/CEFACT CII D16B) – for ZUGFeRD and Factur-X PDFs, the embedded XML invoice.",
    what2: "<b>EN 16931 business rules</b> – the European standard for e-invoices.",
    what3: "<b>XRechnung 3.0.2</b> – the additional German rules (BR-DE), when the invoice declares itself as XRechnung.",
    howTitle: "How does it work without uploading?",
    howText: "The official rule sets are loaded into your browser once. Validation then runs entirely on your device – with the same rules the official KoSIT validator uses. Once loaded, the page even works offline.",
    whoTitle: "Who needs this?",
    whoText: "Since 1 January 2025 every business in Germany must be able to receive e-invoices. Sending becomes mandatory from 2027 for companies above €800,000 prior-year turnover, and from 2028 for all. Anyone receiving or sending an e-invoice should know whether it is valid.",
    footNote: "Not a substitute for tax advice. This checks formal validity, not content.",
    imprint: "Legal notice", privacy: "Privacy", licences: "Licences",
    tryValid: "Example: valid XRechnung", tryBroken: "Example: broken XRechnung", tryPdf: "Example: ZUGFeRD PDF",
    loadingEngines: "Loading the validation engines …",
    loadingRules: "Loading the official rule sets (first time only, a few seconds) …",
    checking: "Checking the invoice …",
    notXml: "This file is not XML. Please choose the XML invoice (XRechnung, UBL or CII).",
    pdfEncrypted: "This PDF is encrypted, so it cannot be read in the browser.",
    pdfNoXml: "This PDF contains no XML invoice. A ZUGFeRD, Factur-X or XRechnung PDF carries the invoice as an XML attachment – this PDF has none. A plain PDF invoice is not an e-invoice.",
    pdfNoInvoice: "This PDF has XML attachments, but none of them is an e-invoice.",
    fromPdf: "Read from the PDF", profile: "Profile",
    zugferd1: "ZUGFeRD 1.0 – no longer a valid e-invoice",
    zugferd1Text: "This invoice uses ZUGFeRD 1.0. Since 2025 this format no longer counts as an e-invoice in Germany. Accepted are ZUGFeRD from version 2.0.1 (except the MINIMUM and BASIC WL profiles) and XRechnung.",
    "not-einvoice": "Profile {profile} – not an e-invoice",
    notEinvoiceText: "The MINIMUM and BASIC WL profiles do not carry complete invoice data – for example no invoice lines. Since 2025 the German tax administration does not accept them as e-invoices. Use at least the BASIC profile, preferably EN 16931.",
    oldXRechnung: "The invoice declares XRechnung {version}. XRechnung 3.0 has applied since 1 February 2024, so it was checked against XRechnung 3.0.2. Errors such as missing electronic addresses (BT-34, BT-49) usually come from exactly this version change.",
    readError: "The file could not be read.",
    failed: "The check could not be completed: ",
    valid: "Valid", invalid: "Invalid", unsupported: "Not a supported invoice format",
    unsupportedText: "The root element is “{root}”. Supported are UBL Invoice, UBL CreditNote and UN/CEFACT CrossIndustryInvoice.",
    validText: "The invoice meets every rule that was checked.",
    format: "Format", spec: "Specification", rules: "Rule sets", time: "Time",
    errors: "Errors", warnings: "Warnings", infos: "Hints", schema: "Structural errors (XML schema)",
    schemaFirst: "Business rules are only checked once the structure is correct – as the official validator does.",
    noXRechnung: "The invoice does not declare itself as XRechnung, so only EN 16931 was checked, not the additional German rules.",
    line: "Line", where: "Location",
    fix: "How to fix it:", explainedEn: "Explanation:",
    again: "Check another file",
    mailSubject: "Pilot programme E-Invoice Control Tower",
    mailBody: "Hello,\n\nwe are interested in the free pilot programme.\n\nCompany:\nERP system:\nCountries we invoice:\n\nKind regards",
  },
};

let lang = "de";
try { lang = localStorage.getItem("lang") || (navigator.language || "de").slice(0, 2); } catch { /* storage blocked */ }
if (!T[lang]) lang = "de";
const t = (k) => T[lang][k] ?? T.de[k] ?? k;

const $ = (s) => document.querySelector(s);
const statusEl = $("#status");
const resultEl = $("#result");

function el(tag, attrs, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") n.className = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v);
  }
  for (const c of children.flat()) if (c != null && c !== false) n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return n;
}

function applyLanguage() {
  document.documentElement.lang = lang;
  // These keys are our own fixed strings, never invoice content, so they may carry markup (<b>).
  document.querySelectorAll("[data-i18n]").forEach((n) => { n.innerHTML = t(n.dataset.i18n); });
  document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  $("#pilotLink").href = `mailto:${CONTACT}?subject=${encodeURIComponent(t("mailSubject"))}&body=${encodeURIComponent(t("mailBody"))}`;
  renderExamples();
  if (lastResult) render(lastResult);
}

// ---------------------------------------------------------------------------------------------
// Engines and data, loaded from this site only and cached for the session.
// ---------------------------------------------------------------------------------------------
const cache = new Map();
const once = (key, make) => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); };
const json = (url) => fetch(url).then((r) => { if (!r.ok) throw new Error(url + " " + r.status); return r.json(); });

const xmllint = () => once("xmllint", () => import("../lib/xmllint/index-browser.mjs"));
const explanations = () => once("explanations", () => json("data/explanations.json").catch(() => ({ rules: {}, aliases: {} })));

const deps = {
  get SaxonJS() { return window.SaxonJS; },
  loadRules: (name) => once("rules:" + name, () => json(`rules/${name}.sef.json`)),
  validateSchema: async (xml, family) => {
    const bundle = await once("schema:" + family, () => json(`schemas/${family}.json`));
    const { validateXML } = await xmllint();
    const preload = Object.entries(bundle.files).filter(([n]) => n !== bundle.main).map(([fileName, contents]) => ({ fileName, contents }));
    try {
      const r = await validateXML({ xml: [{ fileName: "invoice.xml", contents: xml }],
        schema: [{ fileName: bundle.main, contents: bundle.files[bundle.main] }], preload, maxMemoryPages: 4096 });
      return r.errors.map((e) => ({ line: e.loc ? e.loc.lineNumber : null, message: e.rawMessage || e.message }));
    } catch (e) {
      // xmllint reports a document it cannot even parse as a thrown error rather than a list.
      return String(e.message || e).split("\n").filter(Boolean).slice(0, 5).map((m) => ({ line: null, message: m }));
    }
  },
};

// Warm up in the background, so the first check does not wait for downloads the visitor did not ask for.
window.addEventListener("load", () => {
  setTimeout(() => { xmllint().catch(() => {}); explanations(); deps.loadRules("EN16931-UBL").catch(() => {}); }, 300);
});

// ---------------------------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------------------------
const drop = $("#drop");
const input = $("#file");
drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
input.addEventListener("change", () => { if (input.files[0]) checkFile(input.files[0]); input.value = ""; });
["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", (e) => { const f = e.dataTransfer.files[0]; if (f) checkFile(f); });
document.querySelectorAll(".lang button").forEach((b) => b.addEventListener("click", () => {
  lang = b.dataset.lang; try { localStorage.setItem("lang", lang); } catch { /* storage blocked */ }
  applyLanguage();
}));

function renderExamples() {
  let box = $("#examples");
  if (!box) { box = el("p", { id: "examples", class: "note" }); drop.after(box); }
  box.replaceChildren(
    el("a", { href: "#", onclick: (e) => { e.preventDefault(); checkUrl("examples/valid-xrechnung.xml", "valid-xrechnung.xml"); } }, t("tryValid")),
    "  ·  ",
    el("a", { href: "#", onclick: (e) => { e.preventDefault(); checkUrl("examples/broken-xrechnung.xml", "broken-xrechnung.xml"); } }, t("tryBroken")),
    "  ·  ",
    el("a", { href: "#", onclick: async (e) => {
      e.preventDefault();
      try {
        const blob = await (await fetch("examples/zugferd-en16931.pdf")).blob();
        await checkPdf(new File([blob], "zugferd-en16931.pdf", { type: "application/pdf" }));
      } catch (err) { statusEl.textContent = t("failed") + err.message; }
    } }, t("tryPdf")));
}

async function checkUrl(url, name) {
  try { await checkText(await (await fetch(url)).text(), name); } catch (e) { statusEl.textContent = t("failed") + e.message; }
}

async function checkFile(file) {
  resultEl.hidden = true;
  if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") { await checkPdf(file); return; }
  let text;
  try { text = await file.text(); } catch { statusEl.textContent = t("readError"); return; }
  if (!/^﻿?\s*</.test(text)) { statusEl.textContent = t("notXml"); return; }
  await checkText(text, file.name);
}

// A ZUGFeRD / Factur-X / XRechnung PDF: the embedded XML is found and read here in the browser, then checked
// exactly like an uploaded XML file. The PDF itself goes nowhere.
async function checkPdf(file) {
  let bytes;
  try { bytes = new Uint8Array(await file.arrayBuffer()); } catch { statusEl.textContent = t("readError"); return; }
  try {
    await waitFor(() => window.EInvoicePdf && window.EInvoiceCheckerCore);
    const found = await window.EInvoicePdf.extractInvoice(bytes, window.EInvoiceCheckerCore.detect);
    if (found.error) {
      statusEl.textContent = t({ encrypted: "pdfEncrypted", "no-xml": "pdfNoXml", "no-invoice": "pdfNoInvoice" }[found.error]);
      return;
    }
    await checkText(found.xml, file.name, true);
  } catch (e) {
    statusEl.textContent = t("failed") + (e && e.message ? e.message : e);
  }
}

let lastResult = null;
async function checkText(xml, name, fromPdf = false) {
  resultEl.hidden = true;
  try {
    statusEl.textContent = t("loadingEngines");
    await waitFor(() => window.SaxonJS && window.EInvoiceCheckerCore);
    statusEl.textContent = cache.has("rules:EN16931-UBL") ? t("checking") : t("loadingRules");
    await new Promise((r) => setTimeout(r, 30)); // let the status paint before the synchronous rule run
    const result = await window.EInvoiceCheckerCore.check(xml, deps);
    result.name = name;
    result.fromPdf = fromPdf;
    result.explain = await explanations();
    lastResult = result;
    statusEl.textContent = "";
    render(result);
  } catch (e) {
    statusEl.textContent = t("failed") + (e && e.message ? e.message : e);
  }
}

function waitFor(test, ms = 20000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function poll() { if (test()) resolve(); else if (Date.now() - start > ms) reject(new Error("engine did not load")); else setTimeout(poll, 50); })();
  });
}

// ---------------------------------------------------------------------------------------------
// Output. Everything derived from the invoice is inserted as text, never as markup.
// ---------------------------------------------------------------------------------------------
function explanationFor(id, catalog) {
  const key = catalog.rules[id] ? id : (catalog.aliases && catalog.aliases[id]);
  return key && catalog.rules[key];
}

function findingCard(f, catalog) {
  const ex = explanationFor(f.id, catalog);
  return el("div", { class: "finding " + f.severity },
    el("span", { class: "rule" }, f.id || "—"),
    ex ? el("span", { class: "title" }, ex.title) : null,
    el("p", { class: "msg" }, f.text),
    f.location ? el("p", { class: "where" }, t("where") + ": " + f.location) : null,
    ex ? el("div", { class: "explain" },
      el("p", {}, lang === "de" ? t("explainedEn") + " " : "", ex.explanation),
      ex.remediation ? el("p", {}, el("b", {}, t("fix") + " "), ex.remediation) : null,
      ...Object.entries(ex.erpHints || {}).map(([erp, hint]) =>
        el("p", { class: "erp" }, el("b", {}, erp.replace("BUSINESS_CENTRAL", "Business Central").replace("ODOO", "Odoo") + ": "), hint))) : null);
}

function group(title, cls, items, render) {
  if (!items.length) return null;
  return el("div", { class: "group" }, el("h3", {}, title, el("span", { class: "count " + cls }, items.length)), items.map(render));
}

function render(r) {
  const fmt = r.format || {};
  const errors = r.findings.filter((f) => f.severity === "error");
  const warnings = r.findings.filter((f) => f.severity === "warning");
  const infos = r.findings.filter((f) => f.severity === "info");
  const catalog = r.explain || { rules: {}, aliases: {} };

  const checked = r.status === "valid" || r.status === "invalid";
  const facts = !fmt.recognised ? [r.fromPdf ? el("span", {}, el("b", {}, t("fromPdf"))) : null] : [
    el("span", {}, el("b", {}, t("format") + ": "), `${fmt.syntax} ${fmt.kind}`),
    r.fromPdf ? el("span", {}, el("b", {}, t("fromPdf"))) : null,
    fmt.profile ? el("span", {}, el("b", {}, t("profile") + ": "), fmt.profile) : null,
    fmt.specification ? el("span", {}, el("b", {}, t("spec") + ": "), fmt.specification) : null,
    r.ruleSets.length ? el("span", {}, el("b", {}, t("rules") + ": "), r.ruleSets.join(", ").replace(/-(UBL|CII)/g, "")) : null,
    el("span", {}, el("b", {}, t("time") + ": "), `${(r.ms / 1000).toFixed(1)} s`),
  ];

  resultEl.replaceChildren(...[
    el("div", { class: "summary" },
      el("div", { class: "verdict " + r.status }, t(r.status).replace("{profile}", fmt.profile || "")),
      el("div", { class: "facts" }, r.name ? el("span", {}, el("b", {}, r.name)) : null, ...facts),
      el("button", { type: "button", class: "again", onclick: () => { resultEl.hidden = true; lastResult = null; input.click(); } }, t("again"))),
    r.status === "unsupported" ? el("p", { class: "note" }, t("unsupportedText").replace("{root}", (fmt && fmt.root) || "?")) : null,
    r.status === "zugferd1" ? el("p", { class: "note" }, t("zugferd1Text")) : null,
    r.status === "not-einvoice" ? el("p", { class: "note" }, t("notEinvoiceText")) : null,
    checked && fmt.outdatedXRechnung ? el("p", { class: "explain" }, t("oldXRechnung").replace("{version}", fmt.xrechnungVersion)) : null,
    r.status === "valid" && !warnings.length && !infos.length ? el("p", { class: "note" }, t("validText")) : null,
    r.schemaErrors.length ? el("div", { class: "group" },
      el("h3", {}, t("schema"), el("span", { class: "count error" }, r.schemaErrors.length)),
      r.schemaErrors.map((e) => el("div", { class: "finding error" },
        e.line ? el("span", { class: "rule" }, t("line") + " " + e.line) : null,
        el("p", { class: "msg" }, e.message.replace(/^invoice\.xml:\d+:\s*/, "")))),
      el("p", { class: "note" }, t("schemaFirst"))) : null,
    group(t("errors"), "error", errors, (f) => findingCard(f, catalog)),
    group(t("warnings"), "warning", warnings, (f) => findingCard(f, catalog)),
    group(t("infos"), "info", infos, (f) => findingCard(f, catalog)),
    checked && !fmt.isXRechnung && !r.schemaErrors.length ? el("p", { class: "note" }, t("noXRechnung")) : null,
  ].filter(Boolean));
  resultEl.hidden = false;
  if (window.__selftest) window.__selftest(r);
}

applyLanguage();

// Headless verification hook: ?selftest=<example file> runs one check and exposes the outcome.
const selftest = new URLSearchParams(location.search).get("selftest");
if (selftest) {
  window.__selftest = (r) => {
    document.body.setAttribute("data-selftest", JSON.stringify({ status: r.status, schema: r.schemaErrors.length,
      errors: r.findings.filter((f) => f.severity === "error").map((f) => f.id), ruleSets: r.ruleSets, ms: r.ms }));
  };
  window.addEventListener("load", () => checkUrl("examples/" + selftest, selftest));
}
