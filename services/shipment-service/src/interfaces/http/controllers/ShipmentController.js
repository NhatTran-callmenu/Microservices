
const ShipmentRepository = require(
    "../../../infrastructure/persistence/ShipmentRepository"
);

const repository = new ShipmentRepository();

const ORDER_URL =
    process.env.ORDER_SERVICE_URL || "http://localhost:3004";

const validId = value =>
    /^[1-9]\d*$/.test(String(value)) &&
    Number.isSafeInteger(Number(value));

function handleError(error, res) {
    console.error("Shipment error:", error.message);

    if (error.code === "23505") {
        return res.status(409).json({
            error: "Shipment or tracking number already exists"
        });
    }

    if (error.code === "23514") {
        return res.status(400).json({
            error: "Invalid shipment status"
        });
    }

    return res.status(500).json({
        error: "Internal server error"
    });
}

exports.getAll = async (req, res) => {
    try {
        res.json(await repository.findAll());
    } catch (error) {
        handleError(error, res);
    }
};

exports.getById = async (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({
            error: "Invalid shipment ID"
        });
    }

    try {
        const shipment = await repository.findById(req.params.id);

        if (!shipment) {
            return res.status(404).json({
                error: "Shipment not found"
            });
        }

        res.json(shipment);
    } catch (error) {
        handleError(error, res);
    }
};

exports.getByOrderId = async (req, res) => {
    if (!validId(req.params.oid)) {
        return res.status(400).json({
            error: "Invalid order ID"
        });
    }

    try {
        const shipment = await repository.findByOrderId(
            req.params.oid
        );

        if (!shipment) {
            return res.status(404).json({
                error: "Shipment not found"
            });
        }

        res.json(shipment);
    } catch (error) {
        handleError(error, res);
    }
};

exports.create = async (req, res) => {
    const data = req.body || {};

    if (
        !validId(data.oid) ||
        typeof data.receiver_name !== "string" ||
        !data.receiver_name.trim() ||
        typeof data.receiver_phone !== "string" ||
        !data.receiver_phone.trim() ||
        typeof data.shipping_address !== "string" ||
        !data.shipping_address.trim() ||
        (data.carrier != null &&
            typeof data.carrier !== "string") ||
        (data.tracking_number != null &&
            typeof data.tracking_number !== "string")
    ) {
        return res.status(400).json({
            error: "Invalid shipment data"
        });
    }

    let order;

    try {
        const response = await fetch(
            `${ORDER_URL}/orders/${data.oid}`,
            { signal: AbortSignal.timeout(5000) }
        );

        if (response.status === 404) {
            return res.status(400).json({
                error: "Order does not exist"
            });
        }

        if (!response.ok) {
            return res.status(502).json({
                error: "Order Service unavailable"
            });
        }

        order = await response.json();
    } catch (error) {
        console.error("Order lookup error:", error.message);

        return res.status(502).json({
            error: "Cannot connect to Order Service"
        });
    }

    if (order.status !== "CONFIRMED") {
        return res.status(400).json({
            error: "Only confirmed orders can be shipped"
        });
    }

    try {
        const shipment = await repository.create(data);
        return res.status(201).json(shipment);
    } catch (error) {
        return handleError(error, res);
    }
};

exports.updateStatus = async (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({
            error: "Invalid shipment ID"
        });
    }

    const validStatuses = [
        "PENDING",
        "PICKED_UP",
        "IN_TRANSIT",
        "DELIVERED",
        "FAILED",
        "RETURNED"
    ];

    const status = req.body?.status;

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            error: "Invalid shipment status"
        });
    }

    try {
        const shipment = await repository.updateStatus(
            req.params.id,
            status
        );

        if (!shipment) {
            return res.status(404).json({
                error: "Shipment not found"
            });
        }

        return res.json(shipment);
    } catch (error) {
        handleError(error, res);
    }
};
