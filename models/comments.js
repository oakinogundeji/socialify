'use strict';
/**
*Module dependencies
*/
//-----------------------------------------------------------------------------
var mongoose = require('mongoose');
//=============================================================================
/**
*Comments schema
*/
//-----------------------------------------------------------------------------
var CommentsSchema = mongoose.Schema({
  forPost: {
    type: String,
    required: true,
    unique: true
  },
  author: {
    type: String,
    required: true,
    unique: true
  },
  content: String,
  createdOn: {
    type: Date,
    default: Date.now,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  }
});
//=============================================================================
/**
*Create Comments model
*/
//-----------------------------------------------------------------------------
var CommentsModel = mongoose.model('Comments', CommentsSchema);
//==============================================================================
/**
*Export Comments model
*/
//-----------------------------------------------------------------------------
module.exports = CommentsModel;
//==============================================================================
