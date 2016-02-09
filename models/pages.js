'use strict';
/**
*Module dependencies
*/
//-----------------------------------------------------------------------------
var mongoose = require('mongoose');
//=============================================================================
/**
*Pages schema
*/
//-----------------------------------------------------------------------------
var PagesSchema = mongoose.Schema({
  owner: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  createdOn: {
    type: Date,
    default: Date.now,
    required: true
    }
  });
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
