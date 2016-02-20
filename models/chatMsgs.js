'use strict';
/**
* Module dependencies
*/
//-----------------------------------------------------------------------------
var mongoose = require('mongoose');
//=============================================================================
/**
* Define schema
*/
//-----------------------------------------------------------------------------
var chatMsgSchema = mongoose.Schema({
      sender: {
        type: String,
        required: true
      },
      receiver: {
        type: String,
        required: true
      },
      msg: {
        type: String,
        required: true
      },
      createdOn: {
        type: Date,
        'default': Date.now,
        required: true
      }
    });
//-----------------------------------------------------------------------------
/**
* Create Chat Model and store in 'ChatMsg' collection
*/
//-----------------------------------------------------------------------------
var chatMsgModel = mongoose.model('ChatMsg', chatMsgSchema);
//=============================================================================
/**
* Export userModel
*/
//-----------------------------------------------------------------------------
module.exports = chatMsgModel;
//=============================================================================
