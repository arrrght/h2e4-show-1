var express = require('express'),
	  dbName = 'tst01';

// Global vars
Mongoose = require('mongoose');
Mongoose.connect('mongodb://localhost/' + dbName);

var app = module.exports = express.createServer(),
    mongoStore = require('connect-mongodb');


// Configuration
app.configure(function(){
	app.use(express.logger({ format: '\x1b[32m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }))
	app.set('views', __dirname + '/app');
	app.set('view engine', 'ejs');

	app.register('.js', require('ejs'));
	app.register('.html', require('ejs'));

	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.session({ secret: 'your secret here', store: new mongoStore({ dbname: dbName }) }));
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
	app.set('view options', { layout: false });
});

// Use h2e4
require(__dirname + '/lib/h2e4.js').init(app);

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes
function restrictUnauthorized(req, res, next){
	console.log('* User: ' + req.session.user);
	req.session.user_id ? next() : res.redirect('/login');
};

app.get('/login', function(req, res){
	res.render('Login.html');
});

app.get('/logout', function(req, res){
	delete req.session.user_id;
	res.redirect('/');
});

app.get('/', restrictUnauthorized, function(req, res){
  res.render('Application.html');
});

// Only listen on $ node app.js
if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
