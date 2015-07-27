var express = require('express');
var http = require('http');
var port = process.env.PORT || 8001;
var mongoose = require('mongoose');

var configDB = require('./config/database.js');

// Web server
var app = express();

mongoose.connect(configDB.mongodb.url);

app.configure(function() {

  // set up our express application
  app.use(express.logger('dev')); // log every request to the console
  app.use(express.cookieParser()); // read cookies (needed for auth)
  app.use(express.bodyParser()); // get information from html forms
  app.use(express.static('public'));
  app.set('view engine', 'ejs'); // set up ejs for templating

});

require('./routes')(app);

app.listen(port);
console.log('Scraper Web server listens on port ' + port);
