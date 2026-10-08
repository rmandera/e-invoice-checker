/*
 * E-Invoice Checker - validation core.
 *
 * Shared, unchanged, by the web page and by the automated tests, so the tests exercise exactly what a
 * visitor runs. It never touches the network itself: the caller supplies the rule sets, the schemas and
 * the two engines, which in the browser are files served alongside this page. That is what makes the
 * promise on the page true - the invoice is read in the visitor's browser and goes nowhere else.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.EInvoiceCheckerCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const SVRL = { svrl: "http://purl.oclc.org/dsdl/svrl" };

  const FORMATS = {
    "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2|Invoice":
      { syntax: "UBL", kind: "Invoice", schema: "ubl-invoice", en16931: "EN16931-UBL", xrechnung: "XRechnung-UBL" },
    "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2|CreditNote":
      { syntax: "UBL", kind: "Credit note", schema: "ubl-creditnote", en16931: "EN16931-UBL", xrechnung: "XRechnung-UBL" },
    "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100|CrossIndustryInvoice":
      { syntax: "CII", kind: "Invoice", schema: "cii", en16931: "EN16931-CII", xrechnung: "XRechnung-CII" },
  };

  /**
   * Which document this is, read from its root element and its declared specification (BT-24).
   * Done with a scan of the opening tags rather than a full parse, so that a document too broken to parse
   * still gets a useful answer about what it was meant to be.
   */
  function detect(xml) {
    const body = xml.replace(/^\uFEFF/, "").replace(/<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE[^>]*>/g, "");
    const rootTag = body.match(/<([A-Za-z_][\w.\-]*:)?([A-Za-z_][\w.\-]*)([^>]*)>/);
    if (!rootTag) return null;
    const prefix = rootTag[1] ? rootTag[1].slice(0, -1) : null;
    const attrs = rootTag[3];
    const nsDecl = prefix
      ? attrs.match(new RegExp("xmlns:" + prefix.replace(/[.\-]/g, "\\$&") + "\\s*=\\s*[\"']([^\"']+)[\"']"))
      : attrs.match(/xmlns\s*=\s*["']([^"']+)["']/);
    const format = FORMATS[(nsDecl ? nsDecl[1] : "") + "|" + rootTag[2]];
    if (!format) return { recognised: false, root: rootTag[2], namespace: nsDecl ? nsDecl[1] : null };

    // BT-24 Specification identifier: cbc:CustomizationID in UBL, GuidelineSpecifiedDocumentContextParameter in CII.
    const spec = format.syntax === "UBL"
      ? (body.match(/<(?:[\w.\-]+:)?CustomizationID[^>]*>\s*([^<]+?)\s*</) || [])[1]
      : (body.match(/GuidelineSpecifiedDocumentContextParameter>[\s\S]*?<(?:[\w.\-]+:)?ID[^>]*>\s*([^<]+?)\s*</) || [])[1];
    const isXRechnung = !!spec && /xrechnung/i.test(spec);
    return Object.assign({ recognised: true, specification: spec || null, isXRechnung }, format);
  }

  /** "/*:Invoice[namespace-uri()='...'][1]/*:AccountingSupplierParty[...][1]" -> "/Invoice/AccountingSupplierParty" */
  function readableLocation(xpath) {
    if (!xpath) return "";
    return xpath.replace(/\[namespace-uri\(\)=['"][^'"]*['"]\]/g, "").replace(/\*:/g, "")
      .replace(/Q\{[^}]*\}/g, "").replace(/\[1\]/g, "");
  }

  function severity(flag) {
    if (flag === "warning") return "warning";
    if (flag === "information" || flag === "info") return "info";
    return "error"; // fatal, error, or an assertion with no flag at all
  }

  function findings(SaxonJS, svrlDocument, ruleSet) {
    const nodes = SaxonJS.XPath.evaluate("//svrl:failed-assert | //svrl:successful-report", svrlDocument,
      { namespaceContext: SVRL, resultForm: "array" });
    return nodes.map(function (n) {
      return {
        id: n.getAttribute("id") || "",
        severity: severity(n.getAttribute("flag")),
        text: SaxonJS.XPath.evaluate("normalize-space(svrl:text)", n, { namespaceContext: SVRL }),
        location: readableLocation(n.getAttribute("location")),
        ruleSet: ruleSet,
      };
    });
  }

  /**
   * Checks one document.
   *
   * @param deps.SaxonJS          the SaxonJS runtime
   * @param deps.loadRules(name)  -> Promise of a compiled rule set (SEF object)
   * @param deps.validateSchema(xml, family) -> Promise of [{line, message}]
   */
  async function check(xml, deps) {
    const started = Date.now();
    const format = detect(xml);
    if (!format || !format.recognised) {
      return { status: "unsupported", format: format, schemaErrors: [], findings: [], ruleSets: [], ms: Date.now() - started };
    }

    const schemaErrors = await deps.validateSchema(xml, format.schema);
    const result = { status: "invalid", format: format, schemaErrors: schemaErrors, findings: [], ruleSets: [] };

    // As the official KoSIT validator does: business rules are only meaningful on a document that is
    // structurally sound, and on one that is not they produce errors that point at the wrong thing.
    if (schemaErrors.length === 0) {
      const sets = [format.en16931].concat(format.isXRechnung ? [format.xrechnung] : []);
      for (const set of sets) {
        const sef = await deps.loadRules(set);
        const out = deps.SaxonJS.transform({ stylesheetInternal: sef, sourceText: xml, destination: "document" }, "sync");
        result.findings = result.findings.concat(findings(deps.SaxonJS, out.principalResult, set));
        result.ruleSets.push(set);
      }
      result.status = result.findings.some(function (f) { return f.severity === "error"; }) ? "invalid" : "valid";
    }
    result.ms = Date.now() - started;
    return result;
  }

  return { detect: detect, check: check, readableLocation: readableLocation };
});
