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
*Pages schema
*/
//-----------------------------------------------------------------------------
var PagesSchema = mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Posts'
  }],
  createdOn: {
    type: Date,
    default: Date.now,
    required: true
    }
  });
//=============================================================================
/**
*Declare Schema plugins
*/
//-----------------------------------------------------------------------------
//PagesSchema.plugin(autopopulate);
//=============================================================================
//=============================================================================
/**
*Create Pages model
*/
//-----------------------------------------------------------------------------
var PagesModel = mongoose.model('Pages', PagesSchema);
//==============================================================================
/**
*Export Pages model
*/
//-----------------------------------------------------------------------------
module.exports = PagesModel;
//==============================================================================
