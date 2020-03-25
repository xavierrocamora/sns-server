const User = require('../models/User');
const bcrypt = require('bcryptjs');
const environment = process.env.NODE_ENV;
const stage = require('../config')[environment];
const mongoosePaginate = require('mongoose-pagination');
const fs = require('fs');
const path = require('path');

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
            return res.status(201).json(user);
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

function getUser(req, res) {
  User.findOne({_id: req.params.id})
    .then(user => {
      if (!user) {
        return res.status(403).send({ message: 'User does not exist' });
      }

      return res.status(200).send({user});
    }).catch((err) => {
        return res.status(500).send({ message: 'Error processing the petition'})
    });

}

// Return paginated users 
function getUsers(req,res, next) {

  // get the id of the authenticated user
  let identity_user_id = req.decoded.id;
  let pageNumber = 1;

  if(req.params.pageNumber) {
    pageNumber = req.params.pageNumber;
  }

  User
    .find()
    .sort('_id')
    .paginate(pageNumber, stage.itemsPerPage, (err, users, total) => {
      if (err) { return next(err); }

      if (!users) return res.status(404).send({ message: 'There are no registered users'})
      
      return res.status(200).send({
        users,
        total,
        pages: Math.ceil(total/stage.itemsPerPage)
      });
  });

}

// function to allow an user to update his/her profile
function updateUser (req, res, next) {

  let updatedFields = req.body;
  let requestedUserId = req.params.id;

  // delete password property
  delete updatedFields.password;

  // Only allow the own user to modify his/her profile
  if(requestedUserId != req.decoded.id) {
    return res.status(500).send({ message: 'Do not have privileges to modify this profile'});
  }

  User.findByIdAndUpdate(requestedUserId, updatedFields, {new:true}, (err, updatedUser) => {
    if (err) { return next(err); }

    if(!updatedUser) return res.status(404).send({ message: 'Could not update user'});

    return res.status(200).send({ user: updatedUser});
  });    
}

// Upload files from client user's image/avatar
function uploadImage (req, res, next) {
  let requestedUserId = req.params.id;

  if(req.files){
    // Found a file attached to request, proceed processing the petition
    let filePath = req.files.image.path;
    let fileSplit = filePath.split('\\');
    let fileName = fileSplit[2];

    // Check extension
    let extensionSplit = fileName.split('\.');
    let fileExtension = extensionSplit[1];

     // Only allow the own user to modify his/her profile
    if(requestedUserId != req.decoded.id) {
      // Delete the uploaded file (multiparty middleware always uploads the file)
      return removeFile(res, filePath, 'Do not have privileges to modify this profile');
    }

    if(fileExtension == 'png' || fileExtension == 'jpg' || fileExtension == 'jpeg' || fileExtension == 'gif'){
      // File extension is valid, Update user profile
      User.findByIdAndUpdate(requestedUserId, {image: fileName}, {new:true}, (err, updatedUser) => {
        if (err) { return next(err); }
    
        if(!updatedUser) return res.status(404).send({ message: 'Could not update user'});
    
        return res.status(200).send({ user: updatedUser });
      });    
    }else{
      // Not Valid Extension, therefore Delete the uploaded file 
      return removeFile(res, filePath, 'Unvalid file extension');
    }
  }else{
    // Didn't find a file, refuse petition
    return res.status(204).send({ message: 'No file attached to the petition'});
  }
}

// Download a requested image file to client
function downloadImage(req, res){
  let imageFile = req.params.imageFile;
  let filePath = stage.userImagesFolder + imageFile;

  console.log(filePath);
  fs.exists(filePath, (exists) => {
    if(exists){
      res.sendFile(path.resolve(filePath));
    }else{
      res.status(400).send({ message: 'File was not found'});
    }
  });
}

function removeFile(res, filePath, message){
  fs.unlink(filePath, (err) =>{
    return res.status(400).send({ message: message});
  });
}

module.exports = {
    home,
    register,
    login,
    getUser,
    getUsers,
    updateUser,
    uploadImage,
    downloadImage
}