'use strict';

const fs = require("fs");
const path = require("path");
const rp = require('request-promise');
const UserArbitrageModel = require('../models/userArbitrageModel');
const UserBalanceModel = require('../models/userBalanceModel');
const BalanceHistoryModel = require('../models/balanceHistoryModel');
const ArbitrageHistoryModel = require('../models/arbitrageHistoryModel');
const ArbitrageProfitModel = require('../models/arbitrageProfitModel');
const UserModel = require('../models/userModel');
const logger = require('../services/loggerService');
const postman = require('../services/postmanService');

const config = require(path.join(__dirname, '..', 'config', 'config.json'));
const apiKey = config.cryptoWallet.key;
const baseUrl = config.cryptoWallet.url;
const currencyAdress = config.old_arbitrage;

const _get = function(path, email) {
	const url = baseUrl + path;

	let options = {
		method: 'GET',
		url: url,
		headers: {
			'content-type': 'application/json',
			'x-authorization': apiKey,
			'x-email': email
		}
	};

	// console.log('Send to wallet:', options);

	return rp(options);
};

const _post = function(path, body, email) {
	const url = baseUrl + path;

	let headers = {
		'content-type': 'application/json',
		'x-authorization': apiKey
	};

	if (email) {
		headers['x-email'] = email;
	}

	let options = {
		method: 'POST',
		url,
		headers,
		body
	};

	//console.log('Send to wallet:', options);

	return rp(options);
};

function startProfit() {
	function getFloatLength(number) {
		let length =  parseFloat(number).toString().length - parseInt(number).toString().length - 1;
		return Math.max(0, length);
	}

	function multiply(num1, num2) {
		let precision = Math.pow(10, getFloatLength(num1) + getFloatLength(num2));
		//console.log('multiply:', num1, '*', num2, 'precision:',precision);
		return Math.round(num1 * num2 * precision) / precision;
	}

	function add(num1, num2) {
		let precision = Math.pow(10, getFloatLength(num1) + getFloatLength(num2));
		//console.log('add:', num1, '+', num2, 'precision:',precision);
		return Math.round((num1 + num2) * precision) / precision;
	}

	ArbitrageProfitModel.getProfit()
		.then(profits => {
			let stepUsers;
			let stepCount;
			let stepTotal;

			function updateBalance(userId, currency, amount, profit, next) {
				let percent = multiply(profit.profit, 0.01);
				let profitAmount = multiply(amount, percent);
				console.log('---------------:', profit.date, userId, 'profit:', profitAmount);
				next && calc();
				// UserArbitrageModel.findByUserId(userId)
				// 	.then(arbitrage => {
				// 		let balance = {};
				// 		balance[currency] = arbitrage[currency] + profitAmount;
				// 		UserArbitrageModel.update(userId, balance)
				// 			.then(update => {
				// 				console.log('arbitrage balance updated:', userId, update);
				// 				ArbitrageHistoryModel.createNew({
				// 						userId: userId,
				// 						currency: currency,
				// 						amount: profitAmount,
				// 						type: 'in',
				// 						profit: true,
				// 						dateTime: profit.date
				// 					})
				// 					.then(history => {
				// 						console.log('arbitrage history updated:', userId, history);
				// 						next && calc();
				// 					});
				// 			});
				// 	});
			}

			function calcUser(history) {
				console.log('--h:', history.dataValues);
				let sign = history.type == 'in' ? 1 : -1;

				if(!stepUsers[history.userId]) {
					stepUsers[history.userId] = {};
				}

				if(stepUsers[history.userId][history.currency]) {
					stepUsers[history.userId][history.currency] = add(stepUsers[history.userId][history.currency], multiply(sign, history.amount));
				} else {
					stepUsers[history.userId][history.currency] = multiply(sign, history.amount);
				}
			}

			function calc(profit) {
				console.log('--- profits.length:', profits.length);
				if (profits.length) {
					let profit = profits.shift();

					if (new Date(profit.date).getTime() >= new Date('2018-01-20').getTime() ) {
						return false;
					}

					console.log('--p:', profit.dataValues);
					ArbitrageHistoryModel.findByDate(profit.date)
						.then(history => {
							if(history.length) {
								stepUsers = {};
								stepTotal = 0;
								stepCount = 0;

								history.forEach(calcUser);

								Object.keys(stepUsers).forEach(userId => {
									stepTotal += Object.keys(stepUsers[userId]).length;
								});

								console.log('------------------------ stepTotal:', stepTotal);

								Object.keys(stepUsers).forEach(userId => {
									Object.keys(stepUsers[userId]).forEach(currency => {
										let amount = stepUsers[userId][currency];
										updateBalance(userId, currency, amount, profit, ++stepCount == stepTotal);
									});
								});
							} else {
								calc();
							}
						});
				}
			}

			calc();
		});
}
//startProfit();


const sendCurrency = function (params) {
	let data = {
		amount: params.amount,
		address: params.address
	};
	return _post('/wallets/' + params.currency,  JSON.stringify(data), params.email);
};

module.exports = {
	sendCurrency,

	generateAccount: function (data) {
		return _post('users/',  JSON.stringify(data));
	},

	getUserAddresses: function (user) {
		return _get('users/info', user.email)
			.then(info => {
				info = JSON.parse(info);

				return info.data && info.data.addresses;
			});
	},

	getUserTransactions: function (user) {
		return Promise.all([
			_get(`transactions/btc`, user.email),
			_get(`transactions/eth`, user.email)
		])
		.then(([tbtc, teth]) => {
			tbtc = JSON.parse(tbtc);
			teth = JSON.parse(teth);

			return {
				btc: tbtc.data,
				eth: teth.data
			};
		});
	},

	getNetworkFee: function () {
		return _get('common/fee', '');
	},

	getUserBalances: function (user) {
		return _get('users/balances', user.email);
	},

	getTransactions: function (user, currency) {
		return _get(`transactions/${currency}`, user.email);
	},

	onWalletUpdate: function (req, res) {
		logger.trace('onWalletUpdate');
		logger.trace('onWalletUpdate headers:', req.headers);
		logger.trace('onWalletUpdate params:', req.params);
		logger.trace('onWalletUpdate body:', req.body);
		logger.trace('onWalletUpdate apiKey:', apiKey);
		
		let key = req.headers['x-authorization'];
		if (key != apiKey) {
			res.send({"data": {},"error": {"status": 1,"message": "Invalid authorization token"}});
			return;
		}

		if(!req.body) {
			res.send({"data": {},"error": {"status": 1,"message": "Balance not found"}});
			return;
		}

		let email = req.headers['x-email'];
		let currency = req.params.currency;
		let prev_balance = req.body.prev_balance;
		let new_balance = req.body.new_balance;

		UserModel.findByUserEmail(email)
			.then(user => {
				logger.trace('onWalletUpdate user.id:', user.id);
				UserBalanceModel.findByUserId(user.id)
					.then(userBalance => {
						let balance = {};
						let growth = parseFloat(new_balance) - parseFloat(prev_balance);
						balance[currency] = userBalance[currency] + growth;
						logger.trace('onWalletUpdate email:', email);
						logger.trace('onWalletUpdate balance:', userBalance && userBalance.dataValues, 'will update by', currency, ':', prev_balance, '->', new_balance);

						UserBalanceModel.update(user.id, balance)
							.then(result => {
								logger.trace(user.id, 'onWalletUpdate balance updated:', currency, ':', prev_balance, '->', new_balance);
								console.log('onWalletUpdate balance updated: ', currency, ':', prev_balance, '->', new_balance);
								BalanceHistoryModel.createNew({
										userId: user.id,
										currency: currency,
										amount: growth,
										txid: '',
										type: 'in',
										src: 'e',
										dateTime: new Date()
									})
									.then(history => {
										postman.send({
											amount: growth,
											currency: currency,
											email: user.email
										})
										.then(result => {
											res.send({"error": {"status": 0}});
										})
										.catch(e => {
											logger.error(user.id, 'onWalletUpdate send to exchange error:', currency, ':', prev_balance, '->', new_balance);
											res.send({"error": e});
										});
									});
							})
							.catch(e => {
								logger.error(user.id, 'onWalletUpdate balance not updated:', currency, ':', prev_balance, '->', new_balance);
								res.send({"error": e});
							});
					})
					.catch(e => {
						logger.error(user.id, 'onWalletUpdate balance not found:', currency, ':', prev_balance, '->', new_balance);
						res.send({"error": e});
					});

			})
			.catch(e => {
				logger.error('onWalletUpdate user not found:', email);
				res.send({"error": e});
			});
	}
};