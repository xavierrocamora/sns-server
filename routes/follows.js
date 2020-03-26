const followsController = require('../controllers/follows');
const auth = require('../utils/auth');

module.exports = (router) => {
    router.route('/follows')
        .get(auth.required, followsController.prueba)
        .post(auth.required, followsController.addFollow);

    router.route('/follows/:id')
        .delete(auth.required, followsController.deleteFollow);

    router.route('/following/:id?/:pageNumber?')
        .get(auth.required, followsController.getFollowedUsers);

        
}