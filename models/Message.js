const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sender is missing'],
        trim: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Must specify the receiver of the message'],
        trim: true
    },
    text: {
        type: String,
        required: [true, 'Message field can not be blank'],
        trim: true
    },
    created_at: {
        type: String,
        required: true
    },
    read: {
        type: String,
        default: 'false'
    }
});

module.exports = mongoose.model('Message', MessageSchema);