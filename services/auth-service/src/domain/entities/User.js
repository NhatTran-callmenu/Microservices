
class User {
    constructor({ uid = null, username, password, roleid }) {
        this.uid = uid;
        this.username = username;
        this.password = password;
        this.roleid = roleid;
    }

    toPublicJSON() {
        return {
            uid: this.uid,
            username: this.username,
            roleid: this.roleid
        };
    }
}

module.exports = User;
