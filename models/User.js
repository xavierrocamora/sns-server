const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Can\'t be blank']
    },
    surname: {
        type: String,
        required: true
    },
    nick: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: [true, 'Can\'t be blank'],
        index: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['ROOT', 'LIMITED'],
        required: [true, 'Can\'t be blank']
    },
    image: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model('User', UserSchema);