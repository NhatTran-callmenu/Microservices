
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const protoPath = path.resolve(
    __dirname,
    "../../protos/customer.proto"
);

const definition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    defaults: true
});

const customerProto =
    grpc.loadPackageDefinition(definition).customer;

const client = new customerProto.CustomerService(
    "localhost:50052",
    grpc.credentials.createInsecure()
);

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
    try {
        const customer = await callGrpc(
            "GetCustomer",
            { uid: 1 }
        );

        console.log("CUSTOMER:", customer);

        const membership = await callGrpc(
            "GetMembership",
            { uid: 1 }
        );

        console.log("MEMBERSHIP:", membership);

        const passed =
            customer.uid === 1 &&
            membership.mid > 0 &&
            typeof membership.score === "number";

        console.log("ALL TESTS PASSED:", passed);
    } catch (error) {
        console.error("gRPC TEST ERROR:", error.message);
        process.exitCode = 1;
    } finally {
        client.close();
    }
}

main();
