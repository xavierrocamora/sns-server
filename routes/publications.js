const publicationsController = require('../controllers/publications');
const auth = require('../utils/auth');
const multiparty = require('connect-multiparty');
const environment = process.env.NODE_ENV;
const stage = require('../config')[environment];
const md_upload = multiparty({uploadDir: stage.publicationImagesFolder});

module.exports = (router) => {
    router.route('/publications')
        .get(auth.required, publicationsController.home)
        .post(auth.required, publicationsController.addPublication);

    router.route('/publications/page/pageNumber?')
        .get(auth.required, publicationsController.getPublicationsFromFollowedUsers);
    
}