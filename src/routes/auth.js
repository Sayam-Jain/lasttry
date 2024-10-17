const express = require('express');
const { createUser } = require('../controllers/signup.js');
const { loginUser, refresh, logout } = require('../controllers/authControls.js');

const router = express.Router();

//Register a user
router.post('/signup', createUser);
//login
router.post('/login', loginUser);

router.get('/refresh', refresh)

router.post('/logout', logout)



module.exports = router