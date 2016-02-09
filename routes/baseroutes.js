'use strict';
/**
*Module Dependencies
*/
//-----------------------------------------------------------------------------
var
  express = require('express'),
  passport = require('../config/passport'),
  UserUtils = require('../models/userutils'),
  PageUtils = require('../models/pageutils'),
  commentsNpostsUtils = require('../models/commentsNpostsutils');
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
  findPageByUser = PageUtils.findPageByUser,
  getAllPostsForUser = commentsNpostsUtils.getAllPostsForUser;
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
  /*var
    user = req.user,
    userdata = {
      fname: user.first_name,
      lname: user.last_name,
      email: user.email,
      photo: user.profilePhoto || null,
      status: user.status || null,
      friends: user.friends || null
    };*/

  //return res.status(200).render('pages/frontend', {userdata: userdata});
  return res.status(200).render('pages/frontend');
});
//---------------------------Logout route--------------------------------------
router.get('/logout', function (req, res) {
  req.logout();
  req.session.destroy();
  return res.redirect('/');
});
//=============================================================================
/**
*Export Module
*/
//---------------------------------------------------------------------------
module.exports = router;
//=============================================================================
