const User = require('../models/User');

function home(req, res){
    res.status(200).send({
        message: 'Hello'
    });
}

function register(req, res){

    console.log(req.body);
    const user = new User(req.body);

    // Hash password
    //await user.setPassword(req.body.password);

    // We take advantage of moongose built-in schema validators
    // in order to do all the validation of received data
    user.save()
        .then(() => {
            return res.json(user);
        })
        .catch((err) => {
            if (err.name == 'ValidationError') {
                return res.status(422).send(err);
            } else {
                res.status(500).send(err);
            }
        });
}


module.exports = {
    home,
    register
}