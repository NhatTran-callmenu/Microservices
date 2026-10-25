
const ProductRepository = require(
    "../../../infrastructure/persistence/ProductRepository"
);

const repository = new ProductRepository();

const validId = value =>
    Number.isSafeInteger(value) && value > 0;

exports.reserve = async (req, res) => {
    const { oid, pid, quantity } = req.body || {};

    if (
        !Number.isSafeInteger(oid) ||
        !validId(pid) ||
        !validId(quantity)
    ) {
        return res.status(400).json({
            error: "Invalid stock reservation data"
        });
    }

    try {
        const result = await repository.reserveStock(
            oid, pid, quantity
        );

        if (!result.reserved) {
            return res.status(409).json(result);
        }

        return res.json(result);
    } catch (error) {
        console.error("Reserve stock error:", error.message);
        return res.status(500).json({
            error: "Unable to reserve stock"
        });
    }
};

exports.release = async (req, res) => {
    const { oid, pid } = req.body || {};

    if (!Number.isSafeInteger(oid) || !validId(pid)) {
        return res.status(400).json({
            error: "Invalid stock release data"
        });
    }

    try {
        const result = await repository.releaseStock(oid, pid);
        return res.json(result);
    } catch (error) {
        console.error("Release stock error:", error.message);
        return res.status(500).json({
            error: "Unable to release stock"
        });
    }
};
