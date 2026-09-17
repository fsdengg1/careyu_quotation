const express = require("express");
const { authRequired } = require("../middleware/auth");
const authController = require("../controllers/authController");
const quotationController = require("../controllers/quotationController");
const customerController = require("../controllers/customerController");
const settingsController = require("../controllers/settingsController");

const router = express.Router();

router.post("/auth/login", authController.login);
router.get("/auth/me", authRequired, authController.me);

router.get("/dashboard", authRequired, quotationController.dashboard);

router.get("/quotations/next-number", authRequired, quotationController.nextNumber);
router.get("/quotations", authRequired, quotationController.list);
router.post("/quotations", authRequired, quotationController.create);
router.get("/quotations/:id", authRequired, quotationController.getOne);
router.put("/quotations/:id", authRequired, quotationController.update);
router.delete("/quotations/:id", authRequired, quotationController.remove);
router.post("/quotations/:id/duplicate", authRequired, quotationController.duplicate);
router.post("/quotations/:id/generate-pdf", authRequired, quotationController.generatePdf);
router.get("/quotations/:id/pdf", authRequired, quotationController.downloadPdf);
router.get("/quotations/:id/html", authRequired, quotationController.renderHtml);

router.get("/customers", authRequired, customerController.list);
router.post("/customers", authRequired, customerController.create);
router.put("/customers/:id", authRequired, customerController.update);
router.delete("/customers/:id", authRequired, customerController.remove);

router.get("/settings", authRequired, settingsController.get);
router.put("/settings", authRequired, settingsController.update);

module.exports = router;
