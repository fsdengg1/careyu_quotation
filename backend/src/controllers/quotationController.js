const quotationService = require("../services/quotationService");
const pdfService = require("../services/pdfService");
const { buildPdfFilename } = require("../utils/pdfFilename");
const { renderQuotationHtml } = require("../pdf/template");

async function list(req, res, next) {
  try {
    const data = await quotationService.listQuotations(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function nextNumber(req, res, next) {
  try {
    const number = await quotationService.nextQuotationNumber(req.query.date || new Date());
    res.json({ quotationNumber: number });
  } catch (error) {
    next(error);
  }
}

async function getOne(req, res, next) {
  try {
    const data = await quotationService.getQuotation(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await quotationService.createQuotation(req.body, req.user?.id);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = await quotationService.updateQuotation(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await quotationService.deleteQuotation(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

async function duplicate(req, res, next) {
  try {
    const data = await quotationService.duplicateQuotation(req.params.id, req.user?.id);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function generatePdf(req, res, next) {
  try {
    if (req.body && Object.keys(req.body).length) {
      await quotationService.updateQuotation(req.params.id, { ...req.body, status: req.body.status || "generated" }, {
        forGenerate: true,
      });
    } else {
      await quotationService.updateQuotation(req.params.id, { status: "generated" }, { forGenerate: true });
    }
    const result = await pdfService.generatePdf(req.params.id);
    res.json({
      success: true,
      quotation: result.quotation,
      filename: result.filename,
    });
  } catch (error) {
    next(error);
  }
}

async function downloadPdf(req, res, next) {
  try {
    const quotation = await quotationService.getQuotation(req.params.id);
    let filePath = pdfService.getPdfPath(quotation);
    if (!filePath) {
      const generated = await pdfService.generatePdf(req.params.id);
      filePath = generated.path;
    }
    res.download(filePath, buildPdfFilename(quotation));
  } catch (error) {
    next(error);
  }
}

async function renderHtml(req, res, next) {
  try {
    const quotation = await quotationService.getQuotation(req.params.id);
    const html = renderQuotationHtml(quotation);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    next(error);
  }
}

async function dashboard(req, res, next) {
  try {
    const data = await quotationService.dashboardStats();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  nextNumber,
  getOne,
  create,
  update,
  remove,
  duplicate,
  generatePdf,
  downloadPdf,
  renderHtml,
  dashboard,
};
