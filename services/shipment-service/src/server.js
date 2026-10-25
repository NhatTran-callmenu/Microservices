
require("dotenv").config();

const app = require("./app");

const {
    startShipmentConsumer,
    stopShipmentConsumer
} = require("./infrastructure/messaging/ShipmentConsumer");

const PORT = Number(process.env.PORT || 3005);

const server = app.listen(PORT, () => {
    console.log(`Shipment Service running on port ${PORT}`);
});

startShipmentConsumer().catch(error => {
    console.error(
        "Shipment Kafka startup error:",
        error.message
    );
});

let shuttingDown = false;

async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;

    try {
        await stopShipmentConsumer();
    } catch (error) {
        console.error(
            "Shipment Kafka shutdown error:",
            error.message
        );
    }

    server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
