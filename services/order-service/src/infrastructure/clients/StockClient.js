
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");


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

const productProto =
    grpc.loadPackageDefinition(definition).product;

class StockClient {
    constructor() {
        const host =
            process.env.PRODUCT_GRPC_HOST ||
            "localhost:50053";

        this.client = new productProto.ProductService(
            host,
            grpc.credentials.createInsecure()
        );
    }

    request(method, data) {
        return new Promise((resolve, reject) => {
            this.client[method](
                data,
                {
                    deadline: Date.now() + 5000
                },
                (error, response) => {
                    if (error) {
                        const failure = new Error(
                            "Stock request outcome unknown; reconciliation required"
                        );

                        failure.code = "STOCK_OUTCOME_UNKNOWN";
                        failure.cause = error;

                        return reject(failure);
                    }

                    resolve(response);
                }
            );
        });
    }

    async reserve(oid, pid, quantity) {
        const result = await this.request(
            "ReserveStock",
            { oid, pid, quantity }
        );

        return {
            reserved: result.success,
            reason: result.success
                ? null
                : result.message,
            alreadyReserved:
                result.message === "ALREADY_RESERVED"
        };
    }

    async release(oid, pid) {
        const result = await this.request(
            "ReleaseStock",
            { oid, pid, quantity: 0 }
        );

        if (!result.success) {
            throw new Error(
                result.message || "Stock release rejected"
            );
        }

        return {
            released: true,
            alreadyReleased:
                result.message === "ALREADY_RELEASED"
        };
    }
}

module.exports = StockClient;
