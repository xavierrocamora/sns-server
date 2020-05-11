const path = require('path');
const fs = require('fs');
const environment = process.env.NODE_ENV;
const stage = require('../config')[environment];
const mongoosePaginate = require('mongoose-pagination');

const User = require('../models/User');
const Follow = require('../models/Follow');

function prueba(req, res){
    res.status(200).send({message: 'follow controller'});
}

// Start following an user
// TO DO: Prevent user from following the same user more than once 
function addFollow(req, res){
    let params = req.body;
    const follow = new Follow();
    // get the id from requesting user directly from the decoded token
    follow.user = req.decoded.id;
    follow.followedUser = params.followedUser;

    follow.save((err, follow) => {
        if(err) return res.status(500).send({message: 'User could not be followed'});

        if(!follow) return res.status(422).send({message: 'Follow petition could not be saved'});

        return res.status(201).send({follow: follow});
    });
}

// Stop following an user
function deleteFollow(req, res){
    let userId = req.decoded.id;
    let followId = req.params.id;

    Follow.find({'user': userId, 'followedUser': followId})
        .remove(err => {
            if(err) return res.status(500).send({message: 'Could not delete follow relation'});

            return res.status(200).send({message: 'Follow relation has been deleted'});
        });
}

// Get a paginated list of users followed by an user
function getFollowedUsers(req, res, next){
    // this method can get an user id by url paramaters, 
    // that's the case of an user asking for followed users from another user
    // otherwise assume it's the user asking for his/her followed users
    // in which case just pick id from decoded token
    let userId = req.decoded.id;

    if(req.params.id && req.params.pageNumber){
        userId = req.params.id;
    }

    let pageNumber = 1;

    if(req.params.pageNumber) {
        pageNumber = req.params.pageNumber;
    }else{
        pageNumber = req.params.id;
    }

    Follow
        .find({user: userId})
        .populate({path: 'followedUser'})
        .paginate(pageNumber, stage.itemsPerPage, (err, follows, total) => {
            if (err) { return next(err); }
      
            if (!follows) return res.status(404).send({ message: 'User is not following any users'})
            
            // add a list of ids from users followed by the authenticated user
            // as well as a list of his/her follower ids
            // useful when watching follow relations of other users but want to be able
            // to use follow and unfollow buttons on them
            getFollowRelationsIds(req.decoded.id)
            .then((value) => {
                return res.status(200).send({
                    follows,
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

// Get a paginated list of users following the requested user
function getFollowers(req, res, next){
    let userId = req.decoded.id;

    if(req.params.id && req.params.pageNumber){
        userId = req.params.id;
    }

    let pageNumber = 1;

    if(req.params.pageNumber) {
        pageNumber = req.params.pageNumber;
    }else{
        pageNumber = req.params.id;
    }

    Follow
        .find({followedUser: userId})
        .populate({path: 'user'})
        .paginate(pageNumber, stage.itemsPerPage, (err, follows, total) => {
            if (err) { return next(err); }
      
            if (!follows) return res.status(404).send({ message: 'You are not being followed by any users'})
            
            // add a list of ids from users followed by the authenticated user
            // as well as a list of his/her follower ids
            // useful when watching follow relations of other users but want to be able
            // to use follow and unfollow buttons on them
            getFollowRelationsIds(req.decoded.id)
            .then((value) => {
                return res.status(200).send({
                    follows,
                    followedUsers: value.followed,
                    followers: value.followers,
                    total,
                    pages: Math.ceil(total/stage.itemsPerPage)
                });

            });
        });
}

// getFollowedUsers and getFollowedUsers without pagination
function getNoPaginationFollowLists(req, res, next){
    let userId = req.decoded.id;

    let find;

    // if it receives a followed parameter
    if(req.params.followed){
        // then get a list of followers
        find = Follow.find({followedUser: userId});
    }else{
        // otherwise get a list of users followed by user
        find = Follow.find({user: userId});
    }

    find.populate('user followedUser')
        .exec(
            (err, follows) => {
                if (err) { return next(err); }
          
                if (!follows) return res.status(404).send({ message: 'User is not being followed by any users'})
                
                return res.status(200).send({follows});
            }
        );
}

module.exports = {
    prueba,
    addFollow,
    deleteFollow,
    getFollowedUsers,
    getFollowers,
    getNoPaginationFollowLists
}