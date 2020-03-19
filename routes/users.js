const userController = require('../controllers/users');

module.exports = (router) => {
    router.route('/users')
        .get(userController.home);

    router.route('/register')
        .post(userController.register);
}