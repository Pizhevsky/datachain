"use strict";

var QRCode = require('qrcode');
var speakeasy = require('speakeasy');
var randomstring = require('randomstring');
var crypto = require('crypto');
var fs = require("fs");
var path = require("path");

var UserModel = require('../models/userModel');
var UserReferalsModel = require('../models/userReferalsModel');
var UserInfoModel = require('../models/userInfoModel');
var UserActivationModel = require('../models/userActivationModel');
var UserArbitrageModel = require('../models/userArbitrageModel');
var UserBalanceModel = require('../models/userBalanceModel');
var ArbitrageHistoryModel = require('../models/arbitrageHistoryModel');
var BalanceHistoryModel = require('../models/balanceHistoryModel');
var BalanceWithdrawModel = require('../models/balanceWithdrawModel');
var BalanceController = require('./balanceController');
var emailSender = require('../services/emailSender');
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

var generateToken = function () {
	return crypto.randomBytes(64).toString('hex');
};

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

var copyWalletData = function () {
	let count = 0;
	let getBalance = function(user) {
		if (user.id <= 1400 || user.id > 1450) {
			return false;
		}
		BalanceController.getUserBalances(user)
			.then(response => {
				let wallet = JSON.parse(response);
				console.log(user.id, user.email, ':', wallet.data.balances, ':', wallet.data.remaining_balance);

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

				// UserBalanceModel.findByUserId(user.id)
				// 	.then(res => {
				// 		if (res) {
				// 			console.log('update:', user.id);
				// 			UserBalanceModel.update(user.id, balance);
				// 		} else {
				// 			console.log('create:', user.id);
				// 			UserBalanceModel.createNew({userId: user.id})
				// 				.then(res => {
				// 					UserBalanceModel.update(user.id, balance);
				// 				});
				// 		}
				// 	})
				// 	.catch(e => {
				// 		console.log('update error:', e);
				// 	});
				// UserArbitrageModel.update(user.id, arbitrage);

			})
			.catch(e => {
				console.log('--------------------------------------------------user wallet not found: id=', user.dataValues.id, 'email=', user.dataValues.email);
				//console.log('update error:', e);
			});
	};

	UserModel.getAll()
		.then(users => {
			console.log('users:', users.length);
			users.forEach(getBalance);
		})
}
copyWalletData();

var work = function (startIndex) {
	let notNull = 0,
		count = 0,
		common = {},
		resCount = 0,
		totalCount = 50;
	let getTransactions = function(user) {
		if (user.id <= startIndex || user.id > startIndex + totalCount) {
			return false;
		}
		count++;
		if(investors[user.email]) {
			return false;
		}
		Promise.all([
				UserArbitrageModel.findByUserId(user.id),
				UserBalanceModel.findByUserId(user.id)
			])
			.then(([arbitrage, balance]) => {
				//console.log( user.id, 'Arbitrage:', arbitrage.dataValues, 'Balance:', balance.dataValues);
				if (arbitrage.eth > 0 || arbitrage.btc > 0 || balance.eth > 0 || balance.btc > 0) {
					notNull++;
					common[user.id] = {
						btc: [],
						eth: []
					};

					Promise.all([
							BalanceController.getTransactions(user, 'btc'),
							BalanceController.getTransactions(user, 'eth')
						])
						.then(([btc, eth]) => {
							let btcRes = JSON.parse(btc);
							let ethRes = JSON.parse(eth);

							common[user.id].btc = btc;
							common[user.id].eth = eth;
							console.log(common);
							console.log(notNull + '---------------------------------------');

							// updateHistory(user.id, 'btc', btcRes.data.in, btcRes.data.out);
							// updateHistory(user.id, 'eth', ethRes.data.in, ethRes.data.out);
						})
						.catch(e => {
							console.log('user transactions btc not found:', user.id);
							console.log('update error:', e);
						});
				}
			});
	};

	UserModel.getAll()
		.then(users => {
			users.forEach(getTransactions);
		});
};
var step = 0;
// work(step*50);
// var interval = setInterval(() => {
// 	step++;
// 	console.log('step:', step);
// 	if (step < 28) {
// 		work(step*50);
// 	} else {
// 		console.log('end');
// 		clearInterval(interval);
// 	}
// }, 4000);

function updateHistory (userId, currency, tIn, tOut) {
	function addIn (item) {
		BalanceHistoryModel.createNew({
			userId: userId,
			currency: currency,
			amount: item.amount,
			txid: item.txid,
			type: 'in',
			src: 'e',
			dateTime: new Date(item.created_at)
		})
		.then(success => {
			console.log(userId, 'in success');
		})
		.catch(e => {
			console.log(userId, 'in error', e);
		});
	}

	function addOut (item) {
		BalanceHistoryModel.createNew({
			userId: userId,
			currency: currency,
			amount: item.amount,
			txid: item.txid,
			type: 'out',
			src: 'a',
			dateTime: new Date(item.created_at)
		})
		.then(success => {
			console.log(userId, 'out success');
		})
		.catch(e => {
			console.log(userId, 'out error', e);
		});

		ArbitrageHistoryModel.createNew({
			userId: userId,
			currency: currency,
			amount: item.amount,
			type: 'in',
			dateTime: new Date(item.created_at)
		})
		.then(success => {
			console.log(userId, 'in arbitrage success');
		})
		.catch(e => {
			console.log(userId, 'in arbitrage error', e);
		});
	}

	tIn.forEach(addIn);
	tOut.forEach(addOut);
}

function getUserWalletInfo(userId) {
	// UserModel.findByUserId(userId)
	// 	.then(user => {
	// 		BalanceController.getUserAddresses(user)
	// 			.then(addresses => {
	// 				console.log(user.dataValues, addresses);
	// 				BalanceController.getTransactions(user, 'eth')
	// 					.then(transactions => {
	// 						console.log(transactions);
	// 					})
	// 			})
	// 	});
	let data = {};
	let count = 0;
	UserModel.getAll()
		.then(users => {
			console.log(users.length);
			users.forEach(user => {
				BalanceController.getUserAddresses(user)
					.then(addresses => {
						data[user.id] ={
							email: user.email,
							addresses
						};
						if (++count == users.length) {
							console.log(data);
						}

						console.log(count);
					})
					.catch(e => {
						if (++count == users.length) {
							console.log(data);
						}
						console.log('not found:', user.id, user.email)
					});
			});
		});
}
//getUserWalletInfo(1412);

module.exports = {

	sendWithdrawEmail: function(req,res) {
		let withdrawToken = generateToken();
		
		BalanceWithdrawModel.createNew({
				userId: req.user.id,
				currency: req.body.currency,
				amount: req.body.amount,
				address: req.body.address,
				token: withdrawToken,
				dateTime: new Date()
			})
			.then(result => {
				logger.trace('Withdraw try to send email:', req.user.email);
				emailSender.confirmWithdraw({
					email: req.user.email,
					host: req.headers.origin,
					amount: req.body.amount,
					currency: req.body.currency,
					address: req.body.address,
					token: withdrawToken,
					success: () => {
						logger.trace('Withdraw confirm email send success:', req.user.email);
						res.send({ success: true, message: 'We have sent you confirm email. Please, check your email to continue.' });
					},
					fail: error => {
						logger.error('Withdraw confirm email send error "Send email error":', req.user.email);
						res.send({ success: false, message: 'Send email error' })
					}
				});
			});
	},
	
	verifyWithdraw: function(req,res) {
		logger.trace('Try to withdraw:', req.params.token);
		BalanceWithdrawModel.findByWithdrawToken(req.params.token)
			.then(result => {
				if (!result) {
					logger.error('Withdraw token is invalid.', req.params.token);
					return res.sendFile(path.join(__dirname, '../public/src/withdraw/invalid.html'));
				}
				if (result.approved) {
					logger.error('Withdraw token is expired. userId:', result.userId, req.params.token);
					return res.sendFile(path.join(__dirname, '../public/src/withdraw/expired.html'));
				} else {
					let now = new Date();
					logger.trace('Try to withdraw token found:', result.userId, req.params.token);

					Promise.all([
							UserBalanceModel.findByUserId(result.userId),
							UserModel.findByUserId(result.userId)
						])
						.then(([userBalance, user]) => {
							logger.error('Withdraw user balance:', result.userId, userBalance.dataValues);

							if (userBalance[result.currency] < result.amount) {
								logger.error('Withdraw balance not enough:', result.userId, userBalance[result.currency], result.amount);
								return res.sendFile(path.join(__dirname, '../public/src/withdraw/empty.html'));
							}

							let sendData = {
								currency: result.currency,
								amount: result.amount,
								address: result.address,
								email: user.email
							};

							BalanceController.sendCurrency(sendData)
								.then(send => {
									let response = JSON.parse(send);
									logger.error('Withdraw send response:', result.userId, response);
									if(response.error) {
										return res.sendFile(path.join(__dirname, '../public/src/withdraw/empty.html'));
									}

									let balance = {};
									balance[result.currency] = userBalance[result.currency] - result.amount;

									UserBalanceModel.update(result.userId, balance)
										.then(update => {
											logger.error('Withdraw updated:', result.userId, update);
											BalanceHistoryModel.createNew({
													userId: result.userId,
													currency: result.currency,
													amount: result.amount,
													txid: response.data.txid,
													type: 'out',
													src: 'e',
													dateTime: now
												})
												.then(history => {
													logger.error('Withdraw added history:', result.userId, history);
													BalanceWithdrawModel.setApproved()
														.then(approved => {
															logger.error('Withdraw approved:', result.userId, approved);
															return res.sendFile(path.join(__dirname, '../public/src/withdraw/confirmed.html'));
														})
												});
										});
								})
								.catch(e => {
									logger.error('Withdraw sendCurrency error:', result.userId, sendData);
									return res.sendFile(path.join(__dirname, '../public/src/withdraw/empty.html'));
								});
						})
						.catch(e => {
							logger.error('Withdraw user or balance not found:', result.userId, e);
							return res.sendFile(path.join(__dirname, '../public/src/withdraw/empty.html'));
						});
				}
			});
	},
	
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

	getWalletData: function(req,res) {
		return Promise.all([
				UserModel.findByUserId(req.user.id),
				UserArbitrageModel.findByUserId(req.user.id),
				UserBalanceModel.findByUserId(req.user.id)
			])
			.then(([user, arbitrage, balance])=> {
				console.log(user.id, 'Get wallet arbitrage:', arbitrage.dataValues);
				console.log(user.id, 'Get wallet balance:', balance.dataValues);

				Promise.all([
						BalanceController.getUserAddresses(user),
						BalanceController.getNetworkFee()
					])
					.then(([addresses, feeData]) => {
						console.log(req.user.id, 'Get wallet addresses:',  addresses ? 'addresses found' : 'addresses empty');
						let networkFee = JSON.parse(feeData);
						let fee = networkFee.data;

						let data = {
							addresses,
							fee,
							balances: {
								abx: balance.abx,
								btc: balance.btc,
								eth: balance.eth
							},
							arbitrage: {
								abx: arbitrage.abx,
								btc: arbitrage.btc,
								eth: arbitrage.eth
							}
						};

						return res.json({ success: true, data});
					})
					.catch(e => {
						logger.error(user.id, 'Get addresses error:', e);
					});
			})
			.catch(e => {
				logger.error(req.user.id, 'getWalletData error:', e);
			});
	},

	getHistoryData:  function(req,res) {
		return Promise.all([
				UserModel.findByUserId(req.user.id),
				BalanceHistoryModel.findByUserId(req.user.id),
				ArbitrageHistoryModel.findByUserId(req.user.id)
			])
			.then(([user, balance, arbitrage]) => {
				console.log(user.id, 'Get balanceHistory:', balance ? 'balanceHistory found' : 'balanceHistory empty');
				console.log(user.id, 'Get balanceHistory:', arbitrage ? 'arbitrageHistory found' : 'arbitrageHistory empty');

				BalanceController.getUserTransactions(user)
					.then(transactions => {
						console.log(user.id, 'Get wallet transactions:',  transactions ? 'transactions found' : 'transactions empty');

						let data = {
							transactions,
							history: {
								balance,
								arbitrage
							}
						};

						return res.json({ success: true, data});
					})
					.catch(e => {
						logger.error(user.id, 'Get transactions error:', e);
					});
			})
			.catch(e => {
				logger.error(req.user.id, 'getHistoryData error:', e);
			});
	},

	getUserData: function(req,res) {
		return Promise.all([
				UserModel.findByUserId(req.user.id),
				UserInfoModel.findByUserId(req.user.id),
				UserActivationModel.findByUserId(req.user.id)
			])
			.then(([user, userInfo, activation]) => {
				console.log(user.id, 'Get activation:', activation && activation.dataValues && `active:${activation.dataValues.active}, blocked:${activation.dataValues.blocked}`);

				BalanceController.getUserAddresses(user)
					.then(addresses => {
						console.log(user.id, 'Get wallet info:',  addresses ? 'addresses found' : 'addresses empty');

						userInfo.dataValues.addresses = addresses;
						userInfo.dataValues.email = user.email;
						userInfo.dataValues.need2FA = activation.secretActive;
						userInfo.dataValues.referalLink = req.headers.origin + '/login?' + (user.referalGuid || crypto.randomBytes(32).toString('hex'));

						return res.json({ success: true, data: userInfo});
					})
					.catch(e => {
						logger.error(user.id, 'Get addresses error:', e);
					});
			})
			.catch(e => {
				logger.error(req.user.id, 'getUserData error:', e);
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
			text = `Arbidex code: ${code}`;//Datachain code: ${code}. Will work next 5 minutes.`;

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
					var secret = speakeasy.generateSecret({length: 20, name: `Arbidex (${new Date().toLocaleDateString()})`});
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
		UserModel.findByUserEmail(req.body.email || req.user.email)
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