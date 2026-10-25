
function orderAuth(req, res, next) {
    const user = req.user;

    if (!user) {
        return res.status(401).json({
            error: "Authentication required"
        });
    }

    // ADMIN can manage orders
    if (user.roleid === 1) {
        return next();
    }

    // Only CUSTOMER is allowed
    if (user.roleid !== 2) {
        return res.status(403).json({
            error: "Forbidden",
            message: "Insufficient permissions"
        });
    }

    // CUSTOMER can view their own orders
    const customerMatch = req.path.match(
        /^\/customer\/([1-9]\d*)\/?$/
    );

    if (req.method === "GET" && customerMatch) {
        const requestedUid = Number(customerMatch[1]);

        if (requestedUid !== user.uid) {
            return res.status(403).json({
                error: "Forbidden",
                message: "You can only view your own orders"
            });
        }

        return next();
    }

    // Allow CUSTOMER to create orders.
    // JSON body is parsed by Order Service.
    if (
        req.method === "POST" &&
        /^\/?$/.test(req.path)
    ) {
        // Forward authenticated user ID through
        // an internal header, not from the client.
        req.headers["x-authenticated-user-id"] =
            String(user.uid);

        return next();
    }

    // Other operations are restricted to ADMIN
    return res.status(403).json({
        error: "Forbidden",
        message: "Insufficient permissions"
    });
}

module.exports = orderAuth;
