'use strict';
/**
*Module dependencies
*/
//-----------------------------------------------------------------------------
var
  path = require('path'),
  config = require('./config/config'),
  express = require('express'),
  logger = require('morgan'),
  bParser = require('body-parser'),
  session = require('express-session'),
  io = require('./socket/socket'),
  ejsLayout = require('express-ejs-layouts'),
  mongoose = require('mongoose'),
  mongoStore = require('connect-mongo')(session);
//=============================================================================
/**
*Create express app instance
*/
//-----------------------------------------------------------------------------
var app = express();
//=============================================================================
/**
*Module variables
*/
//-----------------------------------------------------------------------------
var
  port = process.env.PORT || 3030,
  env = config.env,
  host = config.host,
  dBURL = config.dBURL,
  sessionSecret = config.sessionSecret,
  sessionStore,
  db,
  baseRoutes = require('./routes/baseroutes');
app.locals.errMsg = app.locals.errMsg || null;
//=============================================================================
/**
*App config and settings
*/
require('clarify');
app.disable('x-powered-by');
app.set('port', port);
app.set('env', env);
app.set('host', host);
app.set('views', path.join(__dirname, '/views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('layout', 'layout');
//=============================================================================
/**
*dBase connection
*/
//-----------------------------------------------------------------------------
mongoose.connect(dBURL);
db = mongoose.connection;
db.on('error', function (err) {
  console.error('There was a db connection error');
  return  console.error(err.message);
});
db.once('connected', function () {
  return console.log('Successfully connected to ' + dBURL);
});
db.once('disconnected', function () {
  return console.error('Successfully disconnected from ' + dBURL);
});
process.on('SIGINT', function () {
  mongoose.connection.close(function () {
    console.error('dBase connection closed due to app termination');
    return process.exit(0);
  });
});
sessionStore = new mongoStore({
  mongooseConnection: mongoose.connection,
  touchAfter: 24 * 3600});
//=============================================================================
/**
*Middleware stack
*/
//-----------------------------------------------------------------------------
app.use(logger('dev'));
app.use(bParser.json());
app.use(bParser.urlencoded({extended: true}));
/*Extracting the session midddleware into a variable allows us to pass it to
'io', this then allows socket.io access to the 'id' of the user for that
session and consequently, 'io' can access that user by querying the
dBase*/
var sessionMware =  session({
    name: 'socialify.sess', store: sessionStore, secret: sessionSecret, resave: false,
    saveUninitialized: true, cookie: {maxAge: 1000 * 60 * 15}});
/*The following idiom directs 'io' to use the same session midddleware
as the base express app immediatly after a client has connected. We can do this
here because the 'io' object is exposed via the 'singleton' pattern
and is thus the same thoughout the app!*/
app.use(sessionMware);
io.use(function (socket, next) {
  sessionMware(socket.request, socket.request.res, next);
});

app.use(ejsLayout);
app.use(express.static(path.join(__dirname, 'public')));
//=============================================================================
/**
*Routes
*/
//-----------------------------------------------------------------------------
app.get('/test', function (req, res) {
  return res.status(200).json('All\'s well!!');
});
app.use('/', baseRoutes);
//=============================================================================
/**
*Custom Error handler
*/
//-----------------------------------------------------------------------------
app.use(function (err, req, res, next) {
  console.error(err.stack);
  return res.status(500).render('pages/errors');
});
//==============================================================================
/**
*Export Module
*/
//-----------------------------------------------------------------------------
module.exports = app;
//==============================================================================
