const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtiles');

async function login(email, password) {
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            throw new Error("Email does not exit");
        }
        const isPasswordValid = bcrypt.compare(password, existingUser.password);

        if (!isPasswordValid) {
            throw new Error("Invalid password");
        }
        const token = generateToken(existingUser);
        return token;

    } catch (err) {

        throw new Error("Invalid credentials");
    }

}
module.exports = { login };