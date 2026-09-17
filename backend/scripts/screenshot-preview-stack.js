const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const OUT = path.join(__dirname, "../../_extract/ui");

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  page.setDefaultTimeout(60000);

  await page.goto("http://localhost:5173/login", { waitUntil: "networkidle0" });
  await page.click("button[type=submit]");
  await page.waitForSelector(".stat-grid");

  await page.goto("http://localhost:5173/quotations/new", { waitUntil: "networkidle0" });
  await page.waitForSelector(".quotation-page.page-1");
  await page.screenshot({ path: path.join(OUT, "create-page1.png") });

  await page.$eval(".preview-container", (el) => {
    el.scrollTop = 520;
  });
  await page.screenshot({ path: path.join(OUT, "create-gap.png") });

  const sheets = await page.$$eval(".preview-sheet", (nodes) => nodes.length);
  const pages = await page.$$eval(".quotation-page", (nodes) => nodes.length);
  const labels = await page.$$eval(".preview-page-label", (nodes) => nodes.map((n) => n.textContent.trim()));
  console.log({ sheets, pages, labels });

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
