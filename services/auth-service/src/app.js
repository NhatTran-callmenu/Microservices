
const express = require("express");

const healthRoutes = require(
    "./interfaces/http/routes/health.routes"
);

const authRoutes = require(
    "./interfaces/http/routes/auth.routes"
);

const app = express();

app.use(express.json({ limit: "16kb" }));

app.use(healthRoutes);
app.use(authRoutes);

module.exports = app;
