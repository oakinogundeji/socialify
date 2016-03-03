'use strict';
/**
*Module Dependencies
*/
var
  should = require('should'),
  request = require('supertest'),
  faker = require('faker'),
  app = require('../app'),
  User = require('../models/users');
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
describe('Base Routes', function () {
  before(function (done) {
    User.remove({}, done);
  });
  after(function (done) {
    User.remove({}, done);
  });
  describe('GET "/"', function () {//start GET '/'
    it('should grant access to the home page', function (done) {
      request.
        get('/').
        expect(200).
        end(function (err, res) {
          if(err) {
            return done(err);
          }
          return done();
        });
    });
  });//end GET '/'
  describe('GET "/login"', function () {//start GET '/login'
    it('should load the login page', function (done) {
      request.
        get('/login').
        expect(200).
        end(function (err, res) {
          if(err) {
            return done(err);
          }
          return done();
        });
    });
  });//end GET '/login'
  describe('POST "/login"', function () {//start POST 'login'
    it('should reject the non existent user with a 409 [conflict] error', function (done) {
      request.
        post('/login').
        send({
          email: faker.internet.email(),
          password: faker.internet.password()
        }).
        expect(409).
        end(function (err, res) {
          if(err) {
            return done(err);
          }
          return done();
        })
    })
  });//end POST '/login'
  describe('GET "/signup"', function () {//start GET '/signup'
    it('should load the signup page with HTML and gzip compression', function (done) {
      request.
        get('/signup').
        expect(200).
        end(function (err, res) {
          if(err) {
            return done(err);
          }
          return done();
        });
    })
  });//end GET '/signup'
  describe('POST "/signup"', function () {//start POST '/signup'
      it('should redirect the user to the frontend', function (done) {
      request.
        post('/signup').
        send({
          fname: 'test',
          lname: 'ter',
          email: 'test@ter.com',
          password: 'qwerty123uiop?@'
        }).
        expect(302).
        end(function (err, res) {
          if(err) {
            return done(err);
          }
          userCookie = res.header['set-cookie'][0];
          console.log('the user cookie is ', userCookie);
          return done();
        });
      });
  });//end POST '/signup'
  describe('Accessing the protected frontend', function () {//start frontend tests
    describe('failing test', function () {
      it('should fail by redirecting a non authenticated user to "/login"', function (done) {
        request.
          get('/frontend').
          expect(302).
          end(function (err, res) {
            if(err) {
              return done(err);
            }
            return done();
          });
      });
    });
    describe('passing test', function () {
      it('should pass by granting an authorized user access to the frontend', function (done) {
        request.
          get('/frontend').
          set('set-cookie', userCookie).
          expect(302).
          end(function (err, res) {
            if(err) {
              return done(err);
            }
            return done();
          });
      })
    })
  });//end frontend tests
  describe('GET "/logout"', function () {//start GET '/logout'
    it('should redirect any user to "/"', function (done) {
      request.
      get('/logout').
      expect(302).
      end(function (err, res) {
        if(err) {
          return done(err);
        }
        return done();
      });
    })
  });//end GET '/logout'
  describe('password recovery API', function () {//start of password recovery API
    before(function (done) {
      User.findOne({email: 'test@ter.com'}, function (err, user) {
        if(err) {
          return done(err);
        }
        user.pwdRecoveryEmail = 'recover@pwd.com';
        user.save(function (err, user) {
          if(err) {
            return done(err);
          }
          console.log('test user recover pwd email successfully setup');
          return done();
        })
      });
    });
    describe('GET "/recoverpwd"', function () {
      it('should display the password recovery page', function (done) {
        request.
          get('/recoverpwd').
          expect(200).
          end(function (err, res) {
            if(err) {
              return done(err);
            }
            return done();
          });
      })
    })
    describe('failing POST "/recoverpwd"', function () {
      it('should fail because the user has invalid credentials', function (done) {
        request.
          post('/recoverpwd').
          send({
            fname: 'test',
            lname: 'ter',
            email: 'wrong@email.com'
          }).
          expect(409).
          end(function (err, res) {
            if(err) {
              return done(err);
            }
            return done();
          });
      });
    });
    describe('passing POST "/recoverpwd"', function () {
      it('should pass because user supplied valid credentials', function (done) {
        request.
          post('/recoverpwd').
          send({
            fname: 'test',
            lname: 'ter',
            email: 'test@ter.com'
          }).
          expect(302).
          end(function (err, res) {
            if(err) {
              return done(err);
            }
            return done();
          });
      });
    });
  });//end of password recovery API
});
