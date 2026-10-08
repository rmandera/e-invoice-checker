# E-Invoice Checker

A free validator for **XRechnung** and **EN 16931** e-invoices that runs entirely in the browser.
**The invoice never leaves the visitor's computer** — there is no upload, and the page's Content-Security-Policy
forbids it from connecting to any other server.

**Live:** https://rmandera.github.io/e-invoice-checker/

## What it checks

| Layer | Rule set | Applies to |
|---|---|---|
| Structure | Official XML schemas: UBL 2.1, UN/CEFACT CII D16B | Every document |
| Business rules | EN 16931 validation artefacts 1.3.16 (CEN/TC 434) | Every document |
| German rules | XRechnung 3.0.2 Schematron (KoSIT) | Documents that declare themselves XRechnung |

As in the official KoSIT validator, business rules run only once the structure is valid.
Findings are shown as errors, warnings and hints, with plain-language explanations and pointers to where the field
lives in Microsoft Dynamics 365 Business Central and Odoo.

## Verified against the official test suite

`npm test` checks every standard instance of the official
[KoSIT XRechnung 3.0.2 test suite](https://github.com/itplr-kosit/xrechnung-testsuite) — UBL and CII,
invoices and credit notes — and expects each to be valid, plus known-broken samples that must be caught for the
right reason. `npm run test:browser` runs the same checks through the real page in Microsoft Edge and fails if the
page makes a single request to another origin.

## How it works

The official Schematron artefacts are compiled from XSLT to SaxonJS's executable format at build time and run
in the browser with [SaxonJS](https://www.saxonica.com/saxonjs/); schemas are validated with libxml2 compiled to
WebAssembly ([xmllint-wasm](https://github.com/noppa/xmllint-wasm)). `docs/js/checker-core.js` is the shared
validation core used unchanged by both the page and the tests.

## Licence

The code of this checker and the rule explanations are © 2026 Raju Mandera, all rights reserved.
Third-party components are redistributed unmodified under their own licences — EUPL 1.2 (EN 16931 rules),
Apache 2.0 (XRechnung rules), MIT (xmllint-wasm, libxml2) and the Saxonica licence (SaxonJS); see
[docs/lizenzen.html](docs/lizenzen.html) and [docs/licenses/](docs/licenses/).

Not a substitute for tax advice: this checks formal validity, not content.
