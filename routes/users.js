const userController = require('../controllers/users');
const auth = require('../utils/auth');

module.exports = (router) => {
    router.route('/users')
        .get(auth.required, auth.mustBeAdmin, userController.home);

    router.route('/register')
        .post(userController.register);

    router.route('/login')
        .post(userController.login);
}