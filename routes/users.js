const userController = require('../controllers/users');
const auth = require('../utils/auth');
const multiparty = require('connect-multiparty');
const environment = process.env.NODE_ENV;
const stage = require('../config')[environment];
const md_upload = multiparty({uploadDir: stage.userImagesFolder});

// WARNING: the order of route insertions is critical for a proper performance
// DO NOT change the stablished order routes and middleware are added
module.exports = (router) => {
    router.route('/users')
        .get(auth.required, auth.mustBeAdmin, userController.home);
    
    router.route('/users/page/:pageNumber?')
        .get(auth.required, userController.getUsers);

    router.route('/users/uploadImg/:id')
        .post(auth.required, md_upload, userController.uploadImage);

    router.route('/users/downloadImg/:imageFile')
        .get(userController.downloadImage);

    // GET: get statistic counters for an user  (:id id of user, default: authenticated user)
    router.route('/users/counters/:id?')
        .get(auth.required, userController.getCounters);

    router.route('/users/:id')
        .get(auth.required, userController.getUser)
        .put(auth.required, userController.updateUser);

    

    
    router.route('/register')
        .post(userController.register);

    router.route('/login')
        .post(userController.login);
}