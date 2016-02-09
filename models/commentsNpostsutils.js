'use strict';
/**
*Module dependencies
*/
//-----------------------------------------------------------------------------
var
  CommentsModel = require('./comments'),
  PostsModel = require('./posts');
//=============================================================================
/**
*Create utility functions for posts
*/
//-----------------------------------------------------------------------------
function findPostsByTitle(req, res) {
  var query = PostsModel.find({}).where({'content.title': req.params.title}).
    sort('-modifiedOn');
    return query;
}
/*NB to execute the above query in the endpoint handler
we would do something like
var query = findPostsByTitle(req, res, next)
query.exec(function (err, result) {...
the response would be returned from within this cb})
We will use pagination to limit the result by page*/

/*The following function is used when a post is liked or shared*/
function findPostById(req, res, next) {
  return PostsModel.findById(req.params.id,
    function (err, post) {
      if(err) {
        return next(err);
      }
      if(post == null) {
        return res.status(404).json('The required Post does not exist in the dBase');
      }
      return res.status(200).json(post);
  });
}
//The following function returns all the posts created by the user
function viewAllPostsForUser(req, res, user, next) {
  var query = PostsModel.find({owner: user}).sort('-modifiedOn');
  query.exec(function (err, posts) {
    if(err) {
      return next(err);
    }
    if(posts == null) {
      return res.status(404).json('No Posts in the dBase for the given user');
    }
    return res.status(200).json(posts);
  });
  /*return PostsModel.find({owner: user},
  function (err, posts) {
    if(err) {
      return next(err);
    }
    if(posts == null) {
      return res.status(404).json('No Posts in the dBase for the given user');
    }
    return res.status(200).json(posts);
  });*/
}

function getAllPostsForUser(req) {
  var query = PostsModel.findOne({owner: req.user.emal}).sort('-modifiedOn').
    exec(function (err, posts) {
      if(err) {
        throw(err);
      }
      if(posts == null) {
        return null;
      }
      return posts;
    });
}

function viewAllPosts(req, res, next) {
  return PostsModel.find({},
  function (err, posts) {
    if(err) {
      return next(err);
    }
    if(posts == null) {
      return res.status(404).json('No Posts in the dBase');
    }
    return res.status(200).json(posts);
  });
}//we will also use pagination and streaming to make this efficient
/*we expect to call the following function to update the post which matches the
title only for the owner with the given id*/
function updatePostsTxt(req, res, next) {
  return PostsModel.findOne({'owner': req.user._id, 'content.title': req.params.title},
  function (err, post) {
    if(err) {
      return next(err);
    }
    if(post == null) {
      return res.status(404).json('Posts not found in the dBase');
    }
    posts.content.title = req.body.title || posts.content.title;
    posts.content.text = req.body.text || posts.content.text;
    post.save(function (err, post) {
      if(err) {
        return next(err);
      }
      return res.status(200).json(post);
    });
  });
}
/*To update the media content of a post we need to know the
title of the post*/
function updatePostsMedia(req, res, newMedia, next) {
  return PostsModel.findOne({'owner': req.user._id, 'content.title': req.params.title},
  function (err, post) {
    if(err) {
      return next(err);
    }
    if(post == null) {
      return res.status(404).json('Posts not found in the dBase');
    }
    posts.content.media.filename = newMedia.filename || posts.content.media.filename;
    posts.content.media.mediaType = newMedia.filename || posts.content.media.mediaType;
    post.save(function (err, post) {
      if(err) {
        return next(err);
      }
      return res.status(200).json(post);
    });
  });
}

function deletePosts(req, res, next) {
  return PostsModel.findOneAndRemove({'owner': req.user._id, 'content.title': req.params.title},
 function (err, Posts) {
   if(err) {
     return next(err);
   }
   if(Posts == null) {
     return res.status(404).json('Posts not found in the dBase');
   }
   return res.status(200).json(Posts);
 });
}
//=============================================================================
/**
*Create utility functions for comments
*/
//-----------------------------------------------------------------------------
function viewAllCommentsForPost(req, res, post, next) {
  return CommentsModel.find({forPost: post},
  function (err, comments) {
    if(err) {
      return next(err);
    }
    if(comments == null) {
      return res.status(404).json('No comments for ' + post +' in the dBase');
    }
    return res.status(200).json(comments);
  });
}//we will also use pagination and streaming to make this efficient

function getAllCommentsForPost(post) {
  return CommentsModel.find({forPost: post},
  function (err, comments) {
    if(err) {
      throw(err);
    }
    if(comments == null) {
      return null;
    }
    return comments;
  });
}
/*This function is called when a particular comment is to be shared or liked*/
function findCommentById(req, res, next) {
  return CommentsModel.findById(req.params.id,
    function (err, comment) {
      if(err) {
        return next(err);
      }
      if(comment == null) {
        return res.status(404).json('The required Comment does not exist in the dBase');
      }
      return res.status(200).json(comment);
  });
}
//=============================================================================
/**
*Export Module
*/
//-----------------------------------------------------------------------------
module.exports = {
  getAllPostsForUser: getAllPostsForUser,
  viewAllPostsForUser: viewAllPostsForUser,
  viewAllPosts: viewAllPosts,
  updatePostsTxt: updatePostsTxt,
  updatePostsMedia:updatePostsMedia,
  deletePosts:deletePosts,
  getAllCommentsForPost: getAllCommentsForPost,
  viewAllCommentsForPost:viewAllCommentsForPost,
  findCommentById: findCommentById
};
//=============================================================================
