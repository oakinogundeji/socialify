'use strict';
/**
*Module dependencies
*/
//-----------------------------------------------------------------------------
var PageModel = require('./pages');
//=============================================================================
/**
*Create utility functions
*/
//-----------------------------------------------------------------------------
//return the page for a single Page
function findPageByUser(req) {
  return PageModel.findOne({owner: req.user.email},
    function (err, page) {
      if(err) {
        throw(err);
      }
      //console.log('the page', page);
      /*if(page == null) {
        return null;
      }*/
      return page;
  });
}

function viewPageByUser(req, res, user, next) {
  return PageModel.findOne({owner: user.email},
    function (err, page) {
      if(err) {
        return next(err);
      }
      if(page == null) {
        return res.status(404).json('No Page for user in the dBase');
      }
      return res.status(200).json(page);
  });
}

function viewAllPages(req, res, next) {
  return PageModel.find({},
  function (err, pages) {
    if(err) {
      return next(err);
    }
    if(pages == null) {
      return res.status(404).json('No Pages in the dBase');
    }
    return res.status(200).json(pages);
  });
}
function deletePageForUser(req, res, user, next) {
  return PageModel.findOneAndRemove({owner: user.email},
 function (err, page) {
   if(err) {
     return next(err);
   }
   if(page == null) {
     return res.status(404).json('Page not found in the dBase');
   }
   return res.status(200).json(page);
 });
}
//=============================================================================
/**
*Export Module
*/
//-----------------------------------------------------------------------------
module.exports = {
  findPageByUser: findPageByUser,
  viewAllPages: viewAllPages,
  deletePageForUser: deletePageForUser,
  viewPageByUser: viewPageByUser
};
//=============================================================================
