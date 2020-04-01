const publicationController = require('../controllers/publications');
const auth = require('../utils/auth');
const multiparty = require('connect-multiparty');
const environment = process.env.NODE_ENV;
const stage = require('../config')[environment];
const md_upload = multiparty({uploadDir: stage.publicationImagesFolder});

module.exports = (router) => {
    router.route('/publications')
        .get(auth.required, auth.mustBeAdmin, publicationController.home)
        .post(auth.required, publicationController.addPublication);

    router.route('/publications/page/:pageNumber?')
        .get(auth.required, publicationController.getPublicationsFromFollowedUsers);

    // POST: upload an image to a given publication  (:id of publication)
    router.route('/publications/uploadImg/:id')
        .post(auth.required, md_upload, publicationController.uploadImage);

    // GET: download an image to client (:imageFile id of image)
    router.route('/publications/downloadImg/:imageFile')
        .get(publicationController.downloadImage);
    
    router.route('/publications/:id')
        .get(auth.required, publicationController.getPublication)
        .delete(auth.required, publicationController.deletePublication);
}