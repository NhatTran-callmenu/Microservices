
require("dotenv").config();

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const ProductRepository = require(
    "./src/infrastructure/persistence/ProductRepository"
);
const pool = require(
    "./src/infrastructure/persistence/database"
);

const protoPath = path.resolve(
    __dirname,
    "../../protos/product.proto"
);

const definition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    defaults: true
});

const productProto =
    grpc.loadPackageDefinition(definition).product;

const client = new productProto.ProductService(
    "localhost:50053",
    grpc.credentials.createInsecure()
);

const repository = new ProductRepository();

function callGrpc(method, data) {
    return new Promise((resolve, reject) => {
        client[method](
            data,
            { deadline: Date.now() + 5000 },
            (error, response) => {
                if (error) return reject(error);
                resolve(response);
            }
        );
    });
}

async function main() {
    let oid;
    let reserved = false;

    try {
        // Tao ma don hang tam, tranh trung reservation cu
        oid = 100000000 + Math.floor(Math.random() * 100000000);

        const before = await repository.findById(1);

        if (!before) {
            throw new Error("Product PID 1 not found");
        }

        console.log("STOCK BEFORE:", before.stock);

        const product = await callGrpc("GetProduct", {
            pid: 1
        });

        console.log("GET PRODUCT:", product);

        if (before.stock < 1) {
            throw new Error("Not enough stock for test");
        }

        const first = await callGrpc("ReserveStock", {
            oid,
            pid: 1,
            quantity: 1
        });

        console.log("RESERVE:", first);
        reserved = first.success;

        if (!reserved) {
            throw new Error("Reservation failed");
        }

        const duplicate = await callGrpc("ReserveStock", {
            oid,
            pid: 1,
            quantity: 1
        });

        console.log("DUPLICATE RESERVE:", duplicate);

        const afterReserve = await repository.findById(1);

        console.log("STOCK AFTER RESERVE:", afterReserve.stock);

        const released = await callGrpc("ReleaseStock", {
            oid,
            pid: 1,
            quantity: 1
        });

        console.log("RELEASE:", released);

        const duplicateRelease = await callGrpc("ReleaseStock", {
            oid,
            pid: 1,
            quantity: 1
        });

        console.log("DUPLICATE RELEASE:", duplicateRelease);

        const after = await repository.findById(1);

        console.log("STOCK AFTER RELEASE:", after.stock);

        const passed =
            product.pid === 1 &&
            first.success === true &&
            duplicate.success === true &&
            duplicate.message === "ALREADY_RESERVED" &&
            afterReserve.stock === before.stock - 1 &&
            released.success === true &&
            duplicateRelease.message === "ALREADY_RELEASED" &&
            after.stock === before.stock;

        console.log("ALL TESTS PASSED:", passed);

        if (!passed) process.exitCode = 1;

    } catch (error) {
        console.error("gRPC TEST ERROR:", error.message);
        process.exitCode = 1;
    } finally {
        // Don dep neu test dung giua chung
        if (reserved && oid) {
            try {
                await repository.releaseStock(oid, 1);
            } catch (error) {
                console.error("CLEANUP ERROR:", error.message);
            }
        }

        client.close();
        await pool.end();
    }
}

main();
