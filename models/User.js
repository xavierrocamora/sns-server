const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const environment = process.env.NODE_ENV;
const stage = require('../config')[environment];

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: [3, 'Name must be at least 3 characters'],
        maxlength: [20, 'Name must be less than 20 chracters'],
        required: [true, 'Name can\'t be blank'],
        trim: true
    },
    surname: {
        type: String,
        minlength: [3, 'Surname must be at least 3 characters'],
        maxlength: [40, 'Surname must be less than 20 characters'],
        required: [true, 'Surname can\'t be blank'],
        trim: true
    },
    nickname: {
        type: String,
        minlenght: [5, 'Nickname must be at least 6 characters'],
        maxlength: [20, 'Nickname must be less than 20 characters'],
        required: [true, 'Can\'t be blank'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        required: [true, 'Email can\'t be blank'],
        match: [/\S+@\S+\.\S+/, 'Email format is invalid'],
        unique: true,
        index: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password can\'t be blank'],
        trim: true
    },
    role: {
        type: String,
        enum: ['ROOT', 'LIMITED', 'USER'],
        required: true,
        default: 'USER'
    },
    image: {
        type: String,
        required: false,
        default: null
    }
});

// Prevent duplicated emails and nicknames
UserSchema.plugin(uniqueValidator, {message: 'User is already taken.'});

// Encrypt password before save, if needed
UserSchema.pre('save', function(next) {
    const user = this;
    if(!user.isModified || !user.isNew) { // don't rehash if it's an old user
      next();
    } else {
      bcrypt.hash(user.password, stage.saltingRounds, function(err, hash) {
        if (err) {
          console.log('Error hashing password for user', user.name);
          next(err);
        } else {
          user.password = hash;
          next();
        }
      });
    }
  });

  // Method for generating an identification token
  UserSchema.methods.generateJWT = function() {
  
    const payload = {
        id: this._id,
        username: this.name,
        surname: this.surname,
        nickname: this.nickname,
        role: this.role
    };
    const options = {
        expiresIn: '2d',
        issuer: 'devxavier'
    }
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(payload, secret, options);

    return token;
  };

  // Method to return a json with the user and token information to client
  UserSchema.methods.toAuthJSON = function() {
    return {
      email: this.email,
      token: this.generateJWT(),
    };
  };

module.exports = mongoose.model('User', UserSchema);