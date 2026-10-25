
const express = require("express");

const internalAuth = require("../middlewares/internalAuth");
const controller = require("../controllers/StockController");

const router = express.Router();

router.use(internalAuth);

router.post("/reserve", controller.reserve);
router.post("/release", controller.release);

module.exports = router;
