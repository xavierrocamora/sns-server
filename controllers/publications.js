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
    console.log('Entro');
    Follow.find({user: decodedId})
        .populate('followedUser')
        .exec((err, follows) => {
            if(err) return res.status(500).send({message: 'Could not retrieve publications data'});

            let followedUsersIdsList = [];

            follows.forEach((follow) => {
                followedUsersIdsList.push(follow.followedUser);
            });
            // allow to add the user's own publications to the result of the query
            followedUsersIdsList.push(decodedId);

            // search for all object which user value is within the given array
            // - sign tells sort to return an inversed list from newer to older
            Publication
                .find({user: {"$in": followedUsersIdsList}})
                .sort('-created_at')
                .populate('user')
                .paginate(pageNumber, stage.itemsPerPage, (err, publications, total) => {
                    if (err) { return next(err); }
              
                    if (!publications) return res.status(404).send({ message: 'There are no publications from users'})
                    
                    return res.status(200).send({
                      publications,
                      total,
                      pages: Math.ceil(total/stage.itemsPerPage),
                      itemsPage: stage.itemsPerPage
                    });
                });
        });
}

function getPublication(req, res) {
    let publicationId = req.params.id;

    Publication.findById(publicationId, (err, publication) => {
        if (err) return res.status(500).send({ message: 'Error processing the petition'});

        if(!publication) {
            return res.status(403).send({ message: 'Publication does not exist' });
        }

        return res.status(200).send({publication});
    });
}

// Delete a publication of owner
function deletePublication(req, res){
    let decodedId = req.decoded.id;
    let publicationId = req.params.id;

    Publication.find({'user': decodedId, '_id': publicationId})
        .remove(err => {
            if(err) return res.status(500).send({message: 'Could not remove the publication'});

            return res.status(200).send({message: 'Publication has been removed'});
        });
}

// Upload files from client user's image/avatar
function uploadImage (req, res, next) {
    let requestedPublicationId = req.params.id;
  
    if(req.files){
      // Found a file attached to request, proceed processing the petition
      let filePath = req.files.image.path;
      let fileSplit = filePath.split('\\');
      let fileName = fileSplit[2];
  
      // Check extension
      let extensionSplit = fileName.split('\.');
      let fileExtension = extensionSplit[1];
  
      if(fileExtension == 'png' || fileExtension == 'jpg' || fileExtension == 'jpeg' || fileExtension == 'gif'){
        
        // Check if the user trying to upload a file is the publication owner 
        Publication.findOne({'user': req.decoded.id, '_id': requestedPublicationId})
            .exec((err, publication) => {
                if(publication){
                    // User is the publication owner and
                    // File extension is valid, Update publication profile
                    Publication.findByIdAndUpdate(requestedPublicationId, {file: fileName}, {new:true}, (err, updatedPublication) => {
                        if (err) { return next(err); }
        
                        if(!updatedPublication) return res.status(404).send({ message: 'Could not update user'});
        
                        return res.status(200).send({ publication: updatedPublication });
                    }); 
                }else{
                    // If the user is not the publication owner then delete the file
                    return removeFile(res, filePath, 'Not allowed to upload a file');
                }
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
    let filePath = stage.publicationImagesFolder + imageFile;
  
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
    addPublication,
    getPublicationsFromFollowedUsers,
    getPublication,
    deletePublication,
    uploadImage,
    downloadImage
}