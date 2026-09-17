const { test } = require("node:test");
const assert = require("node:assert/strict");
const { numberToWords } = require("./numberToWords");
const { calculateQuotation } = require("./calculations");

test("converts 3098664 using Indian numbering", () => {
  assert.equal(
    numberToWords(3098664),
    "RUPEES: THIRTY LAKH NINETY EIGHT THOUSAND SIX HUNDRED AND SIXTY FOUR ONLY"
  );
});

test("recalculates quotation totals from the reference example", () => {
  const result = calculateQuotation(
    [
      { description: "System", unitPrice: 2588864, quantity: 1 },
      { description: "Cameras", unitPrice: 89950, quantity: 4 },
    ],
    25000,
    125000,
    18,
    false
  );
  assert.equal(result.subtotal, 2948664);
  assert.equal(result.totalBasicLanded, 3098664);
  assert.equal(result.gstAmount, 557759.52);
  assert.equal(result.grandTotal, 3656423.52);
  assert.equal(result.gstAsExtra, false);
});

test("uses 18 percent GST when percentage is blank and GST is included in total", () => {
  const result = calculateQuotation(
    [{ description: "Item", unitPrice: 1000, quantity: 1 }],
    2000,
    5000,
    "",
    false
  );
  assert.equal(result.totalBasicLanded, 8000);
  assert.equal(result.gstPercentage, 18);
  assert.equal(result.gstAmount, 1440);
  assert.equal(result.grandTotal, 9440);
});

test("leaves GST as extra and does not add a grand total beyond basic landed", () => {
  const result = calculateQuotation(
    [
      { description: "System", unitPrice: 2588864, quantity: 1 },
      { description: "Cameras", unitPrice: 89950, quantity: 4 },
    ],
    25000,
    125000,
    18,
    true
  );
  assert.equal(result.totalBasicLanded, 3098664);
  assert.equal(result.gstAmount, 0);
  assert.equal(result.grandTotal, 3098664);
  assert.equal(result.gstAsExtra, true);
});
