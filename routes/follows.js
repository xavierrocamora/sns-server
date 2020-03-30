const followsController = require('../controllers/follows');
const auth = require('../utils/auth');

module.exports = (router) => {
    // GET: lists all followed users or users following the user (boolean :followed)
    // POST: start following an user (body)
    router.route('/follows/:followed?')
        .get(auth.required, followsController.getNoPaginationFollowLists)
        .post(auth.required, followsController.addFollow);

    // DELETE: stop following an user (:id)
    router.route('/follows/:id')
        .delete(auth.required, followsController.deleteFollow);

    // GET: get a paginated list of users followed by a given user (:id)
    router.route('/followedUsers/:id?/:pageNumber?')
        .get(auth.required, followsController.getFollowedUsers);

    // GET: get a paginated list of followers from a given user (:id)
    router.route('/followers/:id?/:pageNumber?')
        .get(auth.required, followsController.getFollowers);

        
}