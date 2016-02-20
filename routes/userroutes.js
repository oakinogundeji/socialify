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
  commentsNpostsUtils = require('../models/commentsNpostsutils'),
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
      return res.status(500).render('pages/error');
    });
});
//---------------------------Newuser profile photo creation routes-------------
router.post('/profilepix/:email', isLoggedIn, function (req, res) {
  /*console.log('the connected user ID from profile photo', ID);
  console.log('the connected user socket from profile photo', socket);*/
  //return res.status(200).json('OK!');
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
                  throw(err);
                }
                user.profilePhoto = S3PhotoPrefix + fileName;
                user.save(function (err) {
                  if(err) {
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
                      throw(err)
                    }
                    return console.log('local copy of ' + newFile +' has been deleted')
                  }); //end of fs.unlink()
                });//end of user.save()
              });//end of UserModel.findOne()
            }//end of 'if(S3res.statusCode == 200)'
//............................................................................//
          });//end of 'S3Req.on('response')'
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
    postID;
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
          cb(err);
        }
        req.user.hasPosts = req.user.hasPosts || true;
        postID = post._id;
        console.log('new post data successfully created', post);
        return cb(null, post);
      });
    },
    function (cb) {
      PageModel.findOne({owner: req.user._id}, function (err, page) {
        if(err) {
          return cb(err);
        }
        console.log('initial posts for page', page.posts);
        page.posts.push(postID);
        page.save(function (err, page) {
          if(err) {
            return cb(err);
          }
          console.log('updated posts for page', page);
          return cb(null, page);
        });
      });
  }], function (err, results) {
    if(results) {
      console.log('user page has been updated with posts data', results);
      return res.status(200).json('OK!');
    }
    return res.status(500).render('pages/error');
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
                    throw(err)
                  }
                  console.log('post with title ' +  postTitle +' and img ' + imgName +' has been saved');
                  //update frontend with new post info
                  PostsModel.find({owner: req.user.email}).sort('-modifiedOn').
                    exec(function (err, posts) {
                      if(err) {
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
          friend.hasFriends = friend.hasFriends || true;
          friend.friends.push(userEmail);
          friend.save(function (err) {
            if(err) {
              console.error(err);
              return cb(err);
            }
            console.log('updated friends friend lsit', friend.friends);
            return cb();
          });
        });
    }], function (err, results) {
      if(results) {
        return res.status(200).json('OK!');
      }
      return res.status(500).render('pages/error');
    });
  }).
  delete(function (req, res) {
    console.log('delete friend request from frontend', req.body);
    var friendEmail = req.body.email;
    UserModel.findOne({_id: req.user._id}, function (err, user) {
      if(err) {
        throw(err);
      }
      console.log('initial friends list', user.friends);
      var indx = user.friends.indexOf(friendEmail);
      user.friends.splice(indx, 1);
      if(user.friends.length < 1) {
        user.hasFriends = false;
      }
      user.save(function () {
        if(err) {
          throw(err);
        }
        var socket = getSocket(req);
        console.log('final friends list', user.friends);
        socket.emit('updatedUserProfile');
        return res.status(200).json('Friend deleted!');
      });
    });
  });
//---------------------------Edit profile info routes--------------------------
router.post('/:email/edit', function (req, res) {
  console.log('user edit data received', req.body);
  UserModel.findOne({_id: req.user._id}, function (err, user) {
    if(err) {
      throw(err);
    }
    console.log('original user data from edit profile', user);
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.save(function (err) {
      if(err) {
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
      throw(err);
    }
    console.log('old pwd', user.password);
    user.password = user.generateHash(req.body.newPwd);
    user.save(function (err) {
      if(err) {
        throw(err);
      }
      console.log('new pwd', user.password);
      return res.status(200).json('OK!');
    });
  });
});
//---------------------------User status change route--------------------------
router.post('/status', function (req, res) {
  console.log('status change frm client', req.body);
  UserModel.findOne({_id: req.user._id}, function (err, user) {
    if(err) {
      throw(err);
    }
    console.log('old status', user.status);
    user.status = req.body.status;
    user.save(function (err) {
      if(err) {
        throw(err);
      }
      console.log('new status', user.status);
      return res.status(200).json('OK!');
    });
  });
});
//---------------------------User comments posting route-----------------------
router.post('/posts/comments', function (req, res) {
  console.log('comments data received from frontend', req.body);
  //return res.status(200).json('OK!');
  var
    newComment,
    commentID;
  controlFlow.series([
    function (cb) {
      newComment = new CommentsModel();
      newComment.forPost.title = req.body.data.postTitle;
      newComment.forPost.owner = req.body.data.postOwner;
      newComment.forPost.postID = req.body.data.postID;
      newComment.commentID = generateRandomPageID();
      newComment.author = req.body.data.author;
      newComment.content = req.body.data.comment;
      newComment.img = req.body.data.img;
      newComment.save(function (err, comment) {
        if(err) {
          cb(err);
        }
        console.log('new comment successfully saved', comment);
        req.user.hasComments = req.user.hasComments || true;
        commentID = comment._id;
        console.log('new comments data successfully created', comment);
        return cb(null, comment);
      });
    },
    function (cb) {
      PostsModel.findOne({postID: req.body.data.postID}, function (err, post) {
          console.log('returned post obj', post);
        if(err) {
          return cb(err);
        }
        //console.log('initial comments for post', post.comments);
        post.comments.unshift(commentID);
        post.save(function (err, dpost) {
          if(err) {
            return cb(err);
          }
          console.log('updated comments for post', dpost);
          return cb(null, dpost);
        });
      });
  }], function (err, results) {
    if(results) {
      console.log('user post has been updated with comments data', results);
      return res.status(200).json('OK!');
    }
    return res.status(500).render('pages/error');
  });
});
//---------------------------posts like routes---------------------------------
router.post('/posts/:postID/likes', function (req, res) {
  var postID = req.params.postID;
  console.log('add 1 like to post with postID', postID);
  PostsModel.findOne({postID: postID}, function (err, post) {
    if(err) {
      throw(err);
    }
    console.log('initial val of likes', post.likes);
    post.likes += 1;
    post.save(function (err, dpost) {
      if(err) {
        throw(err);
      }
      console.log('updated likes count', post.likes);
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
