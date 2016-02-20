'use strict';
/**
*Module dependencies
*/
//-----------------------------------------------------------------------------
var
  Vue = require('vue'),
  VueRouter = require('vue-router')
  $ = require('jquery');
//=============================================================================
/**
*Module variables
*/
//-----------------------------------------------------------------------------
var
  socket = io(),
  appStateGlobal = {
    profileInfo: {
      fname: window.userdata.fname,
      lname: window.userdata.lname,
      email: window.userdata.email,
      photo: window.userdata.photo,
      status: window.userdata.status,
      hasFriends: window.userdata.hasFriends,
      hasPage: window.userdata.hasPage
    }
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
  /*,
  uploadConfigObj = {
    url: '',
    payload: '',
    elem: '',
    success: function (res) {
      this.elem.fadeOut(200);
      console.log('response from photo upload', res);
      self.showInput = false;
      self.$dispatch('profileCreated');
      socket.emit('userPhotoUploaded');
      return self.$route.router.go({name: 'profile'});
    },
    progress: function (e) {
      if(e.lengthComputable) {
        var pcent = Math.round((e.loaded * 100) / e.total);
        this.elem.css('width', (pcent + '%'));
      }
    },
    error: function (xhr) {
      self.showInput = false;
      return console.log('info obj', xhr);
    }
  };
function uploadUtility(config) {
  config.elem.fadeIn(100);
  return ajax(config);
}

function ajax(config) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', config.url, true);
  xhr.upload.addEventListener('progress', function (e) {
    config.progress(e);
  });
  xhr.addEventListener('load', function () {
    config.success(xhr);
  });
  xhr.addEventListener('error', config.error);
  xhr.send(config.payload);
}*/
//=============================================================================
/**
*Module config
*/
//-----------------------------------------------------------------------------
//Vue resource setup
Vue.use(require('vue-resource'));
Vue.http.options.root = '/root';
Vue.http.headers.common['Authorization'] = 'Basic YXBpOnBhc3N3b3Jk';
//Vue router setup
Vue.use(VueRouter);
//initial socket connection
socket.on('connect', function () {
  console.log('Connected to Socialify server!!');
  if(appStateGlobal.profileInfo.hasPage) {
    return socket.emit('getUserPageInfo');
  }
  return null;
});
//on disconnect
socket.on('disconnect', function () {
  return console.log('Disconnected from Socialify server!!');
});
//=============================================================================
/**
*Define base app
*/
//-----------------------------------------------------------------------------
var App = Vue.extend({
  template: require('./baseAppTemplate.html'),
  data: function () {
    return {
      userMetaData: {
        profileInfo: {
          fname: appStateGlobal.profileInfo.fname,
          lname: appStateGlobal.profileInfo.lname,
          email: appStateGlobal.profileInfo.email,
          photo: appStateGlobal.profileInfo.photo,
          status: appStateGlobal.profileInfo.status,
          hasFriends: appStateGlobal.profileInfo.hasFriends,
          hasPage: appStateGlobal.profileInfo.hasPage,
          friendsList: []
        }
      }
    };
  },
  computed: {

  },
  methods: {

  },
  events : {
    'newPageCreated': function () {
      console.log('new page created event received by base app');
      this.hasPage = true;
      return console.log('updated value for has page from base app', this.hasPage);
    }
  },
  components: {
    'app-nav': require('./components/app_nav'),
    'app-contact-list': require('./components/app_contact_list'),
    'app-chat': require('./components/app_chat')($, socket)
  },
  ready: function () {
    var self = this;
    //check if logged in user already has a 'page'
    if(!appStateGlobal.profileInfo.hasPage) {
        //if not - set page to '/profile'
        this.$route.router.go({name: 'profile'});
      }
      //else - set page to '/hub'
    else {
        //console.log('user email to be sent to backend 4 page info req', self.userMetaData.profileInfo.email);
        socket.emit('getUserPageInfo');
        console.log('requesting for user proflie info');
        socket.emit('getUserProfileInfo');
        this.$route.router.go({name: 'hub'});
      }
      //after user creates new page and uploads profile pix
      socket.on('updatedUserInfo', function (data) {
        this.userMetaData.profileInfo.fname = data.firstName;
        this.userMetaData.profileInfo.lname = data.lastName;
        this.userMetaData.profileInfo.email = data.email;
        this.userMetaData.profileInfo.photo = data.profilePhoto;
        this.userMetaData.profileInfo.status = data.status;
        this.userMetaData.profileInfo.hasFriends = data.hasFriends;
        this.userMetaData.profileInfo.hasPage = data.hasPage;
        this.userMetaData.profileInfo.friendsList = data.friendsList;
        console.log('updated user info', data);
        return this.$route.router.go({name: 'hub'});
      }.bind(this));
      //after any user profile data update
      socket.on('updatedUserProfile', function () {
        return socket.emit('getUserProfileInfo');;
      });
      //when user profile is requested
      socket.on('userProfileInfo', function (data) {
        console.log('got user profile info');
        console.log('the user profile', data);
        this.userMetaData.profileInfo.fname = data.firstName;
        this.userMetaData.profileInfo.lname = data.lastName;
        this.userMetaData.profileInfo.email = data.email;
        this.userMetaData.profileInfo.photo = data.profilePhoto;
        this.userMetaData.profileInfo.status = data.status;
        this.userMetaData.profileInfo.hasFriends = data.hasFriends;
        this.userMetaData.profileInfo.hasPage = data.hasPage;
        this.userMetaData.profileInfo.friendsList = data.friendsList;
        return null;
      }.bind(this));
    }
});
//=============================================================================
/**
*Define components
*/
//-----------------------------------------------------------------------------
var
  Hub = require('./components/app_hub')($, socket, generateRandomFileName),
  Profile = require('./components/app_profile'),
  Cr8Hub = require('./components/app_newhub')($, socket),
  UploadPix = require('./components/app_profilepix')($, socket);
//=============================================================================
/**
*Create new Router instance
*/
//-----------------------------------------------------------------------------
var router = new VueRouter();
//=============================================================================
/**
*Create Routes
*/
//-----------------------------------------------------------------------------
router.map({
  '/hub': {
    name: 'hub',
    component: Hub
  },
  '/profile': {
    name: 'profile',
    component: Profile,
    subRoutes: {
      '/cr8Hub': {
        name: 'cr8Hub',
        component: Cr8Hub
      },
      '/uploadPix': {
        name: 'uploadPix',
        component: UploadPix
      }
    }
  }
});
//=============================================================================
/**
*Bind baseApp to shell template
*/
//-----------------------------------------------------------------------------
router.start(App, '#app');
//=============================================================================
