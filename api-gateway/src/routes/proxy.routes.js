
const express = require("express");
const {
    createProxyMiddleware,
    fixRequestBody
} = require("http-proxy-middleware");

const router = express.Router();

const services = [
    {
        path: "/api/auth",
        port: 3001,
        host: process.env.AUTH_SERVICE_HOST || "localhost"
    },
    {
        path: "/api/customers",
        port: 3002,
        host: process.env.CUSTOMER_SERVICE_HOST || "localhost"
    },
    {
        path: "/api/products",
        port: 3003,
        host: process.env.PRODUCT_SERVICE_HOST || "localhost"
    },
    {
        path: "/api/orders",
        port: 3004,
        host: process.env.ORDER_SERVICE_HOST || "localhost"
    },
    {
        path: "/api/shipments",
        port: 3005,
        host: process.env.SHIPMENT_SERVICE_HOST || "localhost"
    }
];

services.forEach(({ path, port, host }) => {
    router.use(
        path,
        createProxyMiddleware({
            target: `http://${host}:${port}`,
            changeOrigin: true,
            
        pathRewrite: (requestPath) => {
            if (path === "/api/customers") {
                if (requestPath === "/memberships") {
                    return "/memberships";
                }

                return "/customers" + requestPath;
            }

            if (path === "/api/products") {
                if (requestPath === "/categories") {
                    return "/categories";
                }

                return "/products" + requestPath;
            }

            if (path === "/api/orders") {
                return "/orders" + requestPath;
            }
            if (path === "/api/shipments") {
                return "/shipments" + requestPath;
            }
            return requestPath;
        },
on: {
    proxyReq: (proxyReq, req, res) => {
    console.log(
        "[PROXY REQUEST]",
        req.method,
        req.originalUrl
    );
},

    error: (err, req, res) => {
        console.error("Proxy error:", err.message);

        if (!res.headersSent) {
            res.writeHead(502, {
                "Content-Type": "application/json"
            });
        }

        res.end(JSON.stringify({
            error: "Bad Gateway",
            message: "Backend service unavailable"
        }));
    }
}
            
        })
    );
});

module.exports = router;
