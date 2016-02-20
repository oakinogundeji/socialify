'use strict';
/**
*Module dependencies
*/
//-----------------------------------------------------------------------------
var
  mongoose = require('mongoose'),
  //autopopulate = require('mongoose-autopopulate'),
  paginate = require('mongoose-paginate');
//=============================================================================
/**
*Posts schema
*/
//-----------------------------------------------------------------------------
var PostsSchema = mongoose.Schema({
  forPage: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Pages'
  },
  owner: {
    type: String,
    required: true
  },
  postID: {
    type: String,
    required: true
  },
  content: {
    title: {
      type: String,
      required: true
    },
    text: String,
    img: String
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comments'
  }],
  createdOn: {
    type: Date,
    default: Date.now,
    required: true
  },
  modifiedOn: {
    type: Date,
    default: Date.now,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  via: String
});
//=============================================================================
/**
*Declare Schema pagination plugin
*/
//-----------------------------------------------------------------------------
/*PostsSchema.plugin(mongoosePaginate);
we'll include pagination after everything works ok*/
//PostsSchema.plugin(autopopulate);
//=============================================================================
/**
*Create Posts model
*/
//-----------------------------------------------------------------------------
var PostsModel = mongoose.model('Posts', PostsSchema);
//==============================================================================
/**
*Export Posts model
*/
//-----------------------------------------------------------------------------
module.exports = PostsModel;
//==============================================================================
