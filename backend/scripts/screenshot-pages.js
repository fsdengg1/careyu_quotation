require("dotenv").config();
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { initializeDatabase, closeDatabase } = require("../src/config/database");
const { repos } = require("../src/db");
const { renderQuotationHtml } = require("../src/pdf/template");
const { serializeQuotation } = require("../src/services/quotationService");
const OUT = path.join(__dirname, "../../_extract/pdf-pages");

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  await initializeDatabase();
  const row = await repos().quotations.findOne({
    where: { quotationNumber: "CY260917-0001" },
    relations: ["items", "terms"],
  });
  const quotation = serializeQuotation(row);
  const html = renderQuotationHtml(quotation);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "load" });
  const pages = await page.$$(".quotation-page");
  for (let i = 0; i < pages.length; i += 1) {
    await pages[i].screenshot({ path: path.join(OUT, `page-${i + 1}.png`) });
  }
  await browser.close();
  console.log("screenshots", pages.length);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => closeDatabase());
