"use strict";

var QRCode = require('qrcode');
var speakeasy = require('speakeasy');
var randomstring = require('randomstring');
var crypto = require('crypto');

var UserModel = require('../models/userModel');
var UserReferalsModel = require('../models/userReferalsModel');
var UserInfoModel = require('../models/userInfoModel');
var UserActivationModel = require('../models/userActivationModel');
var UserArbitrageModel = require('../models/userArbitrageModel');
var UserBalanceModel = require('../models/userBalanceModel');
var BalanceController = require('./balanceController');
const logger = require('../services/loggerService');

var smsSender = require('../services/smsSender');
var fileSaver = require('../services/fileSaver');

const MAX_SECRET_ATTEMPT_NUMBER = 3;

var geteratePhoneCode = function () {
	return randomstring.generate({
		length: 6,
		charset: 'numeric'
	});
};

var copyWalletData = function () {
	let investors = {
		'safaevem@invent.group': {
			balance: {
				abx: 912000
			},
			arbitrage: {
				btc: 60.946
			}
		},
		'wolk2906@gmail.com': {
			balance: {
				abx: 120000
			},
			arbitrage: {
				btc: 16.57
			}
		},
		'ivanmarbella@gmail.com': {
			balance: {
				abx: 28000
			}
		},
		'sergeybogachedrygix@gmail.com': {
			arbitrage: {
				btc: 0.6734
			}
		},
		'rinat090@mail.ru': {
			balance: {
				abx: 48000
			}
		},
		'bur_arbidex@protonmail.com': {
			balance: {
				abx: 120000
			}
		},
		'vol_arbidex@protonmail.com': {
			balance: {
				abx: 87000
			}
		},
		'79224724400av@gmail.com': {
			balance: {
				abx: 48000
			},
			arbitrage: {
				btc: 0.4145
			}
		},
		'aysmforever@protonmail.com': {
			balance: {
				abx: 270398
			},
			arbitrage: {
				btc: 7.8084
			}
		},
		'e@klv.club': {
			arbitrage: {
				btc: 16.488
			}
		},
		'vertserega91@mail.ru': {
			balance: {
				abx: 208200
			}
		},
		'alexsec@protonmail.com': {
			balance: {
				abx: 120000
			}
		}
		// },
		// 'denis.pizhevsky@gmail.com': {
		// 	balance: {
		// 		abx: 111
		// 	},
		// 	arbitrage: {
		// 		btc: 1.1111
		// 	}
		// }
	};
	let count = 0;

	let getBalance = function(user) {
		if (user.id < 650) {
			return false;
		}
		console.log('UserId:',user.id);
		BalanceController.getUserBalances(user)
			.then(response => {
				let wallet = JSON.parse(response);
				console.log(user.email, ':', wallet.data.balances, ':', wallet.data.remaining_balance);

				let balance = wallet.data.remaining_balance;

				let btc = wallet.data.balances.btc - wallet.data.remaining_balance.btc;
				let eth = wallet.data.balances.eth - wallet.data.remaining_balance.eth;
				let arbitrage = {
					btc: btc < 0 ? 0 : btc,
					eth: eth < 0 ? 0 : eth,
				}

				let investor = investors[user.email];
				if(investor){
					count++;
					console.log(count, '^^^^^^^^^^investor^^^^^^^^^');
					balance = Object.assign(balance, investor.balance);
					arbitrage = Object.assign(arbitrage, investor.arbitrage);
				}

				UserBalanceModel.findByUserId(user.id)
					.then(res => {
						if (res) {
							console.log('update:', user.id);
							UserBalanceModel.update(user.id, balance);
						} else {
							console.log('create:', user.id);
							UserBalanceModel.createNew({userId: user.id})
								.then(res => {
									UserBalanceModel.update(user.id, balance);
								});
						}
					})
					.catch(e => {
						console.log('update error:', e);
					});
				UserArbitrageModel.update(user.id, arbitrage);

			})
		.catch(e => {
			console.log('user wallet not found:', user);
			console.log('update error:', e);
		});
	};

	UserModel.getAll()
		.then(users => {
			console.log('users:', users);
			users.forEach(getBalance);
		})
}
//copyWalletData();

module.exports = {

	getUserReferals: function(req,res) {
		return UserReferalsModel.getAllReferals(req.user.id)
			.then(users => {
				let promises = users.map(item => {
					return UserModel.findByUserId(item.referalId);
				});

				Promise.all(promises).then(referals => {
					let data = referals.map(item => {
							return {
								email: item.email
							}
						});
					return res.json({ success: true, data});
				});
			});
	},

	getUserData: function(req,res) {
		return UserModel.findByUserId(req.user.id)
			.then(user => {
				UserInfoModel.findByUserId(user.id)
					.then(userInfo => {
						logger.trace('getUserData:', user.id);
						UserArbitrageModel.findByUserId(user.id)
							.then(arbitrage => {
								logger.trace(user.id, 'Get wallet arbitrage:', arbitrage.dataValues);
								UserBalanceModel.findByUserId(user.id)
									.then(balance => {
										logger.trace(user.id, 'Get wallet balance:', balance.dataValues);
										BalanceController.getUserInfo(user)
											.then(info => {
												let adressResponse = JSON.parse(info);
												logger.trace(user.id, 'Get wallet info:', adressResponse);
												userInfo.dataValues.adresses = adressResponse.data.addresses;
												userInfo.dataValues.balances = {
													abx: balance.abx,
													btc: balance.btc,
													eth: balance.eth
												};
												userInfo.dataValues.arbitrage = {
													abx: arbitrage.abx,
													btc: arbitrage.btc,
													eth: arbitrage.eth
												};
												userInfo.dataValues.email = user.email;
												userInfo.dataValues.referalLink = req.headers.origin + '/login?' + (user.referalGuid || crypto.randomBytes(32).toString('hex'));

												return res.json({ success: true, data: userInfo});
											});
									});
							});
					});
			});
	},

	setUserData: function(req,res) {
		var updateData = {};
		var fileNames = ['passport', 'registration', 'photoDoc'];
		var filesToSave = [];

		Object.keys(req.body).forEach((key) => {
			let value = req.body[key];
			if (value && fileNames.indexOf(key) != -1) {
				filesToSave.push({
					id: req.user.id,
					name: key,
					content: value
				});
			}
		});

		fileSaver.save(filesToSave,
			(savedFiles) => {
				Object.keys(req.body).forEach((key) => {
					let value = req.body[key];
					if (value && key != 'userId') {
						updateData[key] = (fileNames.indexOf(key) == -1) ? value : savedFiles[key];
					}
				});
				updateData.verified = false;

				UserInfoModel.updateData(req.user.id, updateData)
					.then(userInfo => {
						res.json({ success: true });
					});
			},
			(error) => {
				res.json({ success: false, message: error });
			}
		);
	},

	getPhoneCode: function(req,res) {
		var code = geteratePhoneCode(),
			text = `Проверочный код: ${code}`;//Datachain code: ${code}. Will work next 5 minutes.`;

		UserActivationModel.setPhoneCode({
				userId: req.user.id,
				code: code
			})
			.then(data => {
				smsSender.send(req.body.phone, text)
				res.json({ success: true });
			});
	},

	phoneCodeConfirm: function(req,res) {
		UserActivationModel.findByUserId(req.user.id)
			.done(result => {
				if (result.phoneCode != req.body.phoneCode) {
					return res.send({ success: false, message: 'Wrong code' });
				}

				let now = new Date(),
					expired = new Date(result.codeExpired);
				if (now.getTime() > expired.getTime()) {
					return res.send({ success: false, message: 'Time expired' });
				}

				UserInfoModel.updatePhone(req.user.id, req.body.phone)
					.then(() => {
						res.json({ success: true });
					});
			});
	},

	getSecret2FA: function(req,res) {
		UserActivationModel.getSecret(req.user.id)
			.done(secret => {
				if (secret.isActive) {
					res.json({success: true, data: { active: true }});
				} else {
					var secret = speakeasy.generateSecret({length: 20, name: `data-chain-test.net (${new Date().toLocaleDateString()})`});
					QRCode.toDataURL(secret.otpauth_url, function(err, qr) {
						res.json({success: true, data: { active: false, key: secret.base32, qr }});
					});
				}
			});
	},

	setSecret2FA: function(req,res) {
		UserActivationModel.getSecret(req.user.id)
			.done(secret => {
				if (secret.isActive) {
					res.json({success: false, message: '2FA already active'});
				} else {
					var verified = speakeasy.totp.verify({
						encoding: 'base32',
						secret: req.body.key,
						token: req.body.token
					});
					if (verified) {
						UserActivationModel.setSecret(req.user.id, req.body.key)
							.then(() => {
								res.json({success: true});
							});

					} else {
						res.json({success: false, message: 'Wrong code'});
					}
				}
			});
	},

	checkSecret2FA: function(req, res) {
		UserModel.findByUserEmail(req.body.email)
			.then(user => {
				UserActivationModel.getSecret(user.id)
					.done(result => {
						var verified = speakeasy.totp.verify({
							encoding: 'base32',
							secret: result.key,
							token: req.body.token
						});
						if (verified) {
							req.login(user, loginErr => {
								if (loginErr) {
									return res.json({ success: false, message: loginErr });
								}
								UserActivationModel.updateAttempts({
										userId: user.id,
										num: 0
									})
									.then(() => {
										return res.send({ success: true });
									});
							});
						} else {
							let currentAttempt = ++result.secretAttempts,
								attemptsLeft = MAX_SECRET_ATTEMPT_NUMBER - currentAttempt;
	
							if (attemptsLeft > 0) {
								UserActivationModel.updateAttempts({
										userId: user.id,
										num: currentAttempt
									})
									.then(() => {
										return res.json({ success: false, message: `Incorrect code (${attemptsLeft} attempts left)` });
									});
							} else {
								UserActivationModel.setUserBlock(user.id)
									.then(() => {
										return res.json({ success: false, block: true });
									});
							}
						}
					});
			});
	},

	resetSecret2FA: function(req,res) {
		UserActivationModel.deleteSecret(req.user.id)
			.then (() => {
				res.json({ success: true });
			});
	}

};