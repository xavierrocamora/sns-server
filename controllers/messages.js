const Message = require('../models/Message');
const moment = require('moment');

function prueba(req, res){
    res.status(200).send({message: 'message controller'});
}

function addMessage(req, res) {
    let params = req.body;
    params.sender = req.decoded.id;
    params.created_at = moment().unix();
    const message = new Message(params);

    message.save()
        .then(() => {
            return res.status(201).send({message: message});
        })
        .catch((err) => {
            if (err.name == 'ValidationError') {
                return res.status(422).send(err);
            } else {
                res.status(500).send(err);
            }
        });
}
module.exports = {
    prueba,
    addMessage
}
