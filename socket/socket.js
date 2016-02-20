'use strict';
/**
*Module Dependencies
*/
//-----------------------------------------------------------------------------
var
  controlFlow = require('async'),
  UserModel = require('../models/users'),
  PagesModel = require('../models/pages'),
  PostsModel = require('../models/posts'),
  CommentsModel = require('../models/comments'),
  ChatMsgModel = require('../models/chatMsgs'),
  commentsNpostsUtils = require('../models/commentsNpostsutils'),
  io = require('socket.io')();
//=============================================================================
/**
*Module variables
*/
//-----------------------------------------------------------------------------
var
  getUserPosts = commentsNpostsUtils.getAllPostsForUser,
  getUserComments = commentsNpostsUtils.getAllCommentsForPost,
  userSockets = {};
/**
*Config socket connection
*/
//-----------------------------------------------------------------------------
io.on('connection', function (socket) {
  //Socket = socket;
  console.log('A client has connected');
  //store '_id' of connected user in order to access it easily
  var ID = socket.request.session.passport.user;
  //store actual socket of connected user in order to access it easily
  //from other modules e.g. from router
  userSockets[ID] = socket;
  //console.log('user sockets obj', userSockets);
  //send the user page data to connected client
  socket.on('getUserPageInfo', function () {
    //console.log('user requesting page', data);
    UserModel.findOne({_id: ID}, function (err, user) {
      if(err) {
        throw(err);
      }
      var query;
      if(user.hasPage) {
        query = PagesModel.findOne({owner: ID});
      }
      if(user.hasPage && user.hasPosts) {
        query = query.populate('Posts');
      }
      if(user.hasPage && user.hasPosts && user.hasComments) {
        query = PagesModel.findOne({owner: ID}).
          populate({
            path: 'Posts',
            populate: {
              path: 'Comments'
            }
          });
        }
        query.exec(function (err, page) {
            if(err) {
              throw(err);
            }
            if(!page) {
              console.log('no page for logged on user');
              return socket.emit('noUserPageInfo');
            }
            console.log('page info of logged on user', page);
            var data = {
              title: page.title,
              description: page.description
            };
            console.log('page data to send to frontend', data);
            return socket.emit('userPageInfo', data);
          });
    });
  });
  //send user posts data for connected client
  socket.on('getUserPostsInfo', function (email) {
    PostsModel.find({owner: email}).sort('-modifiedOn').
      exec(function (err, posts) {
        if(err) {
          throw(err);
        }
        if(posts.length < 1) {
          console.log('no posts to show from get user posts socket line  86');
            return socket.emit('noPostsInfo');
          }
          var data = [];
          posts.forEach(function (post) {
            return data.push({
              owner: post.owner,
              title: post.content.title,
              text: post.content.text,
              img: post.content.img,
              postID: post.postID,
              likes: post.likes,
              postsComments: []
            });
          });
          console.log('available posts for logged on user from getuserpostinfo', data);
          return socket.emit('userPostsInfo', data);
        })
  });
  //send user comments data for connected client
  socket.on('getUserPostsCommentsInfo', function (posts) {
    //TODO format posts to extraxt titles only
    var commentsArray = [];
    console.log('available posts for logged on user from getpostcomments', posts);
    /*NB async.each requires that the 'cb' called on fulfimment of the 'each()'
    operation should only be passed an arg if there's an error! notice how
    the 'cb' is called differntly on lines 76,80 n 86!*/
    controlFlow.each(posts, function (post, cb) {
      console.log('postID from controlFlow', post.postID);
      CommentsModel.find({'forPost.postID': post.postID}).sort('-createdOn').
      exec(function (err, comments) {
        if(err) {
          console.error(err);
          return cb(err);
        }
        if(comments.length < 1) {
            console.log('null post comments from exec', comments);
            return cb();
          }
          console.log('post comments from exec get postcomments', comments);
          var filteredComments = [];
          comments.forEach(function (comment) {
            return filteredComments.push({
              postID: comment.forPost.postID,
              commentID: comment.commentID,
              likes: comment.likes,
              author: comment.author,
              content: comment.content
            });
          });
          commentsArray.push(filteredComments);
          return cb();
        });
        },
    function (err) {
      if(err) {
        console.error('throw errors error',err);
        throw(err);
      }
      if(commentsArray.length < 1) {
        console.log('empty comments array', commentsArray);
        return socket.emit('noUserPostsCommentsInfo');
      }
      console.log('comments array', commentsArray);
      return socket.emit('userPostsCommentsInfo', commentsArray);
    });
  });
  //when the user page has been created and photo has been uploaded
  socket.on('userPhotoUploaded', function () {
    UserModel.findOne({_id: ID}, function (err, user) {
      if(err) {
        throw(err);
      }
      var data = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        hasPage: user.hasPage,
        hasFriends: user.hasFriends,
        profilePhoto: user.profilePhoto,
        friendsList: user.friends
      };
      return socket.emit('updatedUserInfo', data);
    });
  });
  //when a new post has been submitted
  socket.on('newPostCreated', function (email) {
    console.log(email + ' has created a new post');
    PostsModel.find({owner: email}).sort('-modifiedOn').
      exec(function (err, posts) {
        if(err) {
          throw(err);
        }
        var data = [];
        posts.forEach(function (post) {
          return data.push({
            owner: post.owner,
            title: post.content.title,
            text: post.content.text,
            img: post.content.img,
            postID: post.postID,
            likes: post.likes
          });
        });
      console.log('available posts for logged on user from newPostCreated', data);
      return socket.emit('userPostsUpdate', data);
    });
  });
  //when frontend request for user profile info
  socket.on('getUserProfileInfo', function () {
    UserModel.findOne({_id: ID}).
      exec(function (err, user) {
        if(err) {
          throw(err);
        }
        var data = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          status: user.status,
          hasPage: user.hasPage,
          hasFriends: user.hasFriends,
          profilePhoto: user.profilePhoto,
          friendsList: user.friends
        };
        return socket.emit('userProfileInfo', data);
      });
  });
  //when chat app request for online friends
  socket.on('getOnlineFriends', function () {
    UserModel.findOne({_id: ID}, function (err, user) {
      if(err) {
        throw(err);
      }
      console.log('get online friends request from ',user.email);
      var
        friendsList = user.friends,
        onlineFriends = [];
      controlFlow.each(friendsList, function (email, cb) {
        console.log('friend email from controlFlow', email);
        UserModel.findOne({email: email}).
        exec(function (err, user) {
            if(err) {
              console.error(err);
              return cb(err);//error accessing friend record
            }
            console.log('friend _id from exec', user._id);
            var id = user._id;
            if(id in userSockets) {
              onlineFriends.push({
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
              });
              return cb();//friend online
            }
            return cb(null);//bcos friend offline but no error
          });
          },
      function (err) {
        if(err) {
          console.error('throw errors error',err);
          throw(err);
        }
        if(onlineFriends.length < 1) {
          console.log('empty onlineFriends array', onlineFriends);
          return socket.emit('noOnlineFriends');
        }
        console.log('onlineFriends array', onlineFriends);
        /*We need to call 'io.emit' bcos when a user logs on any already
        logged on friends need to be informed that the user is now available*/
        io.emit('availableOnlineFriends', onlineFriends);
        return socket.emit('availableOnlineFriends', onlineFriends);
      });
    });
  });
  //on request for available chat msgs
  socket.on('getChatMsgs', function (owner, target) {
    console.log('get msgs request from ' + owner  +' involving ' + target);
    //NB the 'or()' operation is necessary to perform logical 'OR' in order
    //to get all messages sent by or received by the connected client
    ChatMsgModel.find({}).or([{sender: owner, receiver: target}, {sender: target, receiver: owner}]).sort('-createdOn').limit(20).
    exec(function (err, msgs) {
      if(err) {
        throw(err);
      }
      console.log('available chat msgs for ' + owner +' are ' + msgs);
      var msgArray = [];
      msgs.forEach(function (msg) {
        return msgArray.push({
          from: msg.sender,
          to: msg.receiver,
          msg: msg.msg
        });
      });
      return socket.emit('availableChatMsgs', msgArray);
    });
  });
  //on receipt of chatMsgs
  socket.on('newChatMsg', function (data) {
    console.log('new chat msg received from frontend', data);
    var newChatMsg = new ChatMsgModel();
    newChatMsg.sender = data.from;
    newChatMsg.receiver = data.to;
    newChatMsg.msg = data.msg;
    newChatMsg.save(function (err) {
      if(err) {
        throw(err);
      }
      console.log('new chat msg saved successfully', newChatMsg);
      UserModel.findOne({email: data.to}, function (err, user) {
        if(err) {
          throw(err);
        }
        var
          friendID = user._id,
          friendSocket = userSockets[friendID];
        friendSocket.emit('newChatMsg', data);
        return socket.emit('newChatMsg', data);
      });
    });
  });
  //on disconnect
  socket.on('disconnect', function () {
    console.log('The client has disconnected');
    delete userSockets[ID];
    //console.log('user sockets obj', userSockets);
    return io.emit('updateOnlineFriends');
  });
});
//=============================================================================
/**
*Export module
*/
//-----------------------------------------------------------------------------
module.exports = {
  io: io,
  userSockets: userSockets
};
//=============================================================================
