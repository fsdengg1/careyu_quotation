function launch() {
  throw new Error(
    "The standard puppeteer package cannot run inside Cloudflare Workers. Production PDF generation uses Cloudflare Browser Rendering via @cloudflare/puppeteer."
  );
}

module.exports = { launch };
module.exports.default = { launch };
