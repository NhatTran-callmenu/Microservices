
const express = require("express");

const healthRoutes = require(
    "./interfaces/http/routes/health.routes"
);

const customerRoutes = require(
    "./interfaces/http/routes/customer.routes"
);

const app = express();

app.use(express.json());

app.use(healthRoutes);
app.use(customerRoutes);

module.exports = app;
