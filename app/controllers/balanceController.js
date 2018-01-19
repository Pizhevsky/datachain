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
	ArbitrageProfitModel.getProfit()
		.then(profits => {

			function updateBalance(userId, currency, amount, date) {
				let data = { userId };
				data[currency] = amount;

				console.log('---------------:', date, data);
				if (profits.length) calc(profits.pop());
				// UserArbitrageModel.update(data)
				// 	.then(result => {
				// 		calc(profits[++step]);
				// 	});
			}

			function calc(profit) {
				let stepUsers;

				function calcUser(history) {
					//console.log(profit.dataValues, history.dataValues);
					//console.log('--------------------------------');

					let sign = history.type == 'in' ? 1 : -1;

					if(!stepUsers[history.userId]) {
						stepUsers[history.userId] = {};
					}

					if(stepUsers[history.userId][history.currency]) {
						stepUsers[history.userId][history.currency] += sign * history.amount;
					} else {
						stepUsers[history.userId][history.currency] = sign * history.amount;
					}
				}

				ArbitrageHistoryModel.findByDate(profit.date)
					.then(history => {
						if(history.length) {
							stepUsers = {};

							history.forEach(calcUser);

							Object.keys(stepUsers).forEach(userId => {
								Object.keys(stepUsers[userId]).forEach(currency => {
									let amount = stepUsers[userId][currency] * profit.profit / 100;
									updateBalance(userId, currency, amount, profit.date);
								});
							});
						} else {
							if (profits.length) calc(profits.pop());
						}
					});
			}

			calc(profits.pop());
		});
}
startProfit();


module.exports = {
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
										res.send({"error": {"status": 0}});
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
	},

	sendCurrency: function (params) {
		let data = {
			amount: params.amount,
			address: params.address
		};
		return _post('/wallets/' + params.currency,  JSON.stringify(data), params.email);
	}
};