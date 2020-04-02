const Message = require('../models/Message');
const moment = require('moment');
const environment = process.env.NODE_ENV;
const stage = require('../config')[environment];

function prueba(req, res){
    res.status(200).send({message: 'message controller'});
}

// sent a message from an (auth) user to another user
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

// get a paginated list of messages sent to the (auth) user
function getMessages(req, res, next) {
    let decodeUserId = req.decoded.id;

    let pageNumber = 1;

    if (req.params.pageNumber){
        pageNumber = req.params.pageNumber;
    }

    Message.find({receiver: decodeUserId})
        .populate('sender', 'name surname _id nickname image')
        .paginate(pageNumber, stage.itemsPerPage, (err, messages, total) => {
            if (err) { return next(err); }
              
                    if (!messages) return res.status(404).send({ message: 'There are no messages in mailbox'})
                    
                    return res.status(200).send({
                      messages,
                      total,
                      pages: Math.ceil(total/stage.itemsPerPage)
                    });
        });
}

// get a paginated list of the messages received by the (auth) user
function getSentMessages(req, res, next) {
    let decodeUserId = req.decoded.id;

    let pageNumber = 1;

    if (req.params.pageNumber){
        pageNumber = req.params.pageNumber;
    }

    Message.find({sender: decodeUserId})
        .populate('sender receiver', 'name surname _id nickname image')
        .paginate(pageNumber, stage.itemsPerPage, (err, messages, total) => {
            if (err) { return next(err); }
              
                    if (!messages) return res.status(404).send({ message: 'There are no sent messages in mailbox'})
                    
                    return res.status(200).send({
                      messages,
                      total,
                      pages: Math.ceil(total/stage.itemsPerPage)
                    });
        });

}

// get the number of non read messages for (auth) user in the mailbox
function getNotReadMessagesCounter(req, res, next){
    let decodeUserId = req.decoded.id;

    Message.count({receiver: decodeUserId, read: 'false'})
        .exec((err, messagesCounter) => {
            if (err) { return next(err); }

            return res.status(200).send({
                'nonRead': messagesCounter
            });
        });
}

function setAsReadMessage(req, res, next){
    let decodeUserId = req.decoded.id;

    // option multi updates all found documents, without it it would update just one document
    Message.update({receiver: decodeUserId, read:'false'}, {read: 'true'}, {"multi": true}, (err, messages) =>{
        if (err) { return next(err); }

        return res.status(200).send({
            'messages': messages
        });
    });
}

module.exports = {
    prueba,
    addMessage,
    getMessages,
    getSentMessages,
    getNotReadMessagesCounter,
    setAsReadMessage
}
