const fs = require("fs");
const path = require("path");

function findIconvPackages(dir, found = []) {
  if (!fs.existsSync(dir)) return found;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (entry.name === "iconv-lite") {
      const pkgPath = path.join(full, "package.json");
      if (fs.existsSync(pkgPath)) found.push(pkgPath);
    }
    if (entry.name === "node_modules" || fs.existsSync(path.join(full, "node_modules"))) {
      findIconvPackages(entry.name === "node_modules" ? full : path.join(full, "node_modules"), found);
    }
  }
  return found;
}

const roots = [
  path.join(__dirname, "../backend/node_modules"),
  path.join(__dirname, "../node_modules"),
];

const packages = [...new Set(roots.flatMap((root) => findIconvPackages(root)))];
let patched = 0;

for (const pkgPath of packages) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (!pkg.browser || typeof pkg.browser !== "object") continue;
  const hadStub =
    pkg.browser["./lib/extend-node"] === false ||
    pkg.browser["./lib/streams"] === false ||
    pkg.browser.stream === false;
  if (!hadStub) continue;
  delete pkg.browser["./lib/extend-node"];
  delete pkg.browser["./lib/streams"];
  delete pkg.browser.stream;
  if (Object.keys(pkg.browser).length === 0) delete pkg.browser;
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  patched += 1;
}

console.log(`Patched iconv-lite browser stubs in ${patched} package.json file(s).`);
