const messageController = require('../controllers/messages');
const auth = require('../utils/auth');

module.exports = (router) => {
    router.route('/messages/')
        .get(auth.required, messageController.prueba)
        .post(auth.required, messageController.addMessage);
}