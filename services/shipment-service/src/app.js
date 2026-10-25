const express = require("express");

const shipmentRoutes = require(
    "./interfaces/http/routes/shipment.routes"
);

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "shipment-service"
    });
});

app.use(shipmentRoutes);

module.exports = app;