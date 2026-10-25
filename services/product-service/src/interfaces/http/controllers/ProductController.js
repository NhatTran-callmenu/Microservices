const ProductRepository = require(
    "../../../infrastructure/persistence/ProductRepository"
);

const repository = new ProductRepository();

function validId(value) {
    return /^[1-9]\d*$/.test(String(value)) &&
        Number.isSafeInteger(Number(value));
}

function validProduct(data) {
    return typeof data.pname === "string" &&
        data.pname.trim().length > 0 &&
        Number.isFinite(data.price) &&
        data.price >= 0 &&
        Number.isInteger(data.stock) &&
        data.stock >= 0 &&
        Number.isInteger(data.cid) &&
        data.cid > 0;
}

function handleError(error, res) {
    console.error("Product error:", error.message);

    if (error.code === "23503") {
        return res.status(400).json({
            error: "Category does not exist"
        });
    }

    return res.status(500).json({
        error: "Internal server error"
    });
}

exports.getAll = async (req, res) => {
    try {
        const products = await repository.findAll();
        res.json(products);
    } catch (error) {
        handleError(error, res);
    }
};

exports.getById = async (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({ error: "Invalid product ID" });
    }

    try {
        const product = await repository.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        res.json(product);
    } catch (error) {
        handleError(error, res);
    }
};

exports.create = async (req, res) => {
    if (!validProduct(req.body)) {
        return res.status(400).json({ error: "Invalid product data" });
    }

    try {
        const product = await repository.create(req.body);
        res.status(201).json(product);
    } catch (error) {
        handleError(error, res);
    }
};

exports.update = async (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({ error: "Invalid product ID" });
    }

    if (!validProduct(req.body)) {
        return res.status(400).json({ error: "Invalid product data" });
    }

    try {
        const product = await repository.update(req.params.id, req.body);

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        res.json(product);
    } catch (error) {
        handleError(error, res);
    }
};

exports.remove = async (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({ error: "Invalid product ID" });
    }

    try {
        const product = await repository.delete(req.params.id);

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        handleError(error, res);
    }
};

exports.getCategories = async (req, res) => {
    try {
        res.json(await repository.findCategories());
    } catch (error) {
        handleError(error, res);
    }
};