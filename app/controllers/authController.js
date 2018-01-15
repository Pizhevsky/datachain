"use strict";

var path = require('path');
var crypto = require('crypto');
var bCrypt = require('bcrypt-nodejs');
var Sniffr = require("sniffr");
var Recaptcha = require('express-recaptcha');

var UserModel = require('../models/userModel');
var UserReferalsModel = require('../models/userReferalsModel');
var UserInfoModel = require('../models/userInfoModel');
var LoginHistoryModel = require('../models/loginHistoryModel');
var UserActivationModel = require('../models/userActivationModel');
var UserBalanceModel = require('../models/userBalanceModel');
var UserArbitrageModel = require('../models/userArbitrageModel');
var BalanceController = require('./balanceController');
var emailSender = require('../services/emailSender');
var logger = require('../services/loggerService');

const MAX_LOGIN_ATTEMPT_NUMBER = 3;
const BLOCK_TIME = 2*60*60*1000;

var recaptcha = new Recaptcha('6LckSTcUAAAAAPOenKsHd-GtMvhrY7OJ9kQlf6XV', '6LckSTcUAAAAAFgReCGrcFEq8Cx55JVI1uG9y6yf');

var generateToken = function () {
	return crypto.randomBytes(64).toString('hex');
};
var generateReferal = function () {
	return crypto.randomBytes(32).toString('hex');
};

var generateHash = function(password) {
	return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
};

var isValidPassword = function(userpass, password) {
	return bCrypt.compareSync(password, userpass);
};

var detectDevice = function(userAgent) {
	let s = new Sniffr();
	s.sniff(userAgent);
	let vendors = ['os', 'browser', 'device'];
	let device = vendors.map(item => (s[item].name != 'Unknown') ? `${s[item].name} v${s[item].versionString}` : '').filter(value => value != '').join(', ');

	return device;
};

var loginLog = function(data, success) {
	data.failed = !success;
	data.date = new Date();

	if (success) {
		LoginHistoryModel.findLastByEmail(data.email)
			.then(result => {
				if (!result) {
					return LoginHistoryModel.createNew(data);
				} else {
					UserModel.findByUserEmail(data.email)
						.then(user => {
							if (user && result.loginIp != data.loginIp) {
								let supportMail = 'support@arbidex-promo.com'; // 'support@datachain.awsapps.com'
								emailSender.send(data.email, {
									subj: `New login from ${data.loginIp}`,
									html: `Hello,<br>We detected a new entry device: ${data.device}.<br>If you did not perform this login send an email immediately to 
									<a target="_blank" href="mailto:${supportMail}" style="word-wrap:break-word;color:#4995c4;font-weight:normal;text-decoration:none;">
										${supportMail}
									</a> to freeze your account.`,
									success: () => {},
									fail: error => {}
								});
							}
						});
				}
			});
	}
};

var sendActivation = function() {
	let successCount = 0,
		failedCount = 0,
		failedEmails = [];

	let send = function (email, token) {
		emailSender.sendEmailActivate({
			email,
			token,
			success: () => {
				successCount++;
				console.log(successCount, email, 'Activation send success');
			},
			fail: error => {
				failedCount++;
				failedEmails.push(email)
				console.log(failedCount, 'Error:', email, 'Activation send error:', error);
				console.log('failedEmails:', failedEmails);
			}
		});
	};

	let users = [];
	//send('eugene@khashin.ru', 'test');

	let prepare = function (data) {
		UserModel.findByUserId(data.userId)
			.then(user => {
				//if (users.indexOf(user.email) != -1) {
					send(user.email, data.activationToken);
				//}
			})
	};

	UserActivationModel.getNotActivated()
		.then(result => {
			result.forEach(prepare);
		});
};
//setTimeout(sendActivation, 5000);

let getPassword = function(email) {
	UserModel.findByUserEmail(email)
		.then(result => {

		});
};
//getPassword('vertserega91@mail.ru');

let changePassword = function(email, newPassword) {
	let hashPassword = generateHash(newPassword);

	UserModel.findByUserEmail(email.toLowerCase())
		.then(user => {
			UserModel.updatePassword({
					userId: user.id,
					password: hashPassword
				})
				.then(result => {
					console.log('Password updated success:', result);
				});
		});

};
//changePassword('kamarslanova@icloud.com', 'Aswed123!!');

let checkBlock = function(user_id, isBlock, blockTime) {
	let timePass = new Date().getTime() - new Date(blockTime).getTime(),
		timeLeft = BLOCK_TIME - timePass;
	if (isBlock) {
		if (timeLeft > 0) {
			return timeLeft;
		} else {
			UserActivationModel.unlock(user_id);
		}
	} else {
		return 0;
	}
}

module.exports = {

	dashboard: function(req,res) {
		res.sendFile(path.join(__dirname, '../public/src/dashboard/dashboard.html'));
	},

	login: function(req,res) {
		res.sendFile(path.join(__dirname, '../public/src/login/login.html'));
	},

	logout: function(req,res) {
		req.session.destroy(function(err) {
			res.redirect('/');
		});
	},

	signup: function(passport, req, res, next) {
		passport.authenticate('local-signup', function(err, email, password) {
			if (err) {
				return res.send({ success: false, message: err });
			}

			if (!email) {
				return  res.send({ success: false, message : 'That email is already taken' });
			}

			recaptcha.verify(req, function(error, data){
				if(error){
					return res.send({ success: false, message: 'Wrong captcha' });
				} else {
					let hashPassword = generateHash(password),
						activationToken = generateToken(),
						referalGuid = generateReferal();

					let sendEmail = function () {
						logger.trace(email, 'req.headers.origin:', req.headers.origin);
						emailSender.sendEmailConfirm({
							email,
							host: req.headers.origin,
							token: activationToken,
							success: () => {
								logger.trace(email, 'Create success');
								res.send({ success: true, message: 'We sent activation to your email. Check your email to continue.' });
							},
							fail: error => {
								logger.error(email, 'Create error "Send email error"');
								res.send({ success: false, message: 'Send email error' })
							}
						});
					};
					logger.trace(email, 'Create start');
					BalanceController.generateAccount({
							email: email,
							password: password,
							password_confirmation: password
						})
						.finally(data => {
							logger.trace(email, 'Create balance response:', data);
							UserModel.createNew({
									email: email,
									password: hashPassword,
									referalGuid: referalGuid
								})
								.then(user => {
									logger.trace(email, 'UserModel created');
									UserInfoModel.createNew(user.id)
										.then(() => {
											logger.trace(email, 'UserInfoModel created');
											UserActivationModel.createNew({
													userId: user.id,
													activationToken: activationToken
												})
												.then(() => {
													logger.trace(email, 'UserActivationModel created');
													UserArbitrageModel.createNew({
															userId: user.id
														})
														.then(() => {
															logger.trace(email, 'UserBalanceModel created');
															UserBalanceModel.createNew({
																	userId: user.id
																})
																.then(() => {
																	logger.trace(email, 'UserArbitrageModel created');
																	if (req.body.referalGuid) {
																		UserModel.findByReferalGuid(req.body.referalGuid)
																			.then(parent => {
																				logger.trace(email, 'findByReferalGuid result:', parent.dataValues);
																				UserReferalsModel.createNew({
																						userId: parent.id,
																						referalId: user.id
																					})
																					.then(() => {
																						logger.trace(email, 'UserReferalsModel created');
																						sendEmail();
																					});
																			});
																	} else {
																		sendEmail();
																	}
																});
														});
												});
										});
								});
						});
				}
			});
		})(req, res, next);
	},

	signin: function(passport, req, res, next) {
		let ip = req.ip.split(':').slice(-1)[0];
		let log = {
			email: req.body.email,
			loginIp: `${ip} (${req.ip})`,
			device: detectDevice(req.headers['user-agent'])
		};

		logger.trace('Login body:', req.body);
		
		passport.authenticate('local-signin', function(err, user, info) {
			if (err) {
				loginLog(log, false);
				return next(err);
			}
			if (!user) {
				loginLog(log, false);
				if (info.userId) {  // wrong password
					let attemptsLeft = MAX_LOGIN_ATTEMPT_NUMBER - info.currentAttempt;

					if (attemptsLeft > 0) {
						UserModel.updateAttempts({
								userId: info.userId,
								num: info.currentAttempt
							})
							.then(() => {
								return res.send({ success: false, message: `Incorrect Password (${attemptsLeft} attempts left)`, attemptsLeft: attemptsLeft });
							});
					} else {
						UserActivationModel.findByUserId(info.userId)
							.then(result => {
								if (result.blocked) {
									let blockTimeLeft = checkBlock(info.userId, result.blocked, result.blockTime);
									return res.send({ success: false, block: true, blockTimeLeft });
								} else {
									UserActivationModel.setUserBlock(info.userId)
										.then(() => {
											return res.send({ success: false, block: true, blockTimeLeft: BLOCK_TIME });
										});
								}
							});
					}
				} else {
					return res.send({ success: false, message: info.message });
				}
			} else {
				UserActivationModel.findByUserId(user.id)
					.then(result => {
						if (!result) {
							loginLog(log, false);
							return res.send({ success: false, message: 'Authentication failed' });
						}
						if (!result.active) {
							loginLog(log, false);
							return res.send({ success: false, message: 'Authentication failed' });
						}
						if(result.secretActive) {
							loginLog(log, true);
							return res.send({ success: true, need2FA: true });
						}

						req.login(user, loginErr => {
							if (loginErr) {
								loginLog(log, false);
								return res.send({ success: false, message: 'Login failed' });
							}
							loginLog(log, true);
							return res.send({ success: true, need2FA: false });
						});
					});
			}
		})(req, res, next);
	},

	resetPassword: function(req, res) {
		UserModel.findByUserEmail(req.body.email)
			.then(user => {
				if (!user) {
					return res.send({success: false, message: 'Email not found'} );
				} else {
					UserActivationModel.findByUserId(user.id)
						.then(result => {
							let now = new Date().getTime(),
								expired = new Date(result.forgotExpired).getTime(),
								blockTimeLeft = checkBlock(user.id, result.blocked, result.blockTime);

							if (blockTimeLeft > 0) {
								return res.send({ success: false, block: true, blockTimeLeft });
							} else if (now < expired) {
								emailSender.sendEmailReset({
									email: req.body.email,
									host: req.headers.origin,
									token: result.forgotToken,
									success: () => {
										logger.trace('Reset success:', req.body.email);
										res.send({ success: true, message: 'We have resent you an email for reset password. Please, check your email to continue.' });
									},
									fail: error => {
										logger.error('Reset error "Send email error":', req.body.email);
										res.send({ success: false, message: 'Send email error' })
									}
								});
							} else if (!result.active) {
								emailSender.sendEmailConfirm({
									email: req.body.email,
									host: req.headers.origin,
									token: result.activationToken,
									success: () => {
										logger.trace('Resent activation email success. Email:', req.body.email);
										res.send({ success: true, message: 'You should activate your account first. We have resent you an email with activation. Please, check your email to continue.' });
									},
									fail: error => {
										logger.error('Resent activation email error. Email:', req.body.email);
										res.send({ success: false, message: 'Send email error' })
									}
								});
							} else {
								let forgotToken = generateToken();

								UserActivationModel.setForgot({
										userId: user.id,
										forgotToken: forgotToken
									})
									.then(() => {
										emailSender.sendEmailReset({
											email: req.body.email,
											host: req.headers.origin,
											token: forgotToken,
											success: () => {
												logger.trace('Reset email success. Email:', req.body.email);
												res.send({ success: true, message: 'Check your email to continue.' });
											},
											fail: error => {
												logger.error('Resetsend email error. Email:', req.body.email);
												res.send({ success: false, message: 'Send email error' })
											}
										});
									});
							}
						});
				}
			});
	},

	verifyReset: function(req, res) {
		UserActivationModel.findByForgotToken(req.params.token)
			.then(result => {
				if (!result) {
					logger.error('Reset password token is invalid.');
					return res.redirect('/');
				}

				let now = new Date(),
					expired = new Date(result.forgotExpired);
				if (now.getTime() > expired.getTime()) {
					logger.error('Reset password token is expired. userId:', result.userId);
					return res.sendFile(path.join(__dirname, '../public/src/resetPassword/resetExpired.html'));
				} else {
					return res.sendFile(path.join(__dirname, '../public/src/resetPassword/resetPassword.html'));
				}
			});
	},

	confirmReset: function(req, res) {
		UserActivationModel.findByForgotToken(req.body.token)
			.then(result => {
				if (!result) {
					return res.send({ success: false, message: 'Token is invalid' });
				}
				let hashPassword = generateHash(req.body.password);

				UserModel.updatePassword({
						userId: result.userId,
						password: hashPassword
					})
					.then(() => {
						UserActivationModel.setForgotExpired(result.userId)
							.then(() => {
								return res.send({ success: true });
							});
					});
			});
	},

	changePassword: function(req, res) {
		UserModel.findByUserId(req.user.id)
			.then(user => {
				if (!isValidPassword(user.password, req.body.oldPassword)) {
					return res.send({ success: false, message: 'Incorrect current password' });
				} else {
					let hashPassword = generateHash(req.body.password);

					UserModel.updatePassword({
							userId: req.user.id,
							password: hashPassword
						})
						.then(() => {
							req.session.destroy(function(err) {
								return res.send({ success: true });
							});
						});
				}
			});
	},

	verifyUser: function(req, res) {
		UserActivationModel.findByAuthToken(req.params.token)
			.then(user => {
				if (!user) {
					logger.error('Verify email token is invalid.');
					res.redirect('/');
				}

				if (user.active) {
					logger.error('Verify email token is expired. userId:', user.userId);
					res.redirect('/');
				}

				UserActivationModel.setActive(user.userId)
					.then(result => {
						res.sendFile(path.join(__dirname, '../public/src/login/activation.html'));
					});
			});
	}
};