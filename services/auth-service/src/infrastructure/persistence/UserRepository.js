
const pool = require("./database");
const User = require("../../domain/entities/User");

class UserRepository {
    async findByUsername(username) {
        const result = await pool.query(
            `SELECT uid, username, password, roleid
             FROM users
             WHERE username = $1`,
            [username]
        );

        return result.rows.length
            ? new User(result.rows[0])
            : null;
    }

    async findRoleByName(rolename) {
        const result = await pool.query(
            `SELECT roleid, rolename
             FROM roles
             WHERE rolename = $1`,
            [rolename]
        );

        return result.rows[0] || null;
    }

    async create(user) {
        const result = await pool.query(
            `INSERT INTO users (username, password, roleid)
             VALUES ($1, $2, $3)
             RETURNING uid, username, roleid`,
            [user.username, user.password, user.roleid]
        );

        return new User(result.rows[0]);
    }
}

module.exports = UserRepository;
