const jwt = require('jsonwebtoken');

// Set of middleware functions for validation of protected routes and privileges
const auth = {
    required: function(req,res,next){
        const authorizationHeader = req.headers.authorization;
        console.log(authorizationHeader);
        if (!authorizationHeader) {
            return res.status(401).send('Access Denied!');       
        } else {   
            const token = req.headers.authorization.split(' ')[1]; // Bearer <token>
            if(!token) return res.status(401).send('Access Denied!');

            try{
                const options = {
                    expiresIn: '2d',
                    issuer: 'devxavier'
                }
                const verified = jwt.verify(token, process.env.JWT_SECRET, options);
                // Pass back the decoded token to the request object
                req.decoded = verified;
                // We call next to pass execution to the subsequent middleware
                next();
            }catch(err){
                res.status(400).send('Invalid Token');
        
            }
        }  
    },
    mustBeAdmin: function(req, res, next) {
        // Must be used following "required" middleware
        // so that it gets the decoded token
        const payload = req.decoded;
        console.log(payload);
        if (payload && payload.role !== 'ROOT') {
          return res.status(403).json({ message: 'Unauthorized access' });
        }
    
        next();
      }
}

module.exports = auth;