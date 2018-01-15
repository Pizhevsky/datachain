"use strict";

const fs = require("fs");
const http = require('http');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');

const app = express();

app.use('/', express.static('./app/public/'));
app.use('/upload', express.static('./upload'));
app.use('/clock', express.static('./app/public/src/jQClock/index.html'));

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(session({ secret: 'e5oxbn6GA7a1k0sf', resave: true, saveUninitialized:true}));
app.use(passport.initialize());
app.use(passport.session());


var allowCrossDomain = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type');

	next();
}
app.use(allowCrossDomain);

require('./app/routes')(app, passport);
require('./app/services/passportStrategy')(passport);

http.createServer(app).listen(5000, function(err){
	if(!err) {
		console.log("Site is live");
	} else {
		console.log(err);
	}
});
