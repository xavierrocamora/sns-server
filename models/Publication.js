const mongoose = require('mongoose');

const PublicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    text: {
        type: String,
        required: [true, 'Must fill text field'],
        trim: true
    },
    file: {
        type: String,
        required: false
    },
    created_at: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Publication', PublicationSchema);