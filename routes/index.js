const users = require('./users');
const follows = require('./follows');
const publications = require('./publications');
const messages = require('./messages');
// to keep the code clean, we pass our main router
// defined in index.js to the users, follows, publications, ... router in 
// their routes ie: routes/users.js, which will handle all functionality
// related to our users, follows, publications and messages
module.exports = (router) => {
    users(router);
    follows(router);
    publications(router);
    messages(router);
    return router;
};