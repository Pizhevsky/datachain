"use strict";

var bCrypt = require('bcrypt-nodejs');
var UserModel = require('../models/userModel');

var isValidPassword = function(userpass, password) {
	return bCrypt.compareSync(password, userpass);
};

module.exports = function(passport) {
	var LocalStrategy = require('passport-local').Strategy;
	var strategyOptions = {
		usernameField : 'email',
		passwordField : 'password',
		passReqToCallback : true
	};

	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		UserModel.findByUserId(id)
			.then(user => {
				if (user) {
					done(null, user.get());
				} else {
					done(user.errors,null);
				}
			});
	});

	passport.use('local-signup', new LocalStrategy(strategyOptions,
		function(req, email, password, done) {
			email = email.toLowerCase();
			UserModel.findByUserEmail(email)
				.then(user => {
					if (user) {
						return done(null, false, {message : 'That email is already taken'} );
					}
				
					return done(null, email, password);
				});
		}
	));

	passport.use('local-signin', new LocalStrategy(strategyOptions,
		function(req, email, password, done) {
			email = email.toLowerCase();
			UserModel.findByUserEmail(email)
				.then(user => {
					if (!user) {
						return done(null, false, { message: 'Email does not exist' });
					}
					if (!isValidPassword(user.password, password)) {
						return done(null, false, { userId: user.id, currentAttempt: user.loginAttempts + 1 });
					} else {
						UserModel.updateAttempts({
								userId: user.id,
								num: 0
							})
							.then(() => {
								return done(null, user);
							});
					}
				})
				.catch(err => {
					console.log('Error:', err);

					return done(null, false, { message: 'Something went wrong with your Signin' });
				});
		}
	));
}

