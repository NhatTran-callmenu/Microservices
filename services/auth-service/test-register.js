
const bcrypt = require("bcrypt");

const RegisterUser = require(
    "./src/application/use-cases/RegisterUser"
);

const fakeRepository = {
    async findByUsername(username) {
        return null;
    },

    async findRoleByName(rolename) {
        return {
            roleid: 2,
            rolename: "CUSTOMER"
        };
    },

    async create(user) {
        const passwordIsHashed = await bcrypt.compare(
            "TestPassword123!",
            user.password
        );

        console.log(
            "Password hashed correctly:",
            passwordIsHashed
        );

        return Object.assign(user, { uid: 1 });
    }
};

async function testRegister() {
    try {
        const register = new RegisterUser(fakeRepository);

        const result = await register.execute({
            username: "testcustomer",
            password: "TestPassword123!"
        });

        console.log("Registered User:", result);
    } catch (error) {
        console.error("Register Test Error:", error.message);
        process.exitCode = 1;
    }
}

testRegister();
