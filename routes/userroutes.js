'use strict';
/**
*Module Dependencies
*///TODO FOR MODULE, USE SOCKETS WITHIN ROUTE HANDLERS RATHER THAN IN SOCKET MODULE
//-----------------------------------------------------------------------------
var
  fs = require('fs'),
  os = require('os'),
  express = require('express'),
  controlFlow = require('async'),
  knox = require('knox'),
  gm = require('gm'),
  formidable = require('formidable'),
  userSockets = require('../socket/socket').userSockets,
  UserModel = require('../models/users'),
  PageModel = require('../models/pages'),
  PostsModel = require('../models/posts'),
  CommentsModel = require('../models/comments'),
  config = require('../config/config');
//==============================================================================
/**
*Create Router instance
*/
//-----------------------------------------------------------------------------
var router = express.Router();
//==============================================================================
/**
*Module variables
*/
//-----------------------------------------------------------------------------
var
  isLoggedIn = require('../utils/isLoggedIn'),
  knoxClient = knox.createClient({
    key: config.S3.key,
    secret: config.S3.secret,
    bucket: config.S3.bucket
  }),
  S3PhotoPrefix = 'https://s3-us-west-2.amazonaws.com/teliossocialify/',
  getSocket = function (req) {
    var
      ID = req.user._id,
      webSocket = userSockets[ID];
    return webSocket;
  };

function generateRandomFileName(filename) {
  var
    ext_regex = /(?:\.([^.]+))?$/,
    ext = ext_regex.exec(filename)[1],
    date = new Date().getTime(),
    xterBank = 'abcdefghijklmnopqrstuvwxyz',
    fstring = '',
    i;
  for(i = 0; i < 15; i++) {
    fstring += xterBank[parseInt(Math.random()*26)];
  }
  return (fstring += date +'.'+ ext);
}

function generateRandomPageID() {
  var
    date = new Date().getTime(),
    xterBank = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    fstring = '',
    i;
  for(i = 0; i < 17; i++) {
    fstring += xterBank[parseInt(Math.random()*52)];
  }
  return (fstring += date);
}
//=============================================================================
/**
*Middleware
*/
//-----------------------------------------------------------------------------

//==============================================================================
/**
*Routes
*/
//-----------------------------------------------------------------------------
//---------------------------Newuser page creation routes----------------------
router.post('/newpage/:email', isLoggedIn, function (req, res) {
  console.log('new user page data from client', req.body);
  var
    useremail = req.params.email,
    userPageTitle = req.body.title,
    userPageDescription = req.body.description,
    userStatus = req.body.status,
    userPwdRecoverEmail = req.body.pwdRecoveryEmail,
    userPageID;
    controlFlow.series([
      function (cb) {
        var newPage = new PageModel();
        newPage.owner = req.user._id;
        newPage.title = userPageTitle;
        newPage.description = userPageDescription;
        newPage.save(function (err, page) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('user page created', page);
          console.log('user page data b4 page created', req.user.pageID);
          userPageID = page._id;
          return cb(null, page);
        });
      },
      function (cb) {
        UserModel.findOne({email: useremail}, function (err, user) {
        if(err) {
          console.error(err);
          return cb(er);
        }
        user.hasPage = true;
        user.status = userStatus;
        user.pwdRecoveryEmail = userPwdRecoverEmail;
        user.pageID = userPageID;
        user.save(function (err, duser) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('updated user page data', duser.pageID);
          console.log('updated user data', duser);
          return cb(null, duser);
        });
      });
    }], function (err, results) {
      if(results) {
        console.log('user page data has been updated', results);
        return res.status(200).json('OK!');
      }
      return res.status(500).render('pages/errors');
    });
});
//---------------------------Newuser profile photo creation routes-------------
router.post('/profilepix/:email', isLoggedIn, function (req, res) {
//The following declares required variables
  var
    //ID = req.user._id,
    socket = getSocket(req),
    tmpFile,//holds ref to complete path of uploaded file
    newFile,//holds complete path to new filename for received uploade file
    fileName,//used to generate a new random filename for storage in S3 bucket
    newForm = new formidable.IncomingForm();
//............................................................................//
//formidable parses the received form data here
  newForm.keepExtensions = true;
  newForm.parse(req, function (err, fields, files) {//parse received file
    console.log('received profile pix files from frontend', files);
    tmpFile = files.profilePix.path;
    fileName = generateRandomFileName(files.profilePix.name);
    newFile = os.tmpDir() +'/'+ fileName;
    return res.status(200).json('OK!');
  });
//............................................................................//
  newForm.on('end', function () {//once file has been uploaded to server
    fs.rename(tmpFile, newFile, function () {//first rename the received file
    //then resize img n upload to S3 bucket
    //1st resize the target file to width of 120pixels
    //while maintaining aspect ratio and overwrite the source
    gm(newFile).resize(120).write(newFile, function () {
//............................................................................//
        //then we upload to S3 here
        //upload to S3 bucket
        fs.readFile(newFile, function (err, buff) {
        //we use fileName to store the file on S3,
        //the JSON obj describes the file we're uploading to S3
          var S3Req = knoxClient.put(fileName, {
          'Content-Length': buff.length,
          'Content-Type': 'Image/*'//means any type of image
          });
//............................................................................//
          S3Req.on('response', function (S3res) {
            if(S3res.statusCode == 200) {//successful upload to S3
              //store the filename as value of user pix on mongoDB
              UserModel.findOne({_id: req.user._id}, function (err, user) {
                if(err) {
                  console.error(err);
                  throw(err);
                }
                user.profilePhoto = S3PhotoPrefix + fileName;
                user.save(function (err) {
                  if(err) {
                    console.error(err);
                    throw(err)
                  }
                  console.log('user profile photo', user.profilePhoto);
                  //update frontend with new user data
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
                  console.log('user updated profile', data);
                  socket.emit('updatedUserInfo', data);
                  //delete server copy of uploaded file
                  fs.unlink(newFile, function (err) {
                    if(err) {
                      console.error(err);
                      throw(err)
                    }
                    return console.log('local copy of ' + newFile +' has been deleted')
                  }); //end of fs.unlink()
                });//end of user.save()
              });//end of UserModel.findOne()
            }//end of 'if(S3res.statusCode == 200)'
//............................................................................//
          });//end of 'S3Req.on('response')'
          S3Req.on('error', function (err) {
            console.error(err);
            //throw(err);
          });
          S3Req.end(buff);//ends knox connection to S3
        });//end of 'fs.readFile(newFile)'
      });//end of 'gm(newFile)'
    });//end of 'fs.rename(tmpFile)'
  });//end of 'newForm.on('end')'
});//end of route handler
//---------------------------User post creation routes-------------------------
router.post('/posts/newposts', function (req, res) {
  console.log('new posts data from client', req.body);
  //return res.status(200).json('OK!');
  /*TODO use control flow sereis to 1st store post, then on success
  push post.content.title to 'posts' array of PagesModel*/
  var
    userEmail = req.user.email,
    postData = req.body.data,
    title = postData.title,
    text = postData.text,
    img = postData.img,//required in order to have a reference when an img needs to be uploaded
    newPost,
    postID,
    newPostID;
  controlFlow.series([
    function (cb) {
      newPost = new PostsModel();
      console.log('post submitted by', userEmail);
      console.log('new post data received succesfully', postData);
      newPost.forPage = req.user.pageID;
      newPost.owner = userEmail;
      newPost.content.title = title;
      newPost.content.text = text;
      newPost.content.img = img;
      newPost.postID = generateRandomPageID();
      newPost.save(function (err, post) {
        if(err) {
          console.error(err);
          cb(err);
        }
        req.user.hasPosts = req.user.hasPosts || true;
        newPostID = post.postID;
        postID = post._id;
        console.log('new post data successfully created', post);
        return cb(null, post);
      });
    },
    function (cb) {
      PageModel.findOne({owner: req.user._id}, function (err, page) {
        if(err) {
          console.error(err);
          return cb(err);
        }
        console.log('initial posts for page', page.posts);
        page.posts.unshift(postID);
        page.save(function (err, page) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('updated posts for page', page);
          return cb(null, page);
        });
      });
  }], function (err, results) {
    if(results) {
      console.log('user page has been updated with posts data', results);
      return res.status(200).json(newPostID);
    }
    return res.status(500).render('pages/errors');
  });
});
//---------------------------user post image route-----------------------------
router.post('/posts/newposts/:title/imgs', function (req, res) {
  var
    postTitle = req.params.title,
    socket = getSocket(req),
    tmpFile,
    newFile,
    fileName,
    imgName,
    newForm = new formidable.IncomingForm();
  console.log('post title from route handler', postTitle);
  newForm.keepExtensions = true;
  newForm.parse(req, function (err, fields, files) {//parse received file
    console.log('received post img files from frontend', files);
    tmpFile = files.img.path;
    fileName = generateRandomFileName(files.img.name);
    newFile = os.tmpDir() +'/'+ fileName;
    imgName = files.img.name;
    return res.status(200).json('OK!');
  });
  newForm.on('end', function () {
    console.log('post img file fully uploaded');
    fs.rename(tmpFile, newFile, function () {//first rename the received file
    //then resize img n upload to S3 bucket
    //1st resize the target file to width of 300 pixels
    //while maintaining aspect ratio and overwrite the source
    gm(newFile).resize(300).write(newFile, function () {
//............................................................................//
        //then we upload to S3 here
        //upload to S3 bucket
        fs.readFile(newFile, function (err, buff) {
        //we use fileName to store the file on S3,
        //the JSON obj describes the file we're uploading to S3
          var S3Req = knoxClient.put(fileName, {
          'Content-Length': buff.length,
          'Content-Type': 'Image/*'//means any type of image
          });
//............................................................................//
          S3Req.on('response', function (S3res) {
            if(S3res.statusCode == 200) {//successful upload to S3
              //store the filename as value of post img on mongoDB
              PostsModel.findOne({'content.title': postTitle, 'content.img': imgName}, function (err, post) {
                if(err) {
                  throw(err);
                }
                console.log('post title from S3Req', postTitle);
                console.log('returned post object from S3Req', post);
                if(!post) {
                  return console.error('there was an error retreving data for', postTitle);;
                }
                post.content.img = S3PhotoPrefix + fileName;
                post.save(function (err, post) {
                  if(err) {
                    console.error(err);
                    throw(err)
                  }
                  console.log('post with title ' +  postTitle +' and img ' + imgName +' has been saved');
                  //update frontend with new post info
                  PostsModel.find({owner: req.user.email}).sort('-modifiedOn').
                    exec(function (err, posts) {
                      if(err) {
                        console.error(err);
                        throw(err);
                      }
                      if(posts.length < 1) {
                          return socket.emit('noPostsInfo');
                        }
                        var data = [];
                        posts.forEach(function (post) {
                          return data.push({
                            title: post.content.title,
                            text: post.content.text,
                            img: post.content.img
                          });
                        });
                        console.log('available posts for logged on user from post img upload', data);
                        //socket.emit('userPostsInfo', data);
                        socket.emit('getUserPostsUpdate');
                      });
                  //delete server copy of uploaded file
                  fs.unlink(newFile, function (err) {
                    if(err) {
                      console.error(err);
                      throw(err)
                    }
                    return console.log('local copy of ' + newFile +' has been deleted')
                  }); //end of fs.unlink()
                });//end of user.save()
              });//end of PostModel.findOne()
            }//end of 'if(S3res.statusCode == 200)'
//............................................................................//
          });//end of 'S3Req.on('response')'
          S3Req.end(buff);//ends knox connection to S3
        });//end of 'fs.readFile(newFile)'
      });//end of 'gm(newFile)'
    });//end of 'fs.rename(tmpFile)'
  });
});
//---------------------------Friend search route-------------------------------
router.get('/list', function (req, res) {
  console.log('friends search data received from frontend', req.query);
  var
    firstName = req.query.firstName,
    lastName = req.query.lastName,
    email = req.query.email,
    query;
  console.log('firstname',firstName);
  console.log('lastname', lastName);
  console.log('email', email);
  query = UserModel.find({}).
    where('_id').ne(req.user._id);
  if(firstName.trim()) {
    query = query.where({firstName: firstName});
  }
  if(lastName.trim()) {
    query = query.where({lastName: lastName});
  }
  if(email.trim()) {
    query = query.where({email: email});
  }
  query.exec(function (err, users) {
    console.log('users that match search1', users);
    console.log('length of users arr', users.length);
    if(err) {
      console.error(err);
      throw(err);
    }
    if(users.length === 0) {
      return res.status(200).json('No users matching the search parameters exist!');
    }
    console.log('users that match search2', users);
    var
      usersArray = [],
      filteredUsers = users.filter(function (user) {
        return req.user.friends.indexOf(user.email) == -1;
      });
    console.log('filetered users', filteredUsers);
    filteredUsers.forEach(function (user) {
      return usersArray.push({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePhoto: user.profilePhoto
      });
    });
    return res.status(200).json({
      msg: 'You have friends...!',
      data: usersArray
    });
  });
});
//---------------------------friends route-------------------------------------
router.route('/friends').
  get(function (req,res) {
    var
      friends = req.user.friends,
      friendList = [];
    controlFlow.each(friends, function (email, cb) {
      UserModel.findOne({email: email}, function (err, user) {
        console.log('user from cobntrolflow', user);
        if(err) {
          console.error(err);
          return cb(err);
        }
        friendList.push({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profilePhoto: user.profilePhoto
        });
        return cb();
      });
    }, function (err) {
      if(err) {
        console.error('errors from get friends control flow',err);
        throw(err);
      }
      console.log('friendsList array array from cFlow', friendList);
      return res.status(200).json({
        data: friendList
      });
    });
  }).
  post(function (req, res) {
    //we only store a ref to the friends email
    console.log('friend received from frontend', req.body);
    var
      friendEmail = req.body.data.email,
      userEmail = req.user.email;
    console.log('friend email', friendEmail);
    controlFlow.parallel([
      function (cb) {
        UserModel.findOne({_id: req.user._id}, function (err, user) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('initial user friendlist', user.friends);
          user.hasFriends = user.hasFriends || true;
          user.friends.push(friendEmail);
          user.save(function (err) {
            if(err) {
              console.error(err);
              return cb(err);
            }
            var
              socket = getSocket(req),
              data = {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                status: user.status,
                hasPage: user.hasPage,
                hasFriends: user.hasFriends,
                profilePhoto: user.profilePhoto,
                friendsList: user.friends
              };
            console.log('updated user data', data);
            socket.emit('updatedUserProfile');
            return cb(null, data);
          });
        });
      },
      function (cb) {
        UserModel.findOne({email: friendEmail}, function (err, friend) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('initial friend friends list', friend.friends);
          friend.hasFriends = friend.hasFriends || true;
          friend.friends.push(userEmail);
          friend.save(function (err, user) {
            if(err) {
              console.error(err);
              return cb(err);
            }
            var
              ID = user._id,
              socket = userSockets[ID];
            console.log('updated friends friend lsit', user.friends);
            if(socket) {
              socket.emit('updatedUserProfile');
            }
            return cb();
          });
        });
    }], function (err, results) {
      if(results) {
        console.log('results of adding a friend', results);
        return res.status(200).json('OK!');
      }
      return res.status(500).render('pages/errors');
    });//end of control flow parallel
  }).
  delete(function (req, res) {
    console.log('delete friend request from frontend', req.body);
    var
      userEmail = req.user.email,
      friendEmail = req.body.email;
    controlFlow.parallel([
      function (cb) {
        UserModel.findOne({_id: req.user._id}, function (err, user) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('initial user friends list', user.friends);
          var indx = user.friends.indexOf(friendEmail);
          user.friends.splice(indx, 1);
          if(user.friends.length < 1) {
            user.hasFriends = false;
          }
          user.save(function (err) {
            if(err) {
              console.error(err);
              return cb(err);
            }
            console.log('updated user friends list', user.friends);
            var socket = getSocket(req);
            socket.emit('updatedUserProfile');
            return cb();
          });
        });
      },
      function (cb) {
        UserModel.findOne({email: friendEmail}, function (err, friend) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('initial friend friends list', friend.friends);
          var indx = friend.friends.indexOf(userEmail);
          friend.friends.splice(indx, 1);
          if(friend.friends.length < 1) {
            friend.hasFriends = false;
          }
          friend.save(function (err, user) {
            if(err) {
              console.error(err);
              return cb(err);
            }
            var
              ID = user._id,
              socket = userSockets[ID];
            console.log('updated friends friend lsit', user.friends);
            if(socket) {
              socket.emit('updatedUserProfile');
            }
            return cb();
          });
        });
    }], function (err, results) {
      if(results) {
        return res.status(200).json('OK!');
      }
      return res.status(500).render('pages/errors');
    });
  });
//---------------------------Edit profile info routes--------------------------
router.post('/:email/edit', function (req, res) {
  console.log('user edit data received', req.body);
  UserModel.findOne({_id: req.user._id}, function (err, user) {
    if(err) {
      console.error(err);
      throw(err);
    }
    console.log('original user data from edit profile', user);
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.save(function (err) {
      if(err) {
        console.error(err);
        throw(err);
      }
      var socket = getSocket(req);
      socket.emit('updatedUserProfile');
      console.log('updated user data from edit profile', user);
      return res.status(200).json('OK!');
    })
  })
});
//---------------------------User password change route------------------------
router.post('/:email/changepwd', function (req, res) {
  console.log('pwd chanhge request from frontend', req.body);
  UserModel.findOne({_id: req.user._id}, function (err, user) {
    if(err) {
      console.error(err);
      throw(err);
    }
    console.log('old pwd', user.password);
    user.password = user.generateHash(req.body.newPwd);
    user.save(function (err) {
      if(err) {
        console.error(err);
        throw(err);
      }
      console.log('new pwd', user.password);
      return res.status(200).json('OK!');
    });
  });
});
//---------------------------User status change route--------------------------
router.route('/status').
  get(function (req, res) {
    console.log('friends status query received from frontend', req.query);
    var friendEmail = req.query.email;
    UserModel.findOne({email: friendEmail}, function (err, user) {
      if(err) {
        console.error(err);
        throw(err);
      }
      if(user) {
        console.log('successfully retrieved the requested status', user.status);
        return res.status(200).json(user.status);
      }
      return res.status(500).render('pages/errors');
    });
  }).
  post(function (req, res) {
    console.log('status change frm client', req.body);
    UserModel.findOne({_id: req.user._id}, function (err, user) {
      if(err) {
        console.error(err);
        throw(err);
      }
      console.log('old status', user.status);
      user.status = req.body.status;
      user.save(function (err) {
        if(err) {
          console.error(err);
          throw(err);
        }
        console.log('new status', user.status);
        return res.status(200).json('OK!');
      });
    });
  });
//---------------------------User comments posting route-----------------------
router.route('/posts/comments').
  get(function (req, res) {
    console.log('get liked comment req for comment', req.query);
    var
      postID = req.query.postID,
      commentID = req.query.commentID;
    controlFlow.parallel([
      function (cb) {
        PostsModel.findOne({postID: postID}, function (err, post) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          var data = {
            title: post.content.title,
            text: post.content.text || null,
            img: post.content.img || null,
            postID: post.postID,
            likes: post.likes
          };
          return cb(null, data);
        });
      },
      function (cb) {
        CommentsModel.findOne({commentID: commentID}, function (err, comment) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          var data = {
            author: comment.author,
            text: comment.content || null,
            commentID: comment.commentID,
            likes: comment.likes
          };
          return cb(null, data);
        });
    }], function (err, results) {
      if(results) {
        console.log('got post and comments as requested', results);
        var
          post = results[0],
          comments = results[1];
        return res.status(200).json({
          post: post,
          comments: comments
        });
      }
      return res.status(500).render('pages/errors');
    });
  }).
  post(function (req, res) {
    console.log('comments data received from frontend', req.body);
    //return res.status(200).json('OK!');
    var
      newComment,
      commentID,
      newCommentID;
    controlFlow.series([
      function (cb) {
        newComment = new CommentsModel();
        newComment.forPost.title = req.body.data.postTitle;
        newComment.forPost.owner = req.body.data.postOwner;
        newComment.forPost.postID = req.body.data.postID;
        newComment.commentID = generateRandomPageID();
        newComment.author = req.body.data.author;
        newComment.content = req.body.data.comment;
        newComment.save(function (err, comment) {
          if(err) {
            console.error(err);
            cb(err);
          }
          console.log('new comment successfully saved', comment);
          req.user.hasComments = req.user.hasComments || true;
          commentID = comment._id;
          newCommentID = comment.commentID;
          console.log('new comments data successfully created', comment);
          return cb(null, comment);
        });
      },
      function (cb) {
        PostsModel.findOne({postID: req.body.data.postID}, function (err, post) {
            console.log('returned post obj', post);
          if(err) {
            console.error(err);
            return cb(err);
          }
          //console.log('initial comments for post', post.comments);
          post.comments.unshift(commentID);
          post.save(function (err, dpost) {
            if(err) {
              console.error(err);
              return cb(err);
            }
            console.log('updated comments for post', dpost);
            return cb(null, dpost);
          });
        });
    }], function (err, results) {
      if(results) {
        console.log('user post has been updated with comments data', results);
        return res.status(200).json(newCommentID);
      }
      return res.status(500).render('pages/errors');
    });//end controlflow series
  });
//---------------------------posts like routes---------------------------------
router.post('/posts/:postID/likes', function (req, res) {
  var postID = req.params.postID;
  console.log('add 1 like to post with postID', postID);
  PostsModel.findOne({postID: postID}, function (err, post) {
    if(err) {
      console.error(err);
      throw(err);
    }
    console.log('initial val of likes', post.likes);
    post.likes += 1;
    post.save(function (err, dpost) {
      if(err) {
        console.error(err);
        throw(err);
      }
      console.log('updated likes count', post.likes);
      return res.status(200).json('OK!');
    });
  });
});
//---------------------------comments likes route------------------------------
router.post('/posts/comments/:commentID/likes', function (req, res) {
  console.log('increase comment likes request for', req.params.commentID);
  var commentID = req.params.commentID;
  console.log('add 1 like to comment with commentID', commentID);
  CommentsModel.findOne({commentID: commentID}, function (err, comment) {
    if(err) {
      console.error(err);
      throw(err);
    }
    console.log('initial val of likes', comment.likes);
    comment.likes += 1;
    comment.save(function (err, dcomment) {
      if(err) {
        console.error(err);
        throw(err);
      }
      console.log('updated likes count', comment.likes);
      return res.status(200).json('OK!');
    });
  });
});
//---------------------------tag friends route---------------------------------
router.route('/posts/:postID/tag').
  get(function (req, res) {
    console.log('get tagged friends request for post', req.params.postID);
    PostsModel.findOne({postID: req.params.postID}, function (err, post) {
      if(err) {
        console.error(err);
        throw(err);
      }
      console.log('suddessfully retrieved the requested post', post.postID);
      var data = {
        title: post.content.title,
        text: post.content.text || null,
        img: post.content.img || null,
        postID: post.postID,
        likes: post.likes
      };
      console.log('data sent to frontend is',data);
      return res.status(200).json(data);
    });
  }).
  post(function (req, res) {
    console.log('friends to be tagged for postID ' + req.params.postID +' are ' + req.body.taggedFriendsList);
    console.log('the list is an array', Array.isArray(req.body.taggedFriendsList));
    var
      postID = req.params.postID,
      taggedFriendsList = req.body.taggedFriendsList;
    PostsModel.findOne({postID: postID}, function (err, post) {
      if(err) {
        console.error(err);
        throw(err);
      }
      console.log('initial tagged friends list for post', post.taggedFriends);
      taggedFriendsList.forEach(function (friend) {
        if(post.taggedFriends.indexOf(friend) == -1) {
          return post.taggedFriends.push(friend);
        }
        return null;
      });
      post.save(function (err, dpost) {
        if(err) {
          console.error(err);
          throw(err);
        }
        console.log('updated tagged friends list for post', dpost.taggedFriends);
        var taggedFriendsList = dpost.taggedFriends;
        console.log('updated tagged friends list to be returned to frontend', taggedFriendsList);
        return res.status(200).json(taggedFriendsList);
      });
    });
  });
//------------------------GET friend post route---------------------------------
router.get('/posts', function (req, res) {
  console.log('post query for friend with postID', req.query.postID);
  PostsModel.findOne({postID: req.query.postID}, function (err, post) {
    if(err) {
      console.error(err);
      throw(err);
    }
    console.log('suddessfully retrieved the requested post', post.postID);
    var data = {
      owner: post.owner,
      title: post.content.title,
      text: post.content.text || null,
      img: post.content.img || null,
      postID: post.postID,
      likes: post.likes
    };
    console.log('data sent to frontend is',data);
    return res.status(200).json(data);
  });
});
//---------------------------Friend comment routes-----------------------------
router.get('/:postID/comments', function (req, res) {
  console.log('get friend comments', req.query);
  var
    postID = req.params.postID,
    commentID = req.query.commentID;
  controlFlow.parallel([
    function (cb) {
      PostsModel.findOne({postID: postID}, function (err, post) {
        if(err) {
          console.error(err);
          return cb(err);
        }
        var data = {
          owner: post.owner,
          title: post.content.title,
          text: post.content.text || null,
          img: post.content.img || null,
          postID: post.postID,
          likes: post.likes
        };
        return cb(null, data);
      });
    },
    function (cb) {
      CommentsModel.findOne({commentID: commentID}, function (err, comment) {
        if(err) {
          console.error(err);
          return cb(err);
        }
        var data = {
          author: comment.author,
          text: comment.content || null,
          commentID: comment.commentID,
          likes: comment.likes
        };
        return cb(null, data);
      });
  }], function (err, results) {
    if(results) {
      console.log('got post and comments as requested', results);
      var
        post = results[0],
        comments = results[1];
      return res.status(200).json({
        post: post,
        comments: comments
      });
    }
    return res.status(500).render('pages/errors');
  });//end control flow parallel
});
//---------------------------friend commenting on our post---------------------
router.post('/posts/:postID/friends/comments', function (req, res) {
  console.log('received friend comment for post with id', req.params.postID);
  console.log(req.body);
  var
    newComment,
    commentID,
    newCommentID,
    postOwner;
  controlFlow.series([
    function (cb) {
      //crate a new comment document
      newComment = new CommentsModel();
      newComment.forPost.title = req.body.data.postTitle;
      newComment.forPost.owner = req.body.data.postOwner;
      newComment.forPost.postID = req.body.data.postID;
      newComment.commentID = generateRandomPageID();
      newComment.author = req.body.data.author;
      newComment.content = req.body.data.comment;
      newComment.save(function (err, comment) {
        if(err) {
          console.error(err);
          return cb(err);
        }
        console.log('new comment successfully saved', comment);
        commentID = comment._id;
        newCommentID = comment.commentID;
        console.log('new comments data successfully created', comment);
        return cb(null, comment);
      });
    },
    function (cb) {
      //update the postOwner comments status
      UserModel.findOne({email: req.body.data.postOwner}, function (err, user) {
        if(err) {
          console.error(err);
          return cb(err);
        }
        postOwner = user.email;
        user.hasComments = user.hasComments || true;
        user.save(function (err, duser) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          var postOwnerSocket = userSockets[duser._id];
          return cb(null, postOwnerSocket);
        })
      })
    },
    function (cb) {
      //update the post with comments data
      PostsModel.findOne({postID: req.body.data.postID}, function (err, post) {
          console.log('returned post obj', post);
        if(err) {
          console.error(err);
          return cb(err);
        }
        //console.log('initial comments for post', post.comments);
        post.comments.unshift(commentID);
        post.save(function (err, dpost) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('updated comments for post', dpost);
          return cb(null, dpost);
        });
      });
  },
  function (cb) {
    //get all the friends posts and update the friend
    PostsModel.find({owner: postOwner}).sort('-modifiedOn').
      exec(function (err, posts) {
        if(err) {
          console.log('couldnt find owner of post commented on');
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
            postsComments: [],
            taggedFriends: post.taggedFriends || []
          });
        });
        console.log('available posts for post owner from comment on friend post', data);
        return cb(null, data);
      });//end of exec
  }], function (err, results) {
    if(results) {
      console.log('user post has been updated with comments data by friend', results);
      var
        postOwnerSocket = results[1],
        postOwnerPostsArr = results[3];
      //socket.emit('getUserPostsCommentsInfo', self.userPageInfo.userPosts);
      postOwnerSocket.emit('userPostsInfo', postOwnerPostsArr);
      return res.status(200).json(newCommentID);
    }
    return res.status(500).render('pages/errors');
  });//end controlflow series
});
//---------------------------friend likes our post-----------------------------
router.get('/posts/:postID/friends/likes', function (req, res) {
  //NB because likes count isnt crucial, we dont need to update it in real time,
  //any subsequent dBase access for the post will have the new like count
  console.log('add 1 like to post with id', req.params.postID);
  PostsModel.findOne({postID: req.params.postID}, function (err, post) {
    if(err) {
      console.error(err);
      throw(err)
    }
    console.log('initial post likes count', post.likes);
    post.likes += 1;
    post.save(function (err, dpost) {
      if(err) {
        console.error(err);
        throw(err);
      }
      console.log('updated psoste like count', dpost.likes);
      return res.status(200).json('OK!');
    });
  });
});
//---------------------------friend share our post-----------------------------
router.post('/posts/:postID/friends/share', function (req, res) {
  console.log('post to be share has ID', req.params.postID);
  var
    postOwner = req.body.data,
    postToShare,
    postID,
    dPostID = req.params.postID;
  controlFlow.series([
    function (cb) {
      PostsModel.findOne({postID: dPostID}, function (err, post) {
        if(err) {
          console.error(err);
          return cb(err);
        }
        console.log('retrieved post for shareing operation', post);
        postToShare = post;
        console.log('assigned post to share', postToShare);
        return cb(null, postToShare);
      });
  }, function (cb) {
    console.log('creating the shared post');
    var newPost = new PostsModel();
    newPost.forPage = req.user.pageID;
    newPost.owner = req.user.email;
    newPost.content.title = postToShare.content.title;
    newPost.content.text = postToShare.content.text;
    newPost.content.img = postToShare.content.img;
    newPost.postID = generateRandomPageID();
    newPost.via = postOwner;
    newPost.save(function (err, dpost) {
      if(err) {
        console.log('error creating new post to share');
        console.error(err);
        return cb(err);
      }
      console.log('the newly created shared post', dpost);
      postID = dpost._id;
      console.log('retrieved post _id for shared post', postID);
      return cb(null, dpost);
    });
  },
   function (cb) {
    PageModel.findOne({owner: req.user._id}, function (err, page) {
      if(err) {
        console.error(err);
        return cb(err);
      }
      console.log('initial posts for page', page.posts);
      page.posts.unshift(postID);
      page.save(function (err, dpage) {
        if(err) {
          console.error(err);
          return cb(err);
        }
        console.log('confirm new post _id added to page', dpage.posts[0]);
        return cb(null, page);
      });
    });
  }], function (err, results) {
    if(results) {
      console.log('user page has been updated with shared posts data', results);
      return res.status(200).json(postID);
    }
    return res.status(500).render('pages/errors');
  });
});
//---------------------------We want to view friend's Hub----------------------
router.get('/hub', function (req, res) {
  console.log('received request to view the hub of', req.query.email);
  var
    friendEmail = req.query.email,
    friendID,
    friendStatus,
    friendPageInfo = {},
    friendPostsArray = [],
    friendPosts_idArray = [],
    friendPostsIDArray = [],
    commentsArray = [];
  controlFlow.series([
    function (cb) {
      //1st use email to get friend's _id
      UserModel.findOne({email: friendEmail}, function (err, friend) {
        if(err) {
          console.error(err);
          return cb(err);
        }
        console.log('successfully located the friend by email');
        friendID = friend._id;
        friendStatus = friend.status;
        console.log('successfully extracted the friend\'s _id', friendID);
        console.log('suddeccfully retrievd the friend\'s status', friendStatus);
        return cb(null, {
          fullName: friend.firstName +' '+ friend.lastName,
          email: friend.email,
          status: friendStatus
         });
      });
    },
    function (cb) {
      //next use _id to get friend's page info
      PageModel.findOne({owner: friendID}, function (err, page) {
        if(err) {
          console.error(err);
          return cb(err);
        }
        console.log('successfully accessed the friend\'s page info');
        friendPageInfo.title = page.title;
        friendPageInfo.description = page.description;
        friendPageInfo.postsArray = page.posts;
        friendPosts_idArray = page.posts;
        console.log('successfully extracted friend hub metadata', friendPageInfo);
        console.log('friend posts _id array', friendPosts_idArray);
        return cb(null, friendPageInfo);
      });
    },
    function (cb) {
      console.log('starting search for posts for friends page');
      //next use friendPostsIDArray to retreuve all posts on friend's hub
        controlFlow.each(friendPosts_idArray,
          function (_id, cb) {
            PostsModel.findOne({_id: _id}, function (err, post) {
              if(err) {
                console.error(err);
                return cb(err);
              }
              if(!post) {
                console.log('friend has no post to show');
                return cb(null);
              }
              console.log('suceesfully retrieveing data for one post with _id', _id);
              var data = {
                owner: post.owner,
                title: post.content.title,
                text: post.content.text,
                img: post.content.img,
                postID: post.postID,
                likes: post.likes,
                via: post.via,
                postsComments: [],
                taggedFriends: post.taggedFriends || []
              };
              console.log('processed post is',data);
              friendPostsArray.push(data);
              friendPostsIDArray.push(post.postID);
              console.log('sucessfully added post to array', friendPostsArray);
              console.log('successfully extracted the postID and added to array', friendPostsIDArray);
              return cb(null);
            })
          },
          function (err) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('all posts on friends hub successfully retrieved');
          return cb(null, friendPostsArray);
        });
    },
    function (cb) {
      //next use the postsID array to retrieve all the comments for a particular post
      console.log('starting search for commnets for friends posts');
        controlFlow.each(friendPostsIDArray, function (postID, cb) {
          CommentsModel.find({'forPost.postID': postID}).sort('-createdOn').
          exec(function (err, comments) {
            if(err) {
              console.error(err);
              return cb(err);
            }
            if(comments.length < 1) {
                console.log('null post comments for the post with ID', postID);
                return cb(null);
              }
              console.log('post comments for post', comments);
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
              return cb(null);
            });
        }, function (err) {
          if(err) {
            console.error(err);
            return cb(err);
          }
          console.log('successfully retrieved all the posts comments for friend\'s posts');
          return cb(null, commentsArray);
        });
    }], function (err, results) {
      console.log('begin processing of results');
      if(results) {
        console.log('resuklts of retreiving the friends page', results);
        var
          friendFullName = results[0].fullName,
          friendEmail = results[0].email,
          friendStatus = results[0].status,
          friendPosts = results[2] || null,
          friendPostsComments = results[3][0] || null,
          data = {
            friendFullName: friendFullName,
            friendEmail: friendEmail,
            friendStatus: friendStatus,
            friendPosts: friendPosts,
            friendPostsComments: friendPostsComments
          };
        return res.status(200).json(data);
      }
      return res.status(500).render('pages/errors');
    });
});
//---------------------------like friend comment-------------------------------
router.get('/comments/likes', function (req, res) {
  console.log('received request to increase like count for comment with ID ', req.query.commentID);
  CommentsModel.findOne({commentID: req.query.commentID}, function (err, comment) {
    if(err) {
      console.error(err);
      throw(err);
    }
    console.log('initial val of likes', comment.likes);
    comment.likes += 1;
    comment.save(function (err, dcomment) {
      if(err) {
        console.error(err);
        throw(err);
      }
      console.log('updated likes count', comment.likes);
      return res.status(200).json('OK!');
    });
  });
});
//=============================================================================
/**
*Export Module
*/
//---------------------------------------------------------------------------
module.exports = router;
//=============================================================================
