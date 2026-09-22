const User = require("./User");
const Customer = require("./Customer");
const CompanySettings = require("./CompanySettings");
const Quotation = require("./Quotation");
const QuotationItem = require("./QuotationItem");
const QuotationTerms = require("./QuotationTerms");

const entities = [User, Customer, CompanySettings, Quotation, QuotationItem, QuotationTerms];

module.exports = {
  User,
  Customer,
  CompanySettings,
  Quotation,
  QuotationItem,
  QuotationTerms,
  entities,
};
