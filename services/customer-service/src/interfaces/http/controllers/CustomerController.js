
const useCases = require(
    "../../../application/use-cases/CustomerUseCases"
);

function handleError(error, res) {
    console.error(error);

    if (error.code === "23505") {
        return res.status(409).json({
            error: "Customer already exists"
        });
    }

    if (error.code === "23503") {
        return res.status(400).json({
            error: "Invalid membership"
        });
    }

    return res.status(500).json({
        error: "Internal server error"
    });
}

const getCustomer = async (req, res) => {
    try {
        const customer = await useCases.getCustomer(
            req.params.uid
        );

        if (!customer) {
            return res.status(404).json({
                error: "Customer not found"
            });
        }

        return res.json(customer);
    } catch (error) {
        return handleError(error, res);
    }
};

const createCustomer = async (req, res) => {
    try {
        const { uid, fullname, mid } = req.body;

        if (!Number.isInteger(uid) ||
            !Number.isInteger(mid) ||
            typeof fullname !== "string" ||
            !fullname.trim()) {
            return res.status(400).json({
                error: "Invalid customer data"
            });
        }

        const customer = await useCases.createCustomer({
            uid,
            fullname: fullname.trim(),
            mid
        });

        return res.status(201).json(customer);
    } catch (error) {
        return handleError(error, res);
    }
};

const updateCustomer = async (req, res) => {
    try {
        const { fullname, mid } = req.body;

        if (typeof fullname !== "string" ||
            !fullname.trim() ||
            !Number.isInteger(mid)) {
            return res.status(400).json({
                error: "Invalid customer data"
            });
        }

        const customer = await useCases.updateCustomer(
            req.params.uid,
            { fullname: fullname.trim(), mid }
        );

        if (!customer) {
            return res.status(404).json({
                error: "Customer not found"
            });
        }

        return res.json(customer);
    } catch (error) {
        return handleError(error, res);
    }
};

const getMemberships = async (req, res) => {
    try {
        return res.json(await useCases.getMemberships());
    } catch (error) {
        return handleError(error, res);
    }
};

const getMembership = async (req, res) => {
    try {
        const membership = await useCases.getMembership(
            req.params.mid
        );

        if (!membership) {
            return res.status(404).json({
                error: "Membership not found"
            });
        }

        return res.json(membership);
    } catch (error) {
        return handleError(error, res);
    }
};

module.exports = {
    getCustomer,
    createCustomer,
    updateCustomer,
    getMemberships,
    getMembership
};
