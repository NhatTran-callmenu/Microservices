
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const protoPath = path.resolve(
    __dirname,
    "../../../../../protos/auth.proto"
);

const definition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true
});

const authProto =
    grpc.loadPackageDefinition(definition).auth;

class AuthGrpcClient {
    constructor() {
        const host =
            process.env.AUTH_GRPC_HOST ||
            "auth-service:50051";

        this.client = new authProto.AuthService(
            host,
            grpc.credentials.createInsecure()
        );
    }

    verifyToken(token) {
        return new Promise((resolve, reject) => {
            this.client.VerifyToken(
                { token },
                { deadline: Date.now() + 5000 },
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }

                    resolve(result);
                }
            );
        });
    }
}

module.exports = AuthGrpcClient;
