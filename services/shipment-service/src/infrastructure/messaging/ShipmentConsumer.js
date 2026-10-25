
const { Kafka } = require("kafkajs");

const ShipmentRepository = require(
    "../persistence/ShipmentRepository"
);

const repository = new ShipmentRepository();

const kafka = new Kafka({
    clientId: "shipment-service",
    brokers: (
        process.env.KAFKA_BROKERS || "localhost:9092"
    ).split(",")
});

const consumer = kafka.consumer({
    groupId: "shipment-order-created-group"
});

let connected = false;

function validId(value) {
    return Number.isSafeInteger(Number(value)) &&
        Number(value) > 0;
}

function validShipping(event) {
    return [
        "receiver_name",
        "receiver_phone",
        "shipping_address"
    ].every(field =>
        typeof event[field] === "string" &&
        event[field].trim().length > 0
    );
}

async function startShipmentConsumer() {
    await consumer.connect();
    connected = true;

    await consumer.subscribe({
        topic: "order-created",
        fromBeginning: true
    });

    console.log("Shipment Kafka Consumer connected");

    await consumer.run({
        eachMessage: async ({ message }) => {
            const raw = message.value?.toString();

            if (!raw) {
                console.warn("Skipping empty Kafka message");
                return;
            }

            let event;

            try {
                event = JSON.parse(raw);
            } catch (error) {
                console.error(
                    "Skipping invalid Kafka JSON:",
                    error.message
                );
                return;
            }

            // Ignore OutboxTest and unrelated events
            if (event.eventType !== "OrderCreated") {
                console.log(
                    "Ignored Kafka event:",
                    event.eventType
                );
                return;
            }

            if (!validId(event.oid)) {
                console.error(
                    "Skipping OrderCreated with invalid oid"
                );
                return;
            }

            // Old orders may not contain shipping data
            if (!validShipping(event)) {
                console.warn(
                    `Order ${event.oid}: shipping information missing; ` +
                    "automatic shipment was not created"
                );
                return;
            }

            // A new order should be ready for preparation
            if (event.status !== "PENDING") {
                console.warn(
                    `Skipping Order ${event.oid}: unexpected status`
                );
                return;
            }

            try {
                const result =
                    await repository.createFromOrderEvent({
                        oid: Number(event.oid),
                        receiver_name:
                            event.receiver_name.trim(),
                        receiver_phone:
                            event.receiver_phone.trim(),
                        shipping_address:
                            event.shipping_address.trim()
                    });

                if (result.created) {
                    console.log(
                        `Shipment created for Order ${event.oid}: ` +
                        `SID ${result.shipment.sid}`
                    );
                } else {
                    console.log(
                        `Shipment already exists for Order ${event.oid}`
                    );
                }
            } catch (error) {
                console.error(
                    `Shipment creation failed for Order ${event.oid}:`,
                    error.message
                );

                // Let KafkaJS retry rather than acknowledge
                throw error;
            }
        }
    });
}

async function stopShipmentConsumer() {
    if (connected) {
        await consumer.disconnect();
        connected = false;
    }
}

module.exports = {
    startShipmentConsumer,
    stopShipmentConsumer
};
