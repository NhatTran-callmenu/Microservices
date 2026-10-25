
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const jwt = require("jsonwebtoken");
const path = require("path");

const PROTO_PATH = path.resolve(
    __dirname,
    "../../../../../protos/auth.proto"
);

const definition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const authProto = grpc.loadPackageDefinition(definition).auth;

function verifyToken(call, callback) {
    try {
        if (!call.request.token) {
            return callback(null, {
                valid: false,
                uid: 0,
                roleid: 0
            });
        }

        const decoded = jwt.verify(
            call.request.token,
            process.env.JWT_SECRET
        );

        callback(null, {
            valid: true,
            uid: Number(decoded.uid),
            roleid: Number(decoded.roleid)
        });
    } catch (error) {
        callback(null, {
            valid: false,
            uid: 0,
            roleid: 0
        });
    }
}

function startGrpcServer() {
    const server = new grpc.Server();

    server.addService(authProto.AuthService.service, {
        VerifyToken: verifyToken
    });

    const port = Number(process.env.GRPC_PORT || 50051);

    server.bindAsync(
        `0.0.0.0:${port}`,
        grpc.ServerCredentials.createInsecure(),
        (error) => {
            if (error) {
                console.error("Auth gRPC error:", error.message);
                return;
            }

            console.log(`Auth gRPC running on port ${port}`);
        }
    );

    return server;
}

module.exports = { startGrpcServer };
