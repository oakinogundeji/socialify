'use strict';
/**
*Module dependencies
*/
//-----------------------------------------------------------------------------
var
  mongoose = require('mongoose'),
  paginate = require('mongoose-paginate'),
  //autopopulate = require('mongoose-autopopulate'),
  bcrypt = require('bcrypt-nodejs');
//=============================================================================
/**
*User schema
*/
//-----------------------------------------------------------------------------
var UserSchema = mongoose.Schema({
    firstName: {
      type: String,
      required: true
      },
    lastName: {
        type: String,
        required: true
      },
    email: {
      type: String,
      unique: true,
      required: true
      },
    pwdRecoveryEmail: {
      type: String
    },
    password: {
      type: String,
      required: true
    },
    profilePhoto: {
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
    friends: [String],
    pageID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pages'
    },
    hasPage: {
      type: Boolean,
      default: false
    },
    hasPosts: {
      type: Boolean,
      default: false
    },
    hasComments: {
      type: Boolean,
      default: false
    },
    hasFriends: {
      type: Boolean,
      default: false
    }
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
*Declare Schema plugins
*/
//-----------------------------------------------------------------------------
/*UserSchema.plugin(mongoosePaginate);
we'll include pagination after everything works ok*/
//UserSchema.plugin(autopopulate);
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
