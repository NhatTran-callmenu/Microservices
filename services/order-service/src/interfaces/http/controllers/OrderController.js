
const DiscountService = require(
    "../../../domain/services/DiscountService"
);

const OrderRepository = require(
    "../../../infrastructure/persistence/OrderRepository"
);

const StockClient = require(
    "../../../infrastructure/clients/StockClient"
);

const CustomerGrpcClient = require(
    "../../../infrastructure/clients/CustomerGrpcClient"
);

const AuthGrpcClient = require(
    "../../../infrastructure/clients/AuthGrpcClient"
);

// ==========================================
// INITIALIZE SERVICES
// ==========================================

const stockClient = new StockClient();
const repository = new OrderRepository();
const customerGrpcClient = new CustomerGrpcClient();
const authGrpcClient = new AuthGrpcClient();

const PRODUCT_URL =
    process.env.PRODUCT_SERVICE_URL || "http://localhost:3003";

// ==========================================
// VALIDATION HELPERS
// ==========================================

const validId = value =>
    /^[1-9]\d*$/.test(String(value)) &&
    Number.isSafeInteger(Number(value));

function validShipping(shipping) {
    if (
        !shipping ||
        typeof shipping !== "object" ||
        Array.isArray(shipping)
    ) {
        return false;
    }

    const fields = [
        "receiver_name",
        "receiver_phone",
        "shipping_address"
    ];

    if (!fields.every(field =>
        typeof shipping[field] === "string" &&
        shipping[field].trim().length > 0
    )) {
        return false;
    }

    return (
        shipping.receiver_name.trim().length <= 150 &&
        shipping.receiver_phone.trim().length <= 20
    );
}

function toCents(value) {
    const str = String(value);

    if (!/^\d+(\.\d{1,2})?$/.test(str)) {
        throw new Error("Invalid product price");
    }

    const [whole, decimal = ""] = str.split(".");

    const cents =
        BigInt(whole) * 100n +
        BigInt(decimal.padEnd(2, "0"));

    if (cents > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new Error("Product price exceeds supported range");
    }

    return Number(cents);
}

function money(cents) {
    return (cents / 100).toFixed(2);
}

// ==========================================
// PRODUCT SERVICE - REST
// ==========================================

async function getProduct(pid) {
    const response = await fetch(
        `${PRODUCT_URL}/products/${pid}`,
        { signal: AbortSignal.timeout(5000) }
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error("Product Service unavailable");
    }

    return response.json();
}

// ==========================================
// CREATE ORDER
// ==========================================


exports.create = async (req, res) => {
    // Verify JWT independently through Auth gRPC
    const authorization = req.headers.authorization || "";

    const match = authorization.match(/^Bearer\s+(\S+)$/);

    if (!match) {
        return res.status(401).json({
            error: "Authentication required"
        });
    }

    let authenticatedUser;

    try {
        authenticatedUser = await authGrpcClient.verifyToken(
            match[1]
        );
    } catch (error) {
        console.error(
            "Auth gRPC verification error:",
            error.message
        );

        return res.status(503).json({
            error: "Authentication service unavailable"
        });
    }

    if (
        !authenticatedUser.valid ||
        !Number.isInteger(authenticatedUser.uid) ||
        authenticatedUser.uid <= 0 ||
        ![1, 2].includes(authenticatedUser.roleid)
    ) {
        return res.status(401).json({
            error: "Invalid or expired token"
        });
    }

    const { uid, items, shipping } = req.body || {};

    // CUSTOMER may only create their own order
    if (
        authenticatedUser.roleid === 2 &&
        Number(uid) !== authenticatedUser.uid
    ) {
        return res.status(403).json({
            error: "Forbidden",
            message: "You can only create your own orders"
        });
    }

    // The original validation and order creation
    // logic continues below.


    // 1. Validate order data
    if (
        !validId(uid) ||
        !Array.isArray(items) ||
        items.length === 0 ||
        items.length > 50 ||
        items.some(item =>
            !item ||
            !validId(item.pid) ||
            !validId(item.quantity)
        )
    ) {
        return res.status(400).json({
            error: "Invalid order data"
        });
    }

    // 2. Validate shipping information
    // Keep compatibility with older requests
    if (
        shipping !== undefined &&
        !validShipping(shipping)
    ) {
        return res.status(400).json({
            error: "Invalid shipping information"
        });
    }

    // 3. Prevent duplicate product IDs
    const uniqueIds = new Set(
        items.map(item => String(Number(item.pid)))
    );

    if (uniqueIds.size !== items.length) {
        return res.status(400).json({
            error: "Duplicate product IDs"
        });
    }

    let order = null;
    const reservedItems = [];

    try {
        const orderItems = [];
        let totalCents = 0;

        // ==================================
        // STEP 1: GET PRODUCTS AND PRICES
        // ==================================

        for (const item of items) {
            const product = await getProduct(item.pid);

            if (!product) {
                return res.status(400).json({
                    error: `Product ${item.pid} not found`
                });
            }

            if (Number(item.quantity) > product.stock) {
                return res.status(409).json({
                    error:
                        `Insufficient stock for product ${item.pid}`
                });
            }

            const priceCents = toCents(product.price);

            const subtotalCents =
                priceCents * Number(item.quantity);

            if (
                !Number.isSafeInteger(subtotalCents) ||
                !Number.isSafeInteger(
                    totalCents + subtotalCents
                )
            ) {
                return res.status(400).json({
                    error: "Order total exceeds supported range"
                });
            }

            totalCents += subtotalCents;

            orderItems.push({
                pid: Number(item.pid),
                quantity: Number(item.quantity),
                unit_price: money(priceCents),
                subtotal: money(subtotalCents)
            });
        }

        // ==================================
        // STEP 2: GET CUSTOMER VIA gRPC
        // ==================================

        const customer =
            await customerGrpcClient.getCustomer(
                Number(uid)
            );

        if (!customer) {
            return res.status(400).json({
                error: "Customer not found"
            });
        }

        // ==================================
        // STEP 3: GET MEMBERSHIP VIA gRPC
        // ==================================

        const membership =
            await customerGrpcClient.getMembership(
                Number(uid)
            );

        if (!membership) {
            return res.status(400).json({
                error: "Customer membership not found"
            });
        }

        // ==================================
        // STEP 4: CALCULATE DISCOUNT
        // ==================================

        const discount = DiscountService.calculate(
            totalCents,
            membership.mname,
            membership.score
        );

        // ==================================
        // STEP 5: CREATE ORDER
        // ==================================

        order = await repository.createOrder(
            Number(uid),
            orderItems,
            discount.totalAmount,
            discount.subtotalAmount,
            discount.discountPercent,
            discount.discountAmount,
            shipping === undefined
                ? null
                : {
                    receiver_name:
                        shipping.receiver_name.trim(),
                    receiver_phone:
                        shipping.receiver_phone.trim(),
                    shipping_address:
                        shipping.shipping_address.trim()
                }
        );

        // ==================================
        // STEP 6: RESERVE STOCK VIA gRPC
        // ==================================

        for (const item of orderItems) {
            const result = await stockClient.reserve(
                order.oid,
                item.pid,
                item.quantity
            );

            if (!result.reserved) {
                const error = new Error(
                    "Stock reservation rejected"
                );

                error.status = 409;
                throw error;
            }

            reservedItems.push(item.pid);
        }

        // ==================================
        // STEP 7: CONFIRM ORDER AND OUTBOX
        // ==================================

        await repository.confirmOrderAndCreateEvent(
            order.oid
        );

        const completedOrder =
            await repository.findById(order.oid);

        return res.status(201).json(completedOrder);

    } catch (error) {
        console.error(
            "Create order error:",
            error.message
        );

        if (!order) {
            return res.status(500).json({
                error: "Unable to create order"
            });
        }

        // Unknown stock outcomes need reconciliation.
        // Do not release stock when the outcome is unclear.
        if (error.status !== 409) {
            return res.status(503).json({
                error: "Order requires stock reconciliation",
                oid: order.oid,
                status: "RESERVING"
            });
        }

        // ==================================
        // COMPENSATE SUCCESSFUL RESERVATIONS
        // ==================================

        try {
            for (const pid of reservedItems) {
                await stockClient.release(
                    order.oid,
                    pid
                );
            }

            await repository.updateStatus(
                order.oid,
                "CANCELLED"
            );

            return res.status(409).json({
                error: "Insufficient or conflicting stock",
                oid: order.oid,
                status: "CANCELLED"
            });

        } catch (releaseError) {
            console.error(
                "Stock compensation error:",
                releaseError.message
            );

            return res.status(503).json({
                error: "Stock reconciliation required",
                oid: order.oid,
                status: "RESERVING"
            });
        }
    }
};

// ==========================================
// GET ALL ORDERS
// ==========================================

exports.getAll = async (req, res) => {
    try {
        const orders = await repository.findAll();

        return res.json(orders);

    } catch (error) {
        console.error(error.message);

        return res.status(500).json({
            error: "Unable to get orders"
        });
    }
};

// ==========================================
// GET ORDER BY ID
// ==========================================

exports.getById = async (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({
            error: "Invalid order ID"
        });
    }

    try {
        const order = await repository.findById(
            req.params.id
        );

        if (!order) {
            return res.status(404).json({
                error: "Order not found"
            });
        }

        return res.json(order);

    } catch (error) {
        console.error(error.message);

        return res.status(500).json({
            error: "Unable to get order"
        });
    }
};

// ==========================================
// GET ORDERS BY CUSTOMER
// ==========================================

exports.getByCustomer = async (req, res) => {
    if (!validId(req.params.uid)) {
        return res.status(400).json({
            error: "Invalid customer ID"
        });
    }

    try {
        const orders = await repository.findByCustomer(
            req.params.uid
        );

        return res.json(orders);

    } catch (error) {
        console.error(error.message);

        return res.status(500).json({
            error: "Unable to get customer orders"
        });
    }
};

// ==========================================
// UPDATE ORDER STATUS
// ==========================================

exports.updateStatus = async (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({
            error: "Invalid order ID"
        });
    }

    const validStatuses = [
        "PENDING",
        "CONFIRMED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED"
    ];

    const status = req.body?.status;

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            error: "Invalid order status"
        });
    }

    try {
        const order = await repository.updateStatus(
            req.params.id,
            status
        );

        if (!order) {
            return res.status(404).json({
                error: "Order not found"
            });
        }

        return res.json(order);

    } catch (error) {
        console.error(error.message);

        return res.status(500).json({
            error: "Unable to update order"
        });
    }
};
