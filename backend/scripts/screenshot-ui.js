const path = require("path");
const puppeteer = require("puppeteer");

const OUT = path.join(__dirname, "../../_extract/ui");

async function main() {
  const fs = require("fs");
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  page.setDefaultTimeout(60000);

  await page.goto("http://localhost:5173/login", { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUT, "login.png"), fullPage: true });

  await page.click("button[type=submit]");
  await page.waitForSelector(".stat-grid");
  await page.screenshot({ path: path.join(OUT, "dashboard.png"), fullPage: true });

  await page.goto("http://localhost:5173/quotations/new", { waitUntil: "networkidle0" });
  await page.waitForSelector(".q-page-1");
  await page.screenshot({ path: path.join(OUT, "create.png") });

  await browser.close();
  console.log("ui screenshots saved");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
