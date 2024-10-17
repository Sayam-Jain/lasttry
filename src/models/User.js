const mongoose = require('mongoose')
const { isEmail } = require('validator')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        minlength: [3, "Minimum length of 3 characters required"] 
    },
    email: {
        type: String,
        required: [true, 'Please enter an Email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, "Please an valide Email"]
    },
    password: {
        type: String,
        required: [true, 'Please enter a Password'],
        minlength: [6, 'Minimum length of 6 characters required']
    },
    role: {
        type: String,
        enum: ['user', 'player', 'club', 'sponsor'],
        default: 'user'
    }

});

const User = mongoose.model('user', userSchema)

module.exports = User;
