
const authenticate = require("./auth.middleware");
const authorize = require("./authorize.middleware");

function productAuth(req, res, next) {
    // Chi bao ve cac thao tac thay doi san pham
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        return next();
    }

    // POST, PUT, PATCH, DELETE yeu cau ADMIN
    authenticate(req, res, () => {
        authorize(1)(req, res, next);
    });
}

module.exports = productAuth;
