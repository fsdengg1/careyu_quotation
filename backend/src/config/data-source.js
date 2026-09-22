require("dotenv").config();
const { createDataSource } = require("./database");

module.exports = createDataSource();
