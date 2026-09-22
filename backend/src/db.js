const { getDataSource } = require("./config/database");
const {
  User,
  Customer,
  CompanySettings,
  Quotation,
  QuotationItem,
  QuotationTerms,
} = require("./entities");

function repos(manager) {
  const source = manager || getDataSource();
  return {
    users: source.getRepository(User),
    customers: source.getRepository(Customer),
    settings: source.getRepository(CompanySettings),
    quotations: source.getRepository(Quotation),
    items: source.getRepository(QuotationItem),
    terms: source.getRepository(QuotationTerms),
  };
}

module.exports = { repos };
