'use strict';
/**
*Module dependencies
*/
//-----------------------------------------------------------------------------
var
  mongoose = require('mongoose');
  //autopopulate = require('mongoose-autopopulate');
//=============================================================================
/**
*Comments schema
*/
//-----------------------------------------------------------------------------
var CommentsSchema = mongoose.Schema({
  forPost: {
    title: {
      type: String,
      ref: 'Posts',
      required: true
    },
    owner: {
      type: String,
      required: true
    },
    postID: {
      type: String,
      required: true
    }
  },
  commentID: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
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
*Declare Schema plugins
*/
//-----------------------------------------------------------------------------
//CommentsSchema.plugin(autopopulate);
//=============================================================================
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
