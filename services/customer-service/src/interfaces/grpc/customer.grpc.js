
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const pool = require(
    "../../infrastructure/persistence/database"
);

const protoPath = path.resolve(
    __dirname,
    "../../../../../protos/customer.proto"
);

const definition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true
});

const customerProto = grpc.loadPackageDefinition(
    definition
).customer;

async function getCustomer(call, callback) {
    try {
        const uid = Number(call.request.uid);

        const result = await pool.query(
            "SELECT uid, fullname, mid FROM customers WHERE uid = $1",
            [uid]
        );

        if (result.rows.length === 0) {
            return callback({
                code: grpc.status.NOT_FOUND,
                message: "Customer not found"
            });
        }

        callback(null, result.rows[0]);
    } catch (error) {
        console.error("Customer gRPC error:", error.message);

        callback({
            code: grpc.status.INTERNAL,
            message: "Unable to get customer"
        });
    }
}

async function getMembership(call, callback) {
    try {
        const uid = Number(call.request.uid);

        const result = await pool.query(
            `SELECT m.mid, m.mname, m.score
             FROM customers c
             JOIN memberships m ON c.mid = m.mid
             WHERE c.uid = $1`,
            [uid]
        );

        if (result.rows.length === 0) {
            return callback({
                code: grpc.status.NOT_FOUND,
                message: "Membership not found"
            });
        }

        callback(null, result.rows[0]);
    } catch (error) {
        console.error("Membership gRPC error:", error.message);

        callback({
            code: grpc.status.INTERNAL,
            message: "Unable to get membership"
        });
    }
}

function startGrpcServer() {
    const server = new grpc.Server();

    server.addService(customerProto.CustomerService.service, {
        GetCustomer: getCustomer,
        GetMembership: getMembership
    });

    const port = Number(process.env.GRPC_PORT || 50052);

    server.bindAsync(
        `0.0.0.0:${port}`,
        grpc.ServerCredentials.createInsecure(),
        (error) => {
            if (error) {
                console.error("Customer gRPC error:", error.message);
                return;
            }

            console.log(`Customer gRPC running on port ${port}`);
        }
    );

    return server;
}

module.exports = { startGrpcServer };
