'use strict';
/**
*Module dependencies
*/
//-----------------------------------------------------------------------------
var
  mongoose = require('mongoose'),
  paginate = require('mongoose-paginate');
//=============================================================================
/**
*Posts schema
*/
//-----------------------------------------------------------------------------
var PostsSchema = mongoose.Schema({
  owner: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    title: {
      type: String,
      required: true
    },
    text: String,
    media: {
      filename: String,
      mediaType: String
    }
  },
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
