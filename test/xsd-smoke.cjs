const fs = require("fs");
const { validateXML } = require("xmllint-wasm");
(async () => {
  const bundle = JSON.parse(fs.readFileSync("site/schemas/ubl-invoice.json", "utf8"));
  const preload = Object.entries(bundle.files).filter(([n]) => n !== bundle.main).map(([fileName, contents]) => ({ fileName, contents }));
  for (const f of process.argv.slice(2)) {
    const t = Date.now();
    const r = await validateXML({ xml: [{ fileName: "invoice.xml", contents: fs.readFileSync(f, "utf8") }],
      schema: [{ fileName: bundle.main, contents: bundle.files[bundle.main] }], preload, maxMemoryPages: 4096 });
    console.log(`${f}: valid=${r.valid} errors=${r.errors.length} (${Date.now() - t} ms)`);
    r.errors.slice(0, 3).forEach((e) => console.log("   ", e.rawMessage || e.message));
  }
})();
