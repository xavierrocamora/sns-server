const path = require('path');
const fs = require('fs');
const moment = require('moment');
const environment = process.env.NODE_ENV;
const stage = require('../config')[environment];
const mongoosePaginate = require('mongoose-pagination');

const Publication = require('../models/Publication');
const User = require('../models/User');
const Follow = require('../models/Follow');

function home(req, res) {
    res.status(200).send({message: 'publications controller'});
}

function addPublication(req, res) {
    let params = req.body;
    params.user = req.decoded.id;
    params.created_at = moment().unix();
    const publication = new Publication(params);

    publication.save()
        .then(() => {
            return res.status(201).send({publication: publication});
        })
        .catch((err) => {
            if (err.name == 'ValidationError') {
                return res.status(422).send(err);
            } else {
                res.status(500).send(err);
            }
        });
}

// Get all publications done by the users followed by user
function getPublicationsFromFollowedUsers(req, res) {
    let decodedId = req.decoded.id;

    let pageNumber = 1;
    if (req.params.pageNumber){
        pageNumber = req.params.pageNumber;
    }

    Follow.find({user: decodedId})
        .populate('followedUser')
        .exec((err, follows) => {
            if(err) return res.status(500).send({message: 'Could not retrieve publications data'});

            let followedUsersIdsList = [];

            follows.forEach((follow) => {
                followedUsersIdsList.push(follow.followedUser);
            });

            // search for all object which user value is within the given array
            Publication
                .find({user: {"$in": followedUsersIdsList}})
                .sort('created_at')
                .populate('user')
                .paginate(pageNumber, stage.itemsPerPage, (err, publications, total) => {
                    if (err) { return next(err); }
              
                    if (!publications) return res.status(404).send({ message: 'There are no publications from users'})
                    
                    return res.status(200).send({
                      publications,
                      total,
                      pages: Math.ceil(total/stage.itemsPerPage)
                    });
                });
        });
}

module.exports = {
    home,
    addPublication,
    getPublicationsFromFollowedUsers
}