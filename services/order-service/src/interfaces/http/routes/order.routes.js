const express = require("express");
const controller = require("../controllers/OrderController");

const router = express.Router();

router.get("/orders", controller.getAll);
router.get("/orders/customer/:uid", controller.getByCustomer);
router.get("/orders/:id", controller.getById);

router.post("/orders", controller.create);
router.patch("/orders/:id/status", controller.updateStatus);

module.exports = router;