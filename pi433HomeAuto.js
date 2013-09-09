/**
 * Main nodeJS requirements
 */
var settings = require('./settings.js'),	// Change this to setup app
  cronSchedule = require('./cron.js'),
  utils = require('./utils.js'),
  flash = require('connect-flash'),
  express = require('express'),
  passport = require('passport'),
  util = require('util'),
  GoogleStrategy = require('passport-google').Strategy,
  childProcess = require('child_process');

/**
 * Main automation handler 'class' for main automation bits and pieces and not the express/node
 * stuff.
 */
pi433HomeAuto = function() {
	this.switches;
	this.cron;
};

/**
 * Log a message
 * 
 * @param message
 */
pi433HomeAuto.prototype.log = function(message) {
	console.log('pi433HomeAuto-' + utils.toLogDateFormat(new Date()) + ': ' + message);	
};

/**
 * Start the child process for handling switching.
 */
pi433HomeAuto.prototype.startSwitches = function() {
	var self = this;
	this.switches = childProcess.fork(__dirname + '/switches.js');
	this.switches.on('message', function(message) {
		self.log('From switches: ' + message.body);
	});
};

/**
 * Start up the cron job scheduler and pass it a reference to the switches child object
 * @param switches
 */
pi433HomeAuto.prototype.startCron = function() {
	if (!this.switches) {
		this.startSwitches();
	}
	this.cron = new CronSchedule(this.switches);
};

/**
 * Set a switch state
 * 
 * @param user
 * @param groupId
 * @param switchId
 * @param state
 */
pi433HomeAuto.prototype.setSwitch = function(user, groupId, switchId, state) {
	this.switches.send({
		body: user + ' sets ' + groupId + ',' + switchId + ' to state ' + state, 
		g:groupId, 
		s:switchId, 
		st:state,
		user:user
	});
};

// Initialise a new instance of pi433HomeAuto and child switch controller
var homeAuto = new pi433HomeAuto();
homeAuto.startSwitches();
homeAuto.startCron();
homeAuto.log('Started up.');

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new GoogleStrategy({
    returnURL: settings.host + ':' + settings.authPort + '/' + 'auth/google/return',
    realm: settings.host + ':' + settings.authPort
  },
  function(identifier, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
	  
	  var found = false;
	  found = (settings.users.indexOf(profile.emails[0].value) > -1);
	  
	  if (found) {
		  profile.identifier = identifier;
		  homeAuto.log("Login for user " + profile.emails[0].value);
		  return done(null, profile);
	  } else {
		return done(null,false,{ message: 'Not authorised' });
	  }

    });
  }
));

var app = express();

// configure Express
app.configure(function() {

  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'sdfsd76saekljasdf5JKGyu5Ulfaasdhg2a' }));
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use('/static', express.static(__dirname + '/static'));
  app.disable('x-powered-by');
});

app.get('/', ensureAuthenticated, function(req, res){
  res.render('index', { user: req.user, switches: settings.switches });
});

app.get('/auth/google', passport.authenticate('google'));

app.get('/auth/google/return', passport.authenticate(
	'google', { successRedirect: '/', failureRedirect: '/login', failureFlash: true}));

app.get('/login', function(req, res){
  res.render('login', { user: req.user, message: req.flash('error') });
});

app.post('/switch', ensureAuthenticated,
  function(req, res) {
	var group = req.body.g;
	var swtch = req.body.s;
	var state = req.body.st;
	var user = req.user.emails[0].value;
	
	// paranoid final user check
	if (settings.users.indexOf(req.user.emails[0].value) > -1) {
		homeAuto.setSwitch(user, group, swtch, state);
	} 
	res.end("Ok");
	
  }
);

app.get('/logout', function(req, res){
  var user = "unknown";
  if (req.user && req.user.emails && req.user.emails.length == 1) {
	  user = req.user.emails[0].value;
  }
  homeAuto.log("Logout for user " + user);
  req.logout();
  res.redirect('/');
});

homeAuto.log('Starting up server listening on port ' + settings.port);
app.listen(settings.port);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}