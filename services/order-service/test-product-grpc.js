
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const protoPath = path.resolve(
    __dirname,
    "../../protos/product.proto"
);

const definition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true
});

const productProto =
    grpc.loadPackageDefinition(definition).product;

const client = new productProto.ProductService(
    process.env.PRODUCT_GRPC_HOST || "product-service:50053",
    grpc.credentials.createInsecure()
);

client.GetProduct(
    { pid: 1 },
    { deadline: Date.now() + 5000 },
    (error, product) => {
        if (error) {
            console.error("PRODUCT gRPC ERROR:", error.message);
            process.exitCode = 1;
        } else {
            console.log("PRODUCT:", product);
            console.log("GET PRODUCT TEST PASSED: true");
        }

        client.close();
    }
);
