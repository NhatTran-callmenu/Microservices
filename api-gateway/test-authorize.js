
const authorize = require(
    "./src/middlewares/authorize.middleware"
);

function test(roleid, allowedRoles) {
    const req = roleid === null
        ? {}
        : { user: { uid: 1, roleid } };

    const result = { status: 200 };

    const res = {
        status(code) {
            result.status = code;
            return this;
        },
        json(data) {
            result.body = data;
            return this;
        }
    };

    authorize(...allowedRoles)(req, res, () => {
        result.allowed = true;
    });

    return result.status;
}

console.log("ADMIN -> ADMIN:", test(1, [1]));
console.log("CUSTOMER -> ADMIN:", test(2, [1]));
console.log("CUSTOMER -> CUSTOMER:", test(2, [2]));
console.log("No user -> ADMIN:", test(null, [1]));

const actual = [
    test(1, [1]),
    test(2, [1]),
    test(2, [2]),
    test(null, [1])
];

if (JSON.stringify(actual) !== JSON.stringify([200, 403, 200, 401])) {
    process.exitCode = 1;
}
