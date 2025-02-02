const bcrypt = require("bcryptjs");

const usersMock = [{ id: 1, email: "demo@example.com", password: bcrypt.hashSync("Demo@P45ssW0rd123", 10), role: "user" }];

module.exports = usersMock;
