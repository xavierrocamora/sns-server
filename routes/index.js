const users = require('./users');
// to keep the code clean, we pass our main router
// defined in index.js to the users router in 
// routes/users.js, which will handle all functionality
// related to our users
module.exports = (router) => {
    users(router);
    return router;
};