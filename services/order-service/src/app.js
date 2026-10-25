const express = require("express");
const orderRoutes = require("./interfaces/http/routes/order.routes");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "order-service"
    });
});

app.use(orderRoutes);

module.exports = app;