const mongoose = require('mongoose');

const Messsagechema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    text: {
        type: String,
        required: true
    },
    created_at: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Message', MessageSchema);