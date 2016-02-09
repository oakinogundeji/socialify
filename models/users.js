'use strict';
/**
*Module dependencies
*/
//-----------------------------------------------------------------------------
var
  mongoose = require('mongoose'),
  paginate = require('mongoose-paginate'),
  bcrypt = require('bcrypt-nodejs');
//=============================================================================
/**
*User schema
*/
//-----------------------------------------------------------------------------
var UserSchema = mongoose.Schema({
    first_name: {
      type: String,
      unique: true,
      required: true
      },
    last_name: {
        type: String,
        unique: true,
        required: true
      },
    email: {
      type: String,
      unique: true,
      required: true
      },
    password: {
      type: String,
      unique: true,
      required: true
    },
    profile_photo: {
      type: String
    },
    joined: {
      type: Date,
      default: Date.now,
      required: true
      },
    status: {
      type: String
    },
    friends: [String]
  });
//=============================================================================
/**
*Create schema methods
*/
//-----------------------------------------------------------------------------
UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
};

UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};
//=============================================================================
/**
*Declare Schema pagination plugin
*/
//-----------------------------------------------------------------------------
/*UserSchema.plugin(mongoosePaginate);
we'll include pagination after everything works ok*/
//=============================================================================
/**
*Create user model
*/
//-----------------------------------------------------------------------------
var UserModel = mongoose.model('User', UserSchema);
//==============================================================================
/**
*Export user model
*/
//-----------------------------------------------------------------------------
module.exports = UserModel;
//==============================================================================
