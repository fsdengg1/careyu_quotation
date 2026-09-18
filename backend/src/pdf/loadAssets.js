const fs = require("fs");
const path = require("path");

let embedded = null;
try {
  embedded = require("./embeddedAssets");
} catch {
  embedded = null;
}

function localPdfDir() {
  try {
    return __dirname;
  } catch {
    return "";
  }
}

function readFileAsDataUri(name, mime) {
  const file = path.join(localPdfDir(), "assets", name);
  if (!fs.existsSync(file)) return "";
  return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
}

function fontFaceFromFiles() {
  const extraBold = fs.readFileSync(path.join(localPdfDir(), "assets", "fonts", "Montserrat-ExtraBold.ttf")).toString("base64");
  const semiBold = fs.readFileSync(path.join(localPdfDir(), "assets", "fonts", "Montserrat-SemiBold.ttf")).toString("base64");
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

function loadPdfAssets() {
  if (embedded) {
    return {
      css: embedded.css,
      logo: embedded.logo,
      cover: embedded.cover,
      fontFaceCss: embedded.fontFaceCss,
    };
  }

  return {
    css: fs.readFileSync(path.join(localPdfDir(), "quotation.css"), "utf8"),
    logo: readFileAsDataUri("careyu-logo.png", "image/png"),
    cover: readFileAsDataUri("cover-bg.jpg", "image/jpeg"),
    fontFaceCss: fontFaceFromFiles(),
  };
}

module.exports = { loadPdfAssets };
