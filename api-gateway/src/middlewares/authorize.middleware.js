
function authorize(...allowedRoles) {
    return (req, res, next) => {
        // 1. Kiem tra User da xac thuc
        if (!req.user) {
            return res.status(401).json({
                error: "Authentication required"
            });
        }

        // 2. Kiem tra quyen truy cap
        if (!allowedRoles.includes(req.user.roleid)) {
            return res.status(403).json({
                error: "Forbidden",
                message: "Insufficient permissions"
            });
        }

        // 3. Cho phep tiep tuc
        return next();
    };
}

module.exports = authorize;
