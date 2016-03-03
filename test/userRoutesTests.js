'use strict';
/**
*Module Dependencies
*/
var
  should = require('should'),
  request = require('supertest'),
  faker = require('faker'),
  app = require('../app'),
  Users = require('../models/users'),
  Pages = require('../models/pages'),
  Posts = require('../models/posts'),
  Comments = require('../models/comments');
//==============================================================================
/**
*Setup test env
*/
process.env.NODE_ENV = 'test';
//=============================================================================
/**
*Module variables
*/
var
  user = {
    username: 'test',
    email: 'test@test.com',
    password: 'testpwd123'
  },
  userCookie;
request = request(app);
//==============================================================================
/**
*Tests
*/
//-----------------------------------------------------------------------------
describe('User Routes', function () {
  before(function (done) {
    Users.remove({}, done);
  });
  before(function (done) {
    request.
      post('/signup').
      send({
        fname: 'test',
        lname: 'ter',
        email: 'test@ter.com',
        password: 'qwerty123uiop?@'
      }).
      end(function (err, res){
        if(err) {
          return done(err);
        }
        return done();
      });
  });
  after(function (done) {
    Users.remove({}, done);
  });
  describe('POST "/users/newPage/:email"', function () {//start POST '/users/newPage/:email'
    it('should create a new page for a logged in user', function (done) {
      request.
        post('/users/newPage/testpwd123').
        set('Content-Type', 'application/x-www-form-urlencoded').
        send({
          title: 'test Hub',
          description: 'a test Hub',
          status: 'testing',
          pwdRecoveryEmail: 'recover@pwd.com'
        }).
        expect(302).
        end(function (err, res){
          if(err) {
            return done(err);
          }
          return done();
        });
    });
  });//end POST '/users/newPage/:email'
  //TODO write the rest of the APIs to test
});
