'use strict';
/**
*Module dependencies
*/
//-----------------------------------------------------------------------------
var
  Vue = require('vue'),
  VueRouter = require('vue-router');
//=============================================================================
/**
*Module variables
*/
//-----------------------------------------------------------------------------
var
  socket = io(),
  appStateGlobal = {
    userdata: {
      profileInfo: {
        fname: null,
        lname: null,
        email: null,
        photo: null,
        status: null,
        friends: null
      },
      pageInfo: {
        page: null,
        posts: null,
        comments: null
      }
    }
  };
//=============================================================================
/**
*Module config
*/
//-----------------------------------------------------------------------------
Vue.use(VueRouter);

socket.on('connect', function () {
  console.log('Connected to Socialify server!!');
  return socket.emit('sendUserProfileData');
});
socket.on('getUserProfileData', function (data) {
  appStateGlobal.userdata.profileInfo.fname = data.fname;
  appStateGlobal.userdata.profileInfo.lname = data.lname;
  appStateGlobal.userdata.profileInfo.status = data.status;
  appStateGlobal.userdata.profileInfo.email = data.email;
  appStateGlobal.userdata.profileInfo.photo = data.photo;
  appStateGlobal.userdata.profileInfo.friends = data.friends;
  return console.log('user profile info', appStateGlobal.userdata.profileInfo);
  //return socket.emit('getUserPageInfo');
});
socket.on('disconnect', function () {
  return console.log('Disconnected from Socialify server!!');
});
socket.on('userSetupData', function (data) {
  return console.log('user setup data',data);
});
//=============================================================================
/**
*Define base app
*/
//-----------------------------------------------------------------------------
var App = require('./baseApp');
//=============================================================================
/**
*Define components
*/
//-----------------------------------------------------------------------------
//=============================================================================
/**
*Create Routes
*/
//-----------------------------------------------------------------------------
//=============================================================================
/**
*Create new Router instance
*/
//-----------------------------------------------------------------------------
var router = new VueRouter();
//=============================================================================
/**
*Bind baseApp to shell template
*/
//-----------------------------------------------------------------------------
router.start(App, '#app');
//=============================================================================
