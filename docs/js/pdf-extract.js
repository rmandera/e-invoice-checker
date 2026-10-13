/*
 * Finds the invoice XML embedded in a ZUGFeRD / Factur-X / XRechnung hybrid PDF - in the visitor's browser.
 *
 * Deliberately small rather than a full PDF library. A hybrid invoice carries its XML as an embedded-file
 * stream, which the PDF format never places inside a compressed object stream, so it can be found by scanning
 * for stream objects whose dictionary says EmbeddedFile. Decompression uses the browser's own
 * DecompressionStream, so nothing is downloaded and nothing leaves the device.
 *
 * Real files differ in ways this has to tolerate (all seen in the public ZUGFeRD corpus): compressed or raw
 * streams, a /Length given directly or as a reference to another object, several attachments of which only one
 * is the invoice, and file names that vary (factur-x.xml, xrechnung.xml, ZUGFeRD-invoice.xml). The invoice is
 * therefore recognised by its content, never by its name.
 *
 * Shared unchanged by the page and the tests.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.EInvoicePdf = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const latin1 = (bytes) => {
    // One character per byte, so string offsets are byte offsets.
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return s;
  };

  async function inflate(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function resolveLength(dict, text) {
    const m = dict.match(/\/Length\s+(\d+)(?:\s+(\d+)\s+R)?/);
    if (!m) return null;
    if (!m[2]) return Number(m[1]);
    const ref = text.match(new RegExp("(?:^|[\\s>])" + m[1] + "\\s+" + m[2] + "\\s+obj\\s*(\\d+)\\s*endobj"));
    return ref ? Number(ref[1]) : null;
  }

  /** Every embedded file's bytes, decoded as far as this extractor supports. */
  async function embeddedFiles(bytes) {
    const text = latin1(bytes);
    if (/\/Encrypt\s/.test(text.slice(-4096)) || /\/Encrypt\s+\d+\s+\d+\s+R/.test(text)) {
      return { encrypted: true, files: [] };
    }
    const files = [];
    const keyword = /stream\r?\n/g;
    let m;
    while ((m = keyword.exec(text))) {
      const at = m.index;
      if (!/>>\s*$/.test(text.slice(Math.max(0, at - 64), at))) continue; // "stream" must follow a dictionary
      const objStart = text.lastIndexOf(" obj", at);
      if (objStart < 0) continue;
      const dict = text.slice(objStart, at);
      if (!/EmbeddedFile/.test(dict)) continue;
      const start = at + m[0].length;
      let length = resolveLength(dict, text);
      if (length == null || start + length > bytes.length) {
        const end = text.indexOf("endstream", start);
        if (end < 0) continue;
        length = end - start;
      }
      let data = bytes.subarray(start, start + length);
      const filter = (dict.match(/\/Filter\s*(\[[^\]]*\]|\/\w+)/) || [])[1] || "";
      const filters = filter.match(/\/\w+/g) || [];
      if (filters.some((f) => f !== "/FlateDecode")) continue; // nothing else is used for embedded invoices
      try {
        if (filters.length) data = await inflate(data);
      } catch (e) {
        continue;
      }
      files.push(data);
      keyword.lastIndex = start + length;
    }
    return { encrypted: false, files };
  }

  /**
   * @param detect the checker's own format detection, so that "is this the invoice?" is decided exactly as it
   *               is for a plain XML upload
   * @return { xml } on success, or { error: "encrypted" | "no-xml" | "no-invoice" }
   */
  async function extractInvoice(bytes, detect) {
    const { encrypted, files } = await embeddedFiles(bytes);
    if (encrypted) return { error: "encrypted" };
    const xmls = files
      .map((f) => new TextDecoder("utf-8").decode(f))
      .filter((s) => /^﻿?\s*</.test(s));
    if (!xmls.length) return { error: "no-xml" };
    const rank = (s) => {
      const d = detect(s);
      if (d && d.recognised) return 2;
      if (d && d.root === "CrossIndustryDocument") return 1; // ZUGFeRD 1.0, reported as such
      return 0;
    };
    const best = xmls.map((s) => ({ s, r: rank(s) })).sort((a, b) => b.r - a.r)[0];
    return best.r > 0 ? { xml: best.s } : { error: "no-invoice" };
  }

  return { extractInvoice: extractInvoice };
});
