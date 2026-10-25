const express = require("express");

const productRoutes = require("./interfaces/http/routes/product.routes");
const stockRoutes = require("./interfaces/http/routes/stock.routes");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "product-service"
    });
});

app.use(productRoutes);
app.use("/internal/stock", stockRoutes);

module.exports = app;