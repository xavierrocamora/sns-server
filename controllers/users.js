const User = require('../models/User');
const Follow = require('../models/Follow');
const Publication = require('../models/Publication');
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

    const user = new User(req.body);

    // We take advantage of moongose built-in schema validators
    // in order to do all the validation of received data
    // and hashing the password before storing it to DB
    user.save()
        .then(() => {
            return res.status(201).send({user: user});
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
    if (!user) return res.status(400).send({message: 'Email or password is wrong'});

    //Checking password
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).send({message: 'Invalid password'});
    
    res.header('auth-token', user.generateJWT()).send(user.toAuthJSON());
    
    console.log('User logged in');

}

function getUser(req, res) {
  User.findOne({_id: req.params.id})
    .then(user => {
      if (!user) {
        return res.status(403).send({ message: 'User does not exist' });
      }

      // Check if current user is already following the requested user or not
      checkFollowRelations(req.decoded.id, req.params.id)
        .then((value) => {
          user.password = undefined;
          return res.status(200).send({
            user,
            following: value.following,
            followed: value.followed
          });
        });

    }).catch((err) => {
        return res.status(500).send({ message: 'Error processing the petition'})
    });
}

// auxiliary function to get the follow relations stablished between two users
async function checkFollowRelations(decodedUserId, followedUserId) {
  // return the follow relation document if following that user or null if not following
  const following = await Follow
        .findOne({"user": decodedUserId, "followedUser": followedUserId});
  
  // return the follow relation document if followed by that user or null if not followed
  const followed = await Follow
        .findOne({"user": followedUserId, "followedUser": decodedUserId});

  return {
    following: following,
    followed: followed
  }
}

// Return paginated users
// additionally attach a list of followed user ids and follower ids
// for the authenticated user 
function getUsers(req,res, next) {

  // get the id of the authenticated user
  let decodedUserId = req.decoded.id;
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
      
      getFollowRelationsIds(decodedUserId)
        .then((value) => {
          return res.status(200).send({
            users,
            followedUsers: value.followed,
            followers: value.followers,
            total,
            pages: Math.ceil(total/stage.itemsPerPage)
          });
        });    
  });
}

// auxiliary function that returns a json 
// with the Ids of followed users and Ids of followers
// for a given user
async function getFollowRelationsIds(userId) {
  const followedUsersIds = await Follow
    .find({"user": userId})
    .select({'_id': 0, '__v': 0, 'user': 0});
  
  let followedUserIdsList = [];

  if (followedUsersIds) {   
    followedUsersIds.forEach((follow) => {
      followedUserIdsList.push(follow.followedUser);
    });
  }

  const followerUsersIds = await Follow
    .find({"followedUser": userId})
    .select({'_id': 0, '__v': 0, 'user': 0});
  
  let followerUserIdsList = [];

  if (followerUsersIds) {   
    followerUsersIds.forEach((follow) => {
      followerUserIdsList.push(follow.user);
    });
  }

    return {
      followed: followedUserIdsList,
      followers: followerUserIdsList
    }
}

// Method for getting data counters about follow relations,
// messages, ... of a given user
function getCounters(req, res) {
  let userId = req.decoded.id;
  if(req.params.id) {
    userId = req.params.id; 
  }
  getFollowAndPublicationCounters(userId).then((value) =>{
    return res.status(200).send(value);
  });
}

// Auxiliary function to get counters for follow data and publications
async function getFollowAndPublicationCounters(userId) {
  const followedCounter = await Follow.count({"user": userId});

  const followersCounter = await Follow.count({"followedUser": userId});

  const publicationCounter = await Publication.count({"user": userId});

  return {
    followed: followedCounter,
    followers: followersCounter,
    publications: publicationCounter
  }
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

  // if either nickname or email are duplicated 
      // a validation error might happen
  User.find({ $or: [
    {email: updatedFields.email},
    {nickname: updatedFields.nickname}
  ]}).exec((err, users) => {
    let userExists = false;
    users.forEach((user) => {
      if(user._id != requestedUserId) userExists = true;
    });
    
    if (userExists){
      return res.status(422).send({message: "nickname or email are already taken!"});
    }

    // no user with same email or nickname found
    // then try to update the document
    User.findByIdAndUpdate(requestedUserId, updatedFields, {new:true}, (err, updatedUser) => {      
      if (err) { 
          return next(err);
      }
  
      if(!updatedUser) return res.status(404).send({ message: 'Could not update user'});
  
      return res.status(200).send({ user: updatedUser});
    });
      
    

  });

      
}

// Upload files from client user's image/avatar
function uploadImage (req, res, next) {
  let requestedUserId = req.params.id;

  if(req.files){
    // Found a file attached to request, proceed processing the petition
    let filePath = req.files.image.path;
    console.log(filePath);
    // local
    //let fileSplit = filePath.split('\\');
    // heroku
    let fileSplit = filePath.split('\/');
    console.log(fileSplit);
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
    
        //don't send password info!
        delete updatedUser.password;
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
    getCounters,
    updateUser,
    uploadImage,
    downloadImage
}