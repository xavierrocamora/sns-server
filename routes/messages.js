const messageController = require('../controllers/messages');
const auth = require('../utils/auth');

module.exports = (router) => {
    // POST: send a message from an user to another user (form data)
    router.route('/messages/')
        .get(auth.required, messageController.prueba)
        .post(auth.required, messageController.addMessage);

    // GET: obtain acounter with the number of not read messages in mailbox 
    router.route('/messages/mailbox/notRead')
        .get(auth.required, messageController.getNotReadMessagesCounter);

    // put: set a specified user messages as read
    router.route('/messages/mailbox/setAsRead/:id')
        .put(auth.required, messageController.setAsRead);

    // GET: obtain a paginated list of messages sent to that user
    router.route('/messages/mailbox/:pageNumber?')
        .get(auth.required, messageController.getMessages);

    // GET: obtain a paginated list of the messages sent by that user
    router.route('/messages/sent/:pageNumber?')
        .get(auth.required, messageController.getSentMessages);
}