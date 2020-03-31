const users = require('./users');
const follows = require('./follows');
const publications = require('./publications');
// to keep the code clean, we pass our main router
// defined in index.js to the users, follows, ... router in 
// their routes ie: routes/users.js, which will handle all functionality
// related to our users, follows, ...
module.exports = (router) => {
    users(router);
    follows(router);
    publications(router);
    return router;
};