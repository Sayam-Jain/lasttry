const bcrypt = require('bcryptjs');
const User = require('../models/User')
const mongoose = require('mongoose')

// create a new User
const createUser = async (req, res) => {
  const {name, email, password} = req.body

  let emptyFields = []

  if (!name) {
    emptyFields.push('name')
  }
  if (!email) {
    emptyFields.push('email')
  }
  if (!password) {
    emptyFields.push('password')
  }
  if (emptyFields.length > 0) {
    return res.status(400).json({ error: 'Please fill in all fields', emptyFields })
  }

  // add to the database
  try {
    const hashPassword = await bcrypt.hash(password, 10);
    console.log(hashPassword)
    const user = await User.create({ name, email, password: hashPassword })
    res.status(200).json(user)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}


module.exports = { createUser }