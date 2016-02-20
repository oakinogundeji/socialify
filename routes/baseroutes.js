'use strict';
/**
*Module Dependencies
*/
//-----------------------------------------------------------------------------
var
  express = require('express'),
  passport = require('../config/passport'),
  nodemailer = require('nodemailer'),
  sgTransport = require('nodemailer-sendgrid-transport'),
  config = require('../config/config'),
  UserModel = require('../models/users');
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
  sgtOptions = {
    auth: {
        api_user: config.SendGrid.username,
        api_key: config.SendGrid.password
      }
    },
  mailer = nodemailer.createTransport(sgTransport(sgtOptions));
function generateRandomPwd() {
  var
    date = new Date().getTime(),
    xterBank = 'abcdefghijklmnopqrstuvwxyz',
    fstring = '',
    i;
  for(i = 0; i < 15; i++) {
    fstring += xterBank[parseInt(Math.random()*26)];
  }
  return (fstring += date);
}
//=============================================================================
/**
*Middleware
*/
//-----------------------------------------------------------------------------
router.use(passport.initialize());
router.use(passport.session());
//==============================================================================
/**
*Routes
*/
//-----------------------------------------------------------------------------
//---------------------------Login routes--------------------------------------
router.get('/', function (req, res) {
  return res.status(200).render('pages/index', {errMsg: null});
});
router.route('/login').
  get(function (req,res) {
    return res.status(200).render('pages/login');
  }).
  post(function(req, res, next) {
    passport.authenticate('local-login', function(err, user, info) {
      if (err) {
        return next(err); // will generate a 500 error
      }
      if (!user) {
        return res.status(409).render('pages/login', {errMsg: info.errMsg});
      }
      req.login(user, function(err){
        if(err){
          console.error(err);
          return next(err);
        }
        return res.status(302).redirect('/frontend');
      });
    })(req, res, next);
  });
//---------------------------Signup routes-------------------------------------
router.route('/signup').
  get(function (req, res) {
    return res.status(200).render('pages/signup', {errMsg: null});
  }).
  post(function(req, res, next) {
    passport.authenticate('local-signup', function(err, user, info) {
      if (err) {
        return next(err); // will generate a 500 error
      }
      if (!user) {
        return res.status(409).render('pages/signup', {errMsg: info.errMsg});
      }
      req.login(user, function(err){
        if(err){
          console.error(err);
          return next(err);
        }
        return res.status(302).redirect('/frontend');
      });
    })(req, res, next);
  });
//---------------------------Frontend routes-----------------------------------
router.get('/frontend', isLoggedIn, function (req, res) {
  var
    user = req.user,
    userdata = {
      fname: user.firstName,
      lname: user.lastName,
      email: user.email,
      photo: user.profilePhoto,
      status: user.status,
      hasPage: user.hasPage,
      hasFriends: user.hasFriends
    };
  console.log('user data sent to frntend on login', userdata);

  return res.status(200).render('pages/frontend', {userdata: userdata});
});
//---------------------------Logout route--------------------------------------
router.get('/logout', function (req, res) {
  req.logout();
  req.session.destroy();
  return res.redirect('/');
});
//---------------------------reset password route------------------------------
router.route('/recoverpwd').
  get(function (req, res) {
    return res.status(200).render('pages/resetpwd');
  }).
  post(function (req, res) {
    console.log('reset pwd req received from user', req.body);
    UserModel.findOne({firstName: req.body.fname,
    lastName: req.body.lname, email: req.body.email}, function (err, user) {
      if(err) {
        throw(err);
      }
      if(!user) {
        var errMsg = 'Invalid credentials, please confirm your data!';
        return res.status(409).render('pages/resetpwd', {errMsg: errMsg})
      }
      var
        pwdRecoveryEmail = user.pwdRecoveryEmail,
        newPwd = generateRandomPwd(),
        email = {
          to: pwdRecoveryEmail,
          from: 'support@socialify.net',
          subject: 'Password Recovery',
          text: 'Your new password is ' + newPwd +' we suggest you change it on next login'
        };
        mailer.sendMail(email, function(err, res) {
          if(err) {
              console.log(err)
          }
          console.log(res);
        });
        console.log('old user pwd from pwd reset', user.password);
        user.password = user.generateHash(newPwd);
        user.save(function (err, user) {
          if(err) {
            throw(err);
          }
          console.log('new user pwd from pwd reset', user.password);
          return res.status(302).redirect('/login');
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
