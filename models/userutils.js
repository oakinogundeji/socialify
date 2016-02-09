'use strict';
/**
*Module dependencies
*/
//-----------------------------------------------------------------------------
var UserModel = require('./users');
//=============================================================================
/**
*Create utility functions
*/
//-----------------------------------------------------------------------------
//return a single user by email adddress
function findUserByEmail(req, res, next) {
  return UserModel.findOne({email: req.params.email}, 'email username ' +
  'first_name last_name photo',
    function (err, user) {
      if(err) {
        return next(err);
      }
      if(user == null) {
        return res.status(404).json('User does not exist in the dBase');
      }
      return res.status(200).json(user);
  });
}

function findUserById(req, res, next) {
  return UserModel.findOne({_id: req.params.id}, 'email username',
    function (err, user) {
      if(err) {
        return next(err);
      }
      if(user == null) {
        return res.status(404).json('User does not exist in the dBase');
      }
      return res.status(200).json(user);
  });
}
//return multiple users who match first/last name query
//TODO include query builder and pagination
function findUsersByName(req, res, next) {
  return UserModel.find({'first_name': req.params.fname,
  'last_name': req.params.lname}, 'email username first_name last_name photo',
    function (err, users) {
      if(err) {
        return next(err);
      }
      if(users == null) {
        return res.status(404).json('Users do not exist in the dBase');
      }
      return res.status(200).json(users);
  });
}

function viewAllUsers(req, res, next) {
  return UserModel.find({},
  function (err, users) {
    if(err) {
      return next(err);
    }
    if(users == null) {
      return res.status(404).json('No users in the dBase');
    }
    return res.status(200).json(users);
  });
}

function updateUser(req, res, next) {
  return UserModel.findOne({email: req.params.email},
  function (err, user) {
    if(err) {
      return next(err);
    }
    if(user == null) {
      return res.status(404).json('User not found in the dBase');
    }
    user.first_name = req.body.fname || user.first_name;
    user.last_name = req.body.lname || user.last_name;
    user.email = req.body.email || user.email;
    user.username = req.body.username || user.username;
    user.password = user.generateHash(req.body.password) || user.password;
    user.save(function (err, user) {
      if(err) {
        return next(err);
      }
      return res.status(200).json(user);
    });
  });
}

function updateUserPhoto(req, res, newPhoto, next) {
  return UserModel.findOne({email: req.params.email}, 'profilePhoto',
  function (err, user) {
    if(err) {
      return next(err);
    }
    if(user == null) {
      return res.status(404).json('User not found in the dBase');
    }
    user.profilePhoto = newPhoto || user.profilePhoto;
    user.save(function (err, user) {
      if(err) {
        return next(err);
      }
      return res.status(200).json(user);
    });
  });
}

function deleteUser(req, res, next) {
  return UserModel.findOneAndRemove({email: req.params.email},
 function (err, user) {
   if(err) {
     return next(err);
   }
   if(user == null) {
     return res.status(404).json('User not found in the dBase');
   }
   return res.status(200).json(user);
 });
}
//=============================================================================
/**
*Export Module
*/
//-----------------------------------------------------------------------------
module.exports = {
  findUserByEmail: findUserByEmail,
  findUsersByName: findUsersByName,
  viewAllUsers: viewAllUsers,
  updateUser: updateUser,
  updateUserPhoto:updateUserPhoto,
  deleteUser:deleteUser
};
//=============================================================================
