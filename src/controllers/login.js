const authService = require('../services/login');

async function loginUser(req, res) {
    try {
        const { email, password } = req.body; 
        console.log(req.body);
        const token = await authService.login(email, password);
        res.json({ token: token });
    } catch (err) {
        console.log("Error: ", err.message);
        res.status(401).json({ message: "Invalid credentials" });
    }
}

module.exports = { loginUser };
