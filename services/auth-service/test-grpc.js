
require("dotenv").config();

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const jwt = require("jsonwebtoken");
const path = require("path");

const protoPath = path.resolve(
    __dirname,
    "../../protos/auth.proto"
);

const definition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    defaults: true
});

const authProto = grpc.loadPackageDefinition(definition).auth;

const client = new authProto.AuthService(
    "localhost:50051",
    grpc.credentials.createInsecure()
);

const validToken = jwt.sign(
    { uid: 1, roleid: 2 },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
);

function verify(name, token) {
    return new Promise((resolve) => {
        client.VerifyToken(
            { token },
            { deadline: Date.now() + 5000 },
            (error, response) => {
                if (error) {
                    console.log(name, "ERROR:", error.message);
                    return resolve(false);
                }

                console.log(name, response);
                resolve(response.valid);
            }
        );
    });
}

async function main() {
    try {
        const valid = await verify("VALID TOKEN:", validToken);
        const invalid = await verify("INVALID TOKEN:", "invalid-token");

        console.log(
            "ALL TESTS PASSED:",
            valid === true && invalid === false
        );
    } finally {
        client.close();
    }
}

main().catch(console.error);
