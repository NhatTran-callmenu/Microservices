const express = require("express");
const controller = require("../controllers/ShipmentController");

const router = express.Router();

router.get("/shipments", controller.getAll);
router.get("/shipments/order/:oid", controller.getByOrderId);
router.get("/shipments/:id", controller.getById);

router.post("/shipments", controller.create);
router.patch("/shipments/:id/status", controller.updateStatus);

module.exports = router;