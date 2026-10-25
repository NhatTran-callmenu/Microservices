
const express = require("express");

const controller = require(
    "../controllers/CustomerController"
);

const router = express.Router();

router.get("/customers/:uid", controller.getCustomer);
router.post("/customers", controller.createCustomer);
router.put("/customers/:uid", controller.updateCustomer);

router.get("/memberships", controller.getMemberships);
router.get("/memberships/:mid", controller.getMembership);

module.exports = router;
