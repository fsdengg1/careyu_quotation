const fs = require("fs");
const path = require("path");
const { formatINR } = require("../utils/currency");
const { ABOUT_US, GUARANTEE_TEXT, DEFAULT_COMPANY, DEFAULT_TERMS } = require("../utils/defaults");
const { calculateQuotation } = require("../utils/calculations");

const ASSET_DIR = path.join(__dirname, "assets");
const CSS_PATH = path.join(__dirname, "quotation.css");

function readAsset(name) {
  const file = path.join(ASSET_DIR, name);
  if (!fs.existsSync(file)) return "";
  const buf = fs.readFileSync(file);
  const ext = path.extname(name).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function fontFaceCss() {
  const extraBold = fs.readFileSync(path.join(ASSET_DIR, "fonts", "Montserrat-ExtraBold.ttf")).toString("base64");
  const semiBold = fs.readFileSync(path.join(ASSET_DIR, "fonts", "Montserrat-SemiBold.ttf")).toString("base64");
  return `
    @font-face {
      font-family: "Montserrat";
      font-style: normal;
      font-weight: 800;
      src: url(data:font/ttf;base64,${extraBold}) format("truetype");
    }
    @font-face {
      font-family: "Montserrat";
      font-style: normal;
      font-weight: 600;
      src: url(data:font/ttf;base64,${semiBold}) format("truetype");
    }
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl2br(value) {
  return escapeHtml(value).replace(/\n/g, "<br/>");
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatCoverDate(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const month = d.toLocaleString("en-GB", { month: "long" });
  return `${ordinal(d.getDate())} ${month} , ${d.getFullYear()}`;
}

function splitProjectName(name) {
  const text = String(name || "").trim().toUpperCase();
  if (text.length <= 42) return escapeHtml(text);
  const words = text.split(" ");
  if (words.length < 3) return escapeHtml(text);
  const mid = Math.ceil(words.length / 2);
  return `${escapeHtml(words.slice(0, mid).join(" "))}<br/>${escapeHtml(words.slice(mid).join(" "))}`;
}

function brandBlock(logoSrc, extraClass = "") {
  return `
    <div class="q-brand ${extraClass}">
      <img src="${logoSrc}" alt="Care Yu" />
      <div class="q-wordmark">
        <div class="wm-name">CARE <span>YU</span></div>
        <div class="wm-sub">AUTOMATION</div>
      </div>
    </div>`;
}

function pageFooter(company) {
  return `
    <div class="q-footer">
      <div class="q-web">${escapeHtml(company.website)}</div>
      <div class="q-tags">${escapeHtml(company.footerTagline || "Racking | Stacking | Automation | Structures | Consulting")}</div>
    </div>`;
}

function page1(q, company, assets) {
  const addressHtml = nl2br(company.address);
  return `
  <section class="q-page-1">
    <div class="p1-strip"></div>
    <div class="p1-hero">
      <img src="${assets.cover}" alt="" />
      <div class="p1-hero-wash"></div>
    </div>
    <div class="p1-cloud">
      <svg viewBox="0 0 210 50" preserveAspectRatio="none" aria-hidden="true">
        <path fill="#bcd0e9" d="M0,50 L0,27 C20,21 42,25 64,22 C92,18 112,5 142,0 C166,-4 188,5 210,18 L210,50 Z"/>
      </svg>
      <div class="p1-cloud-body"></div>
    </div>
    <div class="p1-logo-row">
      <img src="${assets.logo}" alt="Care Yu Automation" />
      <div class="p1-wordmark">
        <div class="wm-name">CARE <span>YU</span></div>
        <div class="wm-sub">${"AUTOMATION"
          .split("")
          .map((letter) => `<span>${letter}</span>`)
          .join("")}</div>
      </div>
    </div>
    <div class="p1-content">
      <h1 class="p1-title">QUOTATION</h1>
      <h2 class="p1-project">${splitProjectName(q.projectName)}</h2>
      <div class="p1-grid">
        <div>
          <div class="p1-label">QUOTATION NO:</div>
          <div class="p1-value">${escapeHtml(String(q.quotationNumber || "").toUpperCase())}</div>
        </div>
        <div class="right">
          <div class="p1-label">PROJECT LOCATION:</div>
          <div class="p1-value">${escapeHtml(String(q.projectLocation || "").toUpperCase())}</div>
        </div>
      </div>
      <div class="p1-dated">
        <div class="p1-label">DATED:</div>
        <div class="p1-value">${escapeHtml(formatCoverDate(q.quotationDate))}</div>
      </div>
      <div class="p1-client">
        <div class="p1-label">CLIENT NAME:</div>
        <div class="p1-value">${escapeHtml(String(q.clientCompany || q.clientName || "").toUpperCase())}</div>
      </div>
    </div>
    <div class="p1-bottom">
      <div>
        <div class="p1-company-name">CARE <span>YU</span> AUTOMATION PVT LTD.</div>
        <div class="p1-address">${addressHtml}</div>
      </div>
      <div class="p1-contacts">
        <div class="web">${escapeHtml(company.website)}</div>
        <div class="mail">${escapeHtml(company.email)}</div>
        <div>${escapeHtml(company.phone)}</div>
      </div>
    </div>
  </section>`;
}

function page2(company, assets) {
  const paragraphs = ABOUT_US.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  return `
  <section class="q-page-2">
    <div class="p2-layout">
      <div class="p2-main">
        <h2 class="p2-title">About us</h2>
        <div class="p2-copy">${paragraphs}</div>
      </div>
      <div class="p2-right">
        <div class="p2-logo-wrap">${brandBlock(assets.logo)}</div>
        <aside class="p2-panel">
          <div class="p2-rule"></div>
          <div class="p2-square"></div>
          <div class="p2-panel-body">
            <div class="p2-seamless">SEAMLESS<br/>INTEGRATION</div>
            <div class="p2-spear">SOLUTIONS THAT<br/>SPEARHEAD GROWTH</div>
            <div class="p2-stat"><div class="num">50+</div><div class="lbl">PROJECTS<br/>EXECUTED</div></div>
            <div class="p2-stat"><div class="num">45+</div><div class="lbl">HAPPY CUSTOMERS</div></div>
            <div class="p2-stat"><div class="num">3+</div><div class="lbl">COUNTRIES SERVED</div></div>
          </div>
        </aside>
      </div>
    </div>
    ${pageFooter(company)}
  </section>`;
}

function page3(company, assets) {
  return `
  <section class="q-page-3">
    <div class="q-frame">
      <div class="p3-inner">
        <div class="q-header" style="padding: 2mm 0 0;">${brandBlock(assets.logo)}</div>
        <h2 class="p3-title">GUARANTEE</h2>
        <p class="p3-copy">${escapeHtml(GUARANTEE_TEXT[0])}</p>
        <p class="p3-copy">${escapeHtml(GUARANTEE_TEXT[1])}</p>
        <div class="p3-watermark">
          <img src="${assets.logo}" alt="" />
          <div class="q-wordmark">
            <div class="wm-name">CARE <span>YU</span></div>
            <div class="wm-sub">AUTOMATION</div>
          </div>
        </div>
        ${pageFooter(company)}
      </div>
    </div>
  </section>`;
}

function page4(q, company, totals, assets) {
  const items = totals.items
    .map(
      (item) => `
      <tr>
        <td class="p4-col-sl">${item.serialNumber}</td>
        <td class="p4-desc">${nl2br(item.description)}</td>
        <td class="p4-col-unit">${formatINR(item.unitPrice)}</td>
        <td class="p4-col-qty">${item.quantity % 1 === 0 ? item.quantity : item.quantity}</td>
        <td class="p4-col-total">${formatINR(item.totalAmount)}</td>
      </tr>`
    )
    .join("");

  const gstPct = Number(totals.gstPercentage);
  const gstLabel = Number.isInteger(gstPct) ? String(gstPct) : String(gstPct);

  return `
  <section class="q-page-4">
    <div class="q-frame">
      <div class="p4-inner">
        <div class="q-header" style="padding:0;">${brandBlock(assets.logo)}</div>
        <div class="p4-intro">
          <strong>Dear Sir,</strong><br/>
          We thank for your kind enquiry and we have pleasure to offer our rate for
          <strong>${escapeHtml(q.projectName || "Mainline Vision Inspection System")}</strong>
          as detailed below.
        </div>
        <table class="p4-table">
          <thead>
            <tr>
              <th class="p4-col-sl">SL.No</th>
              <th>Material Descriptions</th>
              <th class="p4-col-unit">Unit Price</th>
              <th class="p4-col-qty">QTY.</th>
              <th class="p4-col-total">Total amount<br/>in Rs.</th>
            </tr>
          </thead>
          <tbody>
            ${items}
            <tr class="p4-sum">
              <td colspan="4" class="p4-sum-label">Basic Landed</td>
              <td class="p4-sum-value">${formatINR(totals.subtotal)}</td>
            </tr>
            <tr class="p4-sum">
              <td colspan="4" class="p4-sum-label">Freight</td>
              <td class="p4-sum-value">${formatINR(totals.freight)}</td>
            </tr>
            <tr class="p4-sum">
              <td colspan="4" class="p4-sum-label">Installation &amp; Integration</td>
              <td class="p4-sum-value">${formatINR(totals.installationCharge)}</td>
            </tr>
            <tr class="p4-sum">
              <td colspan="4" class="p4-sum-label">Total Basic Landed</td>
              <td class="p4-sum-value">${formatINR(totals.totalBasicLanded)}</td>
            </tr>
            <tr class="p4-sum">
              <td colspan="4" class="p4-sum-label">GST @ ${gstLabel}%</td>
              <td class="p4-sum-value">${totals.gstAsExtra === false ? formatINR(totals.gstAmount) : "EXTRA"}</td>
            </tr>
            ${
              totals.gstAsExtra === false
                ? `<tr class="p4-sum">
              <td colspan="4" class="p4-sum-label">Grand Total</td>
              <td class="p4-sum-value">${formatINR(totals.grandTotal)}</td>
            </tr>`
                : ""
            }
            <tr class="p4-yellow">
              <td colspan="5">${escapeHtml(totals.amountInWords)}</td>
            </tr>
            <tr class="p4-yellow">
              <td colspan="5">NOTE: &ldquo;${escapeHtml(q.terms?.amcNote || "")}&rdquo;</td>
            </tr>
          </tbody>
        </table>
        <div class="p4-watermark-word">AUTOMATION</div>
        ${pageFooter(company)}
      </div>
    </div>
  </section>`;
}

function page5(q, company, assets) {
  const t = { ...DEFAULT_TERMS, ...(q.terms || {}) };
  const rows = [
    ["1", "Software Development & Implementation", t.softwareDevelopment, false],
    ["2", "Quotation Validity", t.quotationValidity, false],
    ["3", "Terms of payment", t.paymentTerms, true],
    ["4", "Warranty", t.warranty, true],
    ["5", "General", t.generalTerms || DEFAULT_TERMS.generalTerms, false],
    ["", "", t.jurisdiction || DEFAULT_TERMS.jurisdiction, false],
    ["", "", t.liability || DEFAULT_TERMS.liability, false],
    ["", "", t.salesTerms || DEFAULT_TERMS.salesTerms, false],
    ["", "", t.insurance || DEFAULT_TERMS.insurance, false],
    ["", "", t.arbitration || DEFAULT_TERMS.arbitration, false],
  ];

  const body = rows
    .map(
      ([no, key, val, emphasis]) => `
      <tr>
        <td class="p5-no">${escapeHtml(no)}</td>
        <td class="p5-key">${nl2br(key)}</td>
        <td class="p5-val ${emphasis ? "emphasis" : ""}">${nl2br(val)}</td>
      </tr>`
    )
    .join("");

  return `
  <section class="q-page-5">
    <div class="q-frame">
      <div class="p5-inner">
        <div class="q-header" style="padding:0;">${brandBlock(assets.logo)}</div>
        <h2 class="p5-title">TERMS AND CONDITIONS</h2>
        <table class="p5-table">
          <tbody>${body}</tbody>
        </table>
        <div class="p5-close">
          We hope that our offer will be in line with your requirements and looking for your valuable order.<br/>
          Thanking You,
        </div>
        <div class="p5-sign">
          Regards<br/>
          <span class="who">${escapeHtml(company.signatureName || "Shradha")}</span><br/>
          ${escapeHtml(company.signatureDesignation || "Business Head")}<br/>
          ${escapeHtml(company.companyName || "Care YU Automation PVT. LTD")}
        </div>
        ${pageFooter(company)}
      </div>
    </div>
  </section>`;
}

function renderQuotationHtml(quotation) {
  const css = fs.readFileSync(CSS_PATH, "utf8");
  const assets = {
    logo: readAsset("careyu-logo.png"),
    cover: readAsset("cover-bg.jpg"),
  };
  const company = { ...DEFAULT_COMPANY, ...(quotation.companySnapshot || {}) };
  const totals = calculateQuotation(
    quotation.items,
    quotation.freight,
    quotation.installationCharge,
    quotation.gstPercentage,
    quotation.gstAsExtra
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(quotation.quotationNumber)} — Care Yu Quotation</title>
  <style>
    ${fontFaceCss()}
    ${css}
    @page { size: A4; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; }
    .quotation-document { width: 210mm; }
  </style>
</head>
<body>
  <div class="quotation-document quotation-document--pdf q-root">
    <div class="quotation-page page-1">${page1(quotation, company, assets)}</div>
    <div class="quotation-page page-2">${page2(company, assets)}</div>
    <div class="quotation-page page-3">${page3(company, assets)}</div>
    <div class="quotation-page page-4">${page4(quotation, company, totals, assets)}</div>
    <div class="quotation-page page-5">${page5(quotation, company, assets)}</div>
  </div>
</body>
</html>`;
}

module.exports = { renderQuotationHtml, formatCoverDate, splitProjectName };
