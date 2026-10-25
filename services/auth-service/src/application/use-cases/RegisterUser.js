
const bcrypt = require("bcrypt");
const User = require("../../domain/entities/User");

class RegisterUser {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute({ username, password }) {
        // 1. Kiem tra du lieu
        if (
            typeof username !== "string" ||
            typeof password !== "string"
        ) {
            throw new Error("Username and password are required");
        }

        const cleanUsername = username.trim();

        if (
            cleanUsername.length < 3 ||
            cleanUsername.length > 50
        ) {
            throw new Error("Username must be 3-50 characters");
        }

        if (password.length < 8 || password.length > 72) {
            throw new Error("Password must be 8-72 characters");
        }

        // 2. Kiem tra username ton tai
        const existingUser =
            await this.userRepository.findByUsername(
                cleanUsername
            );

        if (existingUser) {
            throw new Error("Username already exists");
        }

        // 3. Lay Role CUSTOMER
        const customerRole =
            await this.userRepository.findRoleByName(
                "CUSTOMER"
            );

        if (!customerRole) {
            throw new Error("CUSTOMER role not found");
        }

        // 4. Bam mat khau
        const hashedPassword = await bcrypt.hash(password, 12);

        // 5. Tao User Entity
        const user = new User({
            username: cleanUsername,
            password: hashedPassword,
            roleid: customerRole.roleid
        });

        // 6. Luu vao database
        const savedUser =
            await this.userRepository.create(user);

        // 7. Khong tra password
        return savedUser.toPublicJSON();
    }
}

module.exports = RegisterUser;
