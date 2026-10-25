const express = require("express");
const controller = require("../controllers/ProductController");

const router = express.Router();

router.get("/categories", controller.getCategories);
router.get("/products", controller.getAll);
router.get("/products/:id", controller.getById);

router.post("/products", controller.create);
router.put("/products/:id", controller.update);
router.delete("/products/:id", controller.remove);

module.exports = router;