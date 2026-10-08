// Runs the checker core against the official KoSIT XRechnung 3.0.2 test suite and known-broken samples.
// Exit code 1 on any wrong verdict, so it can gate a build.
const fs = require("fs");
const path = require("path");
const SaxonJS = require("saxon-js");
const { validateXML } = require("xmllint-wasm");
const core = require("../docs/js/checker-core.js");

const SITE = path.join(__dirname, "..", "docs");
const rulesCache = {};
const schemaCache = {};

const deps = {
  SaxonJS,
  loadRules: async (name) =>
    (rulesCache[name] ??= JSON.parse(fs.readFileSync(path.join(SITE, "rules", name + ".sef.json"), "utf8"))),
  validateSchema: async (xml, family) => {
    const bundle = (schemaCache[family] ??= JSON.parse(fs.readFileSync(path.join(SITE, "schemas", family + ".json"), "utf8")));
    const preload = Object.entries(bundle.files).filter(([n]) => n !== bundle.main).map(([fileName, contents]) => ({ fileName, contents }));
    try {
      const r = await validateXML({ xml: [{ fileName: "invoice.xml", contents: xml }],
        schema: [{ fileName: bundle.main, contents: bundle.files[bundle.main] }], preload, maxMemoryPages: 4096 });
      return r.errors.map((e) => ({ line: e.loc ? e.loc.lineNumber : null, message: e.rawMessage || e.message }));
    } catch (e) {
      return [{ line: null, message: String(e.message || e).split("\n")[0] }];
    }
  },
};

(async () => {
  let wrong = 0;
  const expect = async (file, want, mustContain) => {
    const r = await core.check(fs.readFileSync(file, "utf8"), deps);
    const errors = r.findings.filter((f) => f.severity === "error").map((f) => f.id);
    const ok = r.status === want && (!mustContain || errors.includes(mustContain) || r.schemaErrors.length > 0 && mustContain === "SCHEMA");
    if (!ok) wrong++;
    const label = `${r.format?.syntax ?? "?"} ${r.format?.isXRechnung ? "XR" : "--"}`;
    if (!ok || process.env.VERBOSE) {
      console.log(`${ok ? "ok  " : "FAIL"} ${label} ${path.basename(file).padEnd(36)} want=${want} got=${r.status} ` +
        `schema=${r.schemaErrors.length} errors=[${errors.join(",")}] ${r.ms}ms`);
      if (!ok) r.schemaErrors.slice(0, 2).forEach((e) => console.log("       schema:", e.message.slice(0, 160)));
    }
    return r;
  };

  const dir = path.join(__dirname, "kosit", "instances", "standard");
  const official = fs.readdirSync(dir).filter((f) => f.endsWith(".xml")).sort();
  const t = Date.now();
  for (const f of official) await expect(path.join(dir, f), "valid");
  console.log(`official KoSIT standard instances: ${official.length - wrong}/${official.length} valid (${Date.now() - t} ms total)`);

  const before = wrong;
  const s = path.join(__dirname, "samples");
  await expect(path.join(s, "valid-xrechnung-ubl.xml"), "valid");
  await expect(path.join(s, "broken-no-seller-phone.xml"), "invalid", "BR-DE-6");
  await expect(path.join(s, "broken-structure.xml"), "invalid", "SCHEMA");
  console.log(`platform-generated and deliberately broken samples: ${3 - (wrong - before)}/3 correct`);

  process.exit(wrong ? 1 : 0);
})();
