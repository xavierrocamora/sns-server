const User = require('../models/User');
const bcrypt = require('bcryptjs');

function home(req, res){
    res.status(200).send({
        message: 'Hello'
    });
}

function register (req, res){

    console.log(req.body);
    const user = new User(req.body);

    // We take advantage of moongose built-in schema validators
    // in order to do all the validation of received data
    // and hashing the password before storing it to DB
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

async function login (req, res) {

    if(!req.body.email){
        return res.status(422).json({
          message: 'Login failed',
          fields: {
            email: 'Can\'t be blank'
          }
        });
      }
    
      if(!req.body.password){
        return res.status(422).json({
          message: 'Login failed',
          fields: {
            password: 'Can\'t be blank'
          }
        });
      }

      //Checking if the email exists
    const user = await User.findOne({email: req.body.email});
    if (!user) return res.status(400).send('Email or password is wrong');

    //Checking password
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).send('Invalid password');
    
    console.log(user.generateJWT());
    res.header('auth-token', user.generateJWT()).send(user.toAuthJSON());
    
    console.log('User logged in');

}


module.exports = {
    home,
    register,
    login
}