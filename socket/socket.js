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
  io = require('socket.io')();
//=============================================================================
/**
*Module variables
*/
//-----------------------------------------------------------------------------
var userSockets = {};
//=============================================================================
/**
*Config socket connection
*/
//-----------------------------------------------------------------------------
io.on('connection', function (socket) {
  console.log('A client has connected');
  //store '_id' of connected user in order to access it easily
  var ID = socket.request.session.passport.user;
  //store actual socket of connected user in order to access it easily
  //from other modules e.g. from router
  userSockets[ID] = socket;
  //send the user page data to connected client
  socket.on('getUserPageInfo', function () {
    UserModel.findOne({_id: ID}, function (err, user) {
      if(err) {
        console.error(err);
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
              console.error(err);
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
    PostsModel.find({owner: email}).sort('-createdOn').
      exec(function (err, posts) {
        if(err) {
          console.error(err);
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
              via: post.via,
              postsComments: [],
              taggedFriends: post.taggedFriends || []
            });
          });
          console.log('available posts for logged on user from getuserpostinfo', data);
          return socket.emit('userPostsInfo', data);
        });//end of exec
  });
  //send user comments data for connected client
  socket.on('getUserPostsCommentsInfo', function (posts) {
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
        console.error(err);
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
  socket.on('newPostCreated', function (email, postTitle, postID) {
    /*NB When a new post has been created, we update the user
    with all available posts...*/
    console.log(email + ' has created a new post');
    controlFlow.parallel([
      function (cb) {
        PostsModel.find({owner: email}).sort('-modifiedOn').
          exec(function (err, posts) {
            if(err) {
              console.error(err);
              return cb(err);
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
                via: post.via,
                postsComments: [],
                taggedFriends: post.taggedFriends || []
              });
            });
          console.log('available posts for logged on user from newPostCreated', data);
          socket.emit('userPostsUpdate', data);
          return cb();
        });
      },
      function (cb) {
        UserModel.findOne({_id: ID}, function (err, user) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          if(!user.hasFriends) {
            return cb(null);
          }
          console.log('user friends list from control flow', user.friends);
          var sender = user.firstName +' '+ user.lastName +' (' + user.email +')';
          controlFlow.each(user.friends, function (friend, cb) {
            UserModel.findOne({email: friend}).
            exec(function (err, user) {
              if(err) {
                console.error(err);
                return cb(err);
              }
              console.log('friend email from controlFlow', user.email);
              var
                friendID = user._id,
                friendSocket = userSockets[friendID],
                msg = sender +' created a new post with title "' + postTitle +
                  '" and postID (' + postID +')';
              if(friendSocket) {
                friendSocket.emit('newPostNotification', msg);
                return cb();
              }
              return cb(null);
            });
            },
          function (err) {
            if(err) {
              console.error('throw errors from notifying friends of new post',err);
              throw(err);
            }
            return null;
          });//end control flow each
        });//end outer UserModel to grab post creator
    }], function (err, results) {
      if(results) {
        return null;
      }
      return console.error('final throw errors from notifying friends of new post',err);
    });//end control flow parallel
  });
  //when user shares an existing post
  socket.on('sharedPost', function (email, postTitle, postID, postOwner) {
    /*NB When a new post has been created, we update the user
    with all available posts...*/
    console.log(email + ' has shared a post');
    controlFlow.parallel([
      function (cb) {
        PostsModel.find({owner: email}).sort('-createdOn').
          exec(function (err, posts) {
            if(err) {
              console.error(err);
              return cb(err);
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
                via: post.via,
                postsComments: [],
                taggedFriends: post.taggedFriends || []
              });
            });
          console.log('available posts for logged on user from shared', data);
          socket.emit('userPostsUpdate', data);
          return cb();
        });
      },
      function (cb) {
        UserModel.findOne({_id: ID}, function (err, user) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          if(!user.hasFriends) {
            return cb(null);
          }
          console.log('user friends list from control flow shared post', user.friends);
          var sender = user.firstName +' '+ user.lastName +' (' + user.email +')';
          controlFlow.each(user.friends, function (friend, cb) {
            UserModel.findOne({email: friend}).
            exec(function (err, user) {
              if(err) {
                console.error(err);
                return cb(err);
              }
              console.log('friend email from controlFlow', user.email);
              var
                friendID = user._id,
                friendSocket = userSockets[friendID],
                msg = sender +' shared a post with title "' + postTitle +
                  '" and postID (' + postID +')';
              if(friendSocket) {
                friendSocket.emit('newPostNotification', msg);
                return cb();
              }
              return cb(null);
            });
            },
          function (err) {
            if(err) {
              console.error('throw errors from notifying friends of shared post',err);
              throw(err);
            }
            return null;
          });//end control flow each
        });//end outer UserModel to grab post creator
    }], function (err, results) {
      if(results) {
        return null;
      }
      return console.error('final throw errors from notifying friends of shared post',err);
    });//end control flow parallel
  });
  //when user status changes
  socket.on('userStatusChanged', function () {
    UserModel.findOne({_id: ID}, function (err, user) {
      if(err) {
        console.error(err);
        throw(err);
      }
      var data = {
        status: user.status
      };
      socket.emit('updateStatus', data);
      if(!user.hasFriends) {
        console.log('user has no friends to notify');
        return null;
      }
      console.log('user friends list from control flow status changed', user.friends);
      var sender = user.firstName +' '+ user.lastName +' (' + user.email +')';
      controlFlow.each(user.friends, function (friend, cb) {
        UserModel.findOne({email: friend}).
        exec(function (err, user) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('friend email from controlFlow user status', user.email);
          var
            friendID = user._id,
            friendSocket = userSockets[friendID],
            msg = sender +' has changed status';
          if(friendSocket) {
            friendSocket.emit('statusChangeNotification', msg);
            return cb();
          }
          return cb(null);
        });
        },
      function (err) {
        if(err) {
          console.error('throw errors from notifying friends of made comment',err);
          throw(err);
        }
        return null;
      });//end control flow each
    });//end outer UserModel to grab post creator
  });
  //when user adds a new friend
  socket.on('addedFriend', function (newFriend) {
    console.log('added friend notification received from frontend');
    UserModel.findOne({_id: ID}, function (err, user) {
      if(err) {
        console.error(err);
        throw(err);
      }
      console.log('user friends list from control flow added friend', user.friends);
      var sender = user.firstName +' '+ user.lastName +' (' + user.email +')';
      controlFlow.each(user.friends, function (friend, cb) {
        UserModel.findOne({email: friend}).
        exec(function (err, user) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('friend email from controlFlow added friend', user.email);
          var
            friendID = user._id,
            friendSocket = userSockets[friendID],
            msg = sender +' has added ' + newFriend +' as a new friend';
          if(friendSocket) {
            friendSocket.emit('addNewFriendNotification', msg);
            return cb();
          }
          return cb(null);
        });
        },
      function (err) {
        if(err) {
          console.error('throw errors from notifying friends of ad new friendt',err);
          throw(err);
        }
        return null;
      });//end control flow each
    });//end outer UserModel to grab post creator
  });
  //when frontend request for user profile info
  socket.on('getUserProfileInfo', function () {
    UserModel.findOne({_id: ID}).
      exec(function (err, user) {
        if(err) {
          console.error(err);
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
    var User = {};
    UserModel.findOne({_id: ID}, function (err, user) {
      if(err) {
        console.error(err);
        throw(err);
      }
      User.email = user.email,
      User.firstName = user.firstName,
      User.lastName = user.lastName
      console.log('get online friends request from ', User);
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
              console.log('emitting nowonline to friends');
              userSockets[id].emit('nowOnline', User);
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
        console.error(err);
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
        console.error(err);
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
  //on tagged friends
  socket.on('taggedFriends', function (postID, postTitle, list) {
    console.log('notification of friends tagged for post with ID', postID);
    console.log('friends list', list);
    UserModel.findOne({_id: ID}, function (err, user) {
      if(err) {
        console.error(err);
        throw(err);
      }
      var sender = user.firstName +' '+ user.lastName +' (' + user.email +')';
      controlFlow.each(list, function (friend, cb) {
        UserModel.findOne({email: friend}).
        exec(function (err, user) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('friend email from controlFlow', user.email);
          //console.log('tagged friend from control flow', user);
          var
            friendID = user._id,
            friendSocket = userSockets[friendID],
            msg = sender +' has tagged you in a post titled "' + postTitle +
              '" and postID (' + postID +')';
          if(friendSocket) {
            friendSocket.emit('tagNotification', msg);
            return cb();
          }
          return cb(null);
        });
        },
      function (err) {
        if(err) {
          console.error('throw errors from friend tagging',err);
          throw(err);
        }
        return null;
      });
    });
  });
  //on 'like post'
  socket.on('likedPost', function (title, postID) {
    UserModel.findOne({_id: ID}, function (err, user) {
      if(err) {
        console.error(err);
        throw(err);
      }
      if(!user.hasFriends) {
        console.log('user has no friends to notify');
        return null;
      }
      console.log('user friends list from control flow likedpost', user.friends);
      var sender = user.firstName +' '+ user.lastName +' (' + user.email +')';
      controlFlow.each(user.friends, function (friend, cb) {
        UserModel.findOne({email: friend}).
        exec(function (err, user) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('friend email from controlFlow liked podt', user.email);
          var
            friendID = user._id,
            friendSocket = userSockets[friendID],
            msg = sender +' liked a post with title "' + title +
              '" and postID (' + postID +')';
          if(friendSocket) {
            friendSocket.emit('likePostNotification', msg);
            return cb();
          }
          return cb(null);
        });
        },
      function (err) {
        if(err) {
          console.error('throw errors from notifying friends of like post',err);
          throw(err);
        }
        return null;
      });//end control flow each
    });//end outer UserModel to grab post creator
  });
  //when comment is made
  socket.on('madeComment', function (title, postID, commentID) {
    UserModel.findOne({_id: ID}, function (err, user) {
      if(err) {
        console.error(err);
        throw(err);
      }
      if(!user.hasFriends) {
        console.log('user has no friends to notify');
        return null;
      }
      console.log('user friends list from control flow make comment', user.friends);
      var sender = user.firstName +' '+ user.lastName +' (' + user.email +')';
      controlFlow.each(user.friends, function (friend, cb) {
        UserModel.findOne({email: friend}).
        exec(function (err, user) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('friend email from controlFlow made comment', user.email);
          var
            friendID = user._id,
            friendSocket = userSockets[friendID],
            msg = sender +' commented on a post with title "' + title +
              '" postID (' + postID +') and commentID (' + commentID +')';
          if(friendSocket) {
            friendSocket.emit('madeCommentNotification', msg);
            return cb();
          }
          return cb(null);
        });
        },
      function (err) {
        if(err) {
          console.error('throw errors from notifying friends of made comment',err);
          throw(err);
        }
        return null;
      });//end control flow each
    });//end outer UserModel to grab post creator
  });
  //on liked comment
  socket.on('likedComment', function (author, postID, commentID) {
    UserModel.findOne({_id: ID}, function (err, user) {
      if(err) {
        console.error(err);
        throw(err);
      }
      if(!user.hasFriends) {
        console.log('user has no friends to notify');
        return null;
      }
      console.log('user friends list from control flow like comment', user.friends);
      var sender = user.firstName +' '+ user.lastName +' (' + user.email +')';
      controlFlow.each(user.friends, function (friend, cb) {
        UserModel.findOne({email: friend}).
        exec(function (err, user) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('friend email from controlFlow like comment', user.email);
          var
            friendID = user._id,
            friendSocket = userSockets[friendID],
            msg = sender +' liked a comment by "' + author +
              '" with postID (' + postID +') and commentID (' + commentID +')';
          if(friendSocket) {
            friendSocket.emit('likeCommentNotification', msg);
            return cb();
          }
          return cb(null);
        });
        },
      function (err) {
        if(err) {
          console.error('throw errors from notifying friends of like comment',err);
          throw(err);
        }
        return null;
      });//end control flow each
    });//end outer UserModel to grab post creator
  });
  //when we like our friend's post
  socket.on('likedFriendPost', function (title, postID) {
    //get our friend list
    UserModel.findOne({_id: ID}, function (err, user) {
      if(err) {
        console.error(err);
        throw(err);
      }
      if(!user.hasFriends) {
        console.log('user has no friends to notify');
        return null;
      }
      console.log('user friends list from control flow like comment', user.friends);
      var sender = user.firstName +' '+ user.lastName +' (' + user.email +')';
      //notify all friends of our action
      controlFlow.each(user.friends, function (friend, cb) {
        UserModel.findOne({email: friend}).
        exec(function (err, user) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('friend email from controlFlow like friend post', user.email);
          var
            friendID = user._id,
            friendSocket = userSockets[friendID],
            msg = sender +' liked a post with title "' + title +
              '" and postID (' + postID +')';
          if(friendSocket) {
            friendSocket.emit('likePostNotification', msg);
            return cb();
          }
          return cb(null);
        });
        },
      function (err) {
        if(err) {
          console.error('throw errors from notifying friends of like friend post',err);
          throw(err);
        }
        return null;
      });//end control flow each
    });//end outer UserModel to grab post creator
  });
  //on disconnect
  socket.on('disconnect', function () {
    //console.log('user sockets obj', userSockets);
    var User;
    UserModel.findOne({_id: ID}, function (err, user) {
      if(err) {
        console.error(err);
        throw(err);
      }
      User = user.email;
      console.log('now offline notice from ',user.email);
      var friendsList = user.friends;
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
              console.log('emitting nowoffline to friends');
              userSockets[id].emit('nowOffline', User);
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
        delete userSockets[ID];
        return console.log('The client has disconnected');
      });
    });
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
