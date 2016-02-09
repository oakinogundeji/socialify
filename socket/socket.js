'use strict';
/**
*Module Dependencies
*/
//-----------------------------------------------------------------------------
var
  UserModel = require('../models/users'),
  PagesModel = require('../models/pages'),
  io = require('socket.io')();
//=============================================================================
/**
*Middleware
*/
//-----------------------------------------------------------------------------
/*io.use(function (socket, next) {
  //sessionMware(socket.request, socket.request.res, next);
  var sess = sessionStore.get(req.sessionID, function (err, session) {
    if(err) {
      throw(err);
    }
    return session;
  });
});*/
//=============================================================================
/**
*Config socket connection
*/
//-----------------------------------------------------------------------------
io.on('connection', function (socket) {
  console.log('A client has connected');
  //send user setup data to connected client
  socket.on('sendUserProfileData', function () {
    UserModel.findOne({_id: socket.request.session.passport.user}, function (err, user) {
      if(err) {
        console.error(err);
      }
      console.log('actual user object from IO', user);
      PagesModel.findOne({owner: socket.request.session.passport.user}, function (err, page) {
        if(err) {
          console.error(err);
        }
        if(page == null) {
          var userdata = {
            fname: user.first_name,
            lname: user.last_name,
            email: user.email,
            friends: user.friends,
            status: user.status,
            photo: user.profile_photo
          };
          return socket.emit('getUserProfileData', userdata);
        }
        return console.log('a page exist for the user');
      })
    })
  })
  socket.on('disconnect', function () {
    return console.log('The client has disconnected');
  });
});
//=============================================================================
/**
*Export module
*/
//-----------------------------------------------------------------------------
module.exports = io;
//=============================================================================
