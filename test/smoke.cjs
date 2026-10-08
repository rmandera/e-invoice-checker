// Runs the compiled rule sets against real invoices in Node, before any browser code exists.
const fs = require("fs");
const path = require("path");
const SaxonJS = require("saxon-js");

const SVRL = { svrl: "http://purl.oclc.org/dsdl/svrl" };
const rules = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "docs", "rules", name + ".sef.json"), "utf8"));

function run(ruleSet, xml) {
  const out = SaxonJS.transform({ stylesheetInternal: rules(ruleSet), sourceText: xml, destination: "document" }, "sync");
  const hits = SaxonJS.XPath.evaluate("//svrl:failed-assert | //svrl:successful-report", out.principalResult,
    { namespaceContext: SVRL, resultForm: "array" });
  return hits.map((n) => ({
    id: n.getAttribute("id"),
    flag: n.getAttribute("flag"),
    text: SaxonJS.XPath.evaluate("normalize-space(svrl:text)", n, { namespaceContext: SVRL }),
  }));
}

for (const file of process.argv.slice(2)) {
  const xml = fs.readFileSync(file, "utf8");
  console.log("\n" + path.basename(file));
  for (const set of ["EN16931-UBL", "XRechnung-UBL"]) {
    const t = Date.now();
    const found = run(set, xml);
    const errors = found.filter((f) => f.flag !== "warning");
    console.log(`  ${set.padEnd(14)} ${String(Date.now() - t).padStart(5)} ms  errors=${errors.length} warnings=${found.length - errors.length}`);
    for (const f of found) console.log(`    [${f.flag}] ${f.id}: ${f.text.slice(0, 110)}`);
  }
}
