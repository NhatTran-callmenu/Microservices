
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const ProductRepository = require(
    "../../infrastructure/persistence/ProductRepository"
);

const repository = new ProductRepository();

const protoPath = path.resolve(
    __dirname,
    "../../../../../protos/product.proto"
);

const definition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true
});

const productProto = grpc.loadPackageDefinition(
    definition
).product;

async function getProduct(call, callback) {
    try {
        const product = await repository.findById(
            call.request.pid
        );

        if (!product) {
            return callback({
                code: grpc.status.NOT_FOUND,
                message: "Product not found"
            });
        }

        callback(null, {
            pid: product.pid,
            pname: product.pname,
            price: String(product.price),
            quantity: product.stock
        });
    } catch (error) {
        console.error("GetProduct gRPC:", error.message);
        callback({
            code: grpc.status.INTERNAL,
            message: "Unable to get product"
        });
    }
}

async function reserveStock(call, callback) {
    try {
        const { oid, pid, quantity } = call.request;

        if (oid <= 0 || pid <= 0 || quantity <= 0) {
            return callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: "Invalid reservation data"
            });
        }

        const result = await repository.reserveStock(
            oid, pid, quantity
        );

        callback(null, {
            success: result.reserved,
            message: result.reserved
                ? (result.alreadyReserved
                    ? "ALREADY_RESERVED"
                    : "RESERVED")
                : result.reason
        });
    } catch (error) {
        console.error("ReserveStock gRPC:", error.message);
        callback({
            code: grpc.status.INTERNAL,
            message: "Unable to reserve stock"
        });
    }
}

async function releaseStock(call, callback) {
    try {
        const { oid, pid } = call.request;

        if (oid <= 0 || pid <= 0) {
            return callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: "Invalid release data"
            });
        }

        const result = await repository.releaseStock(
            oid, pid
        );

        callback(null, {
            success: result.released,
            message: result.alreadyReleased
                ? "ALREADY_RELEASED"
                : "RELEASED"
        });
    } catch (error) {
        console.error("ReleaseStock gRPC:", error.message);
        callback({
            code: grpc.status.INTERNAL,
            message: "Unable to release stock"
        });
    }
}

function startGrpcServer() {
    const server = new grpc.Server();

    server.addService(productProto.ProductService.service, {
        GetProduct: getProduct,
        ReserveStock: reserveStock,
        ReleaseStock: releaseStock
    });

    const port = Number(process.env.GRPC_PORT || 50053);

    server.bindAsync(
        `0.0.0.0:${port}`,
        grpc.ServerCredentials.createInsecure(),
        (error) => {
            if (error) {
                console.error("Product gRPC error:", error.message);
                return;
            }

            console.log(`Product gRPC running on port ${port}`);
        }
    );

    return server;
}

module.exports = { startGrpcServer };
