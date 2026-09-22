const { randomUUID } = require("crypto");

function newId() {
  return randomUUID();
}

const decimalTransformer = {
  to(value) {
    return value;
  },
  from(value) {
    if (value == null || value === "") return value;
    return Number(value);
  },
};

module.exports = { newId, decimalTransformer };
