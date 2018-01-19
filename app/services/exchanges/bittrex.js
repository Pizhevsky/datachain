'use strict';

const fs = require('fs');
const path = require('path');
const bittrex = require('node-bittrex-api');
const utils = require('../../utils');

const config = require(path.join(__dirname, '..', '..', 'config', 'config.json'));
const apiKey = config.exchanges.bitfinex.apiKey;
const apiSecret = config.exchanges.bitfinex.apiSecret;

bittrex.options({
	'baseUrl' : 'https://bittrex.com/api/v1.1',
	'apikey': config.exchanges.bittrex.apiKey,
	'apisecret': config.exchanges.bittrex.apiSecret
});

const marketNameConvert = {
	'BTC-USD': 'USDT-BTC',
	'BTC-ETH': 'BTC-ETH'
};

module.exports = {

	ticker: function (params) {
		let market = marketNameConvert[params.market] || params.market;
		return new Promise(function(resolve, reject) {
			bittrex.getmarketsummary({ market }, function(data, err) {
				if (err) {
					reject(err);
				} else {
					resolve(data.result[0]);
				}
			});
		});
	},

	orderBook: function (params) {
		let market = marketNameConvert[params.market] || params.market;
		return new Promise(function(resolve, reject) {
			bittrex.getorderbook({ market, depth: params.depth, type: 'buy' }, function(buyData, err) {
				if (err) {
					reject(err);
				} else {
					bittrex.getorderbook({ market: params.market, depth: params.depth, type: 'sell' }, function(sellData, err) {
						if (err) {
							reject(err);
						} else {
							resolve({
								bids: buyData,
								asks: sellData
							});
						}
					});
				}
			});
		});
	},

	trades: function (params) {
		let market = marketNameConvert[params.market] || params.market;
		return new Promise(function(resolve, reject) {
			bittrex.getmarkethistory({ market }, function(data, err) {
				if (err) {
					reject(err);
				} else {
					resolve(data.result);
				}
			});
		});
	},

	getMarkets: function (params) {
		return new Promise(function(resolve, reject) {
			bittrex.getmarkets(function(data, err) {
				if (err) {
					reject(err);
				} else {
					resolve(data.result.map(item => item.MarketName));
				}
			});
		});
	},

	getExchangeInfo: function (params) {
		return new Promise(function(resolve, reject) {
			bittrex.getmarkets(function(data, err) {
				if (err) {
					reject(err);
				} else {
					resolve({
						markets: data.result.map(item => {
							let tmpArr = item.MarketName.split('-'),
								isUSDT = tmpArr[0].toUpperCase() == 'USDT',
								currency1 = tmpArr[isUSDT ? 1 : 0].toUpperCase(),
								currency2 = tmpArr[isUSDT ? 0 : 1].toUpperCase();

							return {
								id: item.MarketName,
								name: `${currency1}-${currency2}`,
								min: utils.engineerNumberToString(item.MinTradeSize),
								currency1,
								currency2
							}
						}),
						fees: {
							common: {
								maker: 0.25,
								taker: 0.25
							}
						}
					});
				}
			});
		});
	},

	newOrder: function (params) {
		return new Promise(function(resolve, reject) {
			let options = {
				market: params.market,
				quantity: params.amount,
				rate: params.price
			}

			bittrex[`${params.side}limit`](options, function(data, err) {
				if (err) {
					reject(err);
				} else {
					resolve({ orderId: data.result.uuid });
				}
			});
		});
	},
	
	cancelOrder: function (params) {
		return new Promise(function(resolve, reject) {
			bittrex.cancel({ uuid: params.orderId }, function(data, err) {
				if (err) {
					reject(err);
				} else {
					resolve(data.result);
				}
			});
		});
	},
	
	getDepositAddress: function (params) {
		return new Promise(function(resolve, reject) {
			bittrex.getdepositaddress({ currency: params.currency }, function(data, err) {
				if (err) {
					reject(err);
				} else {
					resolve({ address: data.result.Address });
				}
			});
		});
	},

	getWithdrawInfo: function (params) {
		return new Promise(function(resolve, reject) {
			bittrex.getcurrencies(function(data, err) {
				if (err) {
					reject(err);
				} else {
					let found = data.result.filter(item => item.Currency == params.currency);
					let txFee = found.length ? found[0].TxFee : 'not found';
					resolve({ fee: txFee });
				}
			});
		});
	},

	withdraw: function (params) {
		return new Promise(function(resolve, reject) {
			let options = {
				currency: params.currency,
				quantit: params.amount,
				address: params.address
			};

			bittrex.withdraw(options, function(data, err) {
				if (err) {
					reject(err);
				} else {
					resolve(data.result);
				}
			});
		});
	},

	getUserData: function (params) {
		return new Promise(function(resolve, reject) {
			bittrex.getbalances(function(data, err) {
				if (err) {
					reject(err);
				}
				let balances = data.result
					.map(item => {
						return {
							name: item.Currency.toUpperCase(),
							amount: item.Balance,
							available: item.Available
						}
					});
				let orders = {};

				bittrex.getopenorders({}, function(data, err) {
					if (err) {
						reject(err);
					}
					orders.open = data.result.map(item => {
						let side = item.OrderType.split('_').slice(-1)[0];
						return{
							id: item.OrderUuid,
							pair: item.Exchange,
							price: item.Price,
							amount: item.Quantity,
							side: side,
							type: item.OrderType,
							timestamp: item.Opened,
							time: utils.getTime(item.TimeStamp),
							cancelled: item.CancelInitiated,
						}
					});

					bittrex.getorderhistory({}, function(data, err) {
						if (err) {
							reject(err);
						}
						orders.history = data.result.map(item => {
							let side = item.OrderType.split('_').slice(-1)[0];
							return{
								id: item.OrderUuid,
								pair: item.Exchange,
								price: item.Price,
								amount: parseFloat(item.Quantity),
								side: side,
								type: item.OrderType,
								fee: {
									amount: parseFloat(item.Commission)
								},
								timestamp: item.TimeStamp,
								time: utils.getTime(item.TimeStamp)
							}
						});

						resolve({ balances, orders });
					});
				});
			});
		});
	},
	
	getArbitrageInfo: function(params) {
		let currencyMap = {
			'BTC': 'BTC',
			'XBT': 'BTC',
			'USD': 'USD',
			'USDT': 'USD'
		};
		
		let fees = {
			maker: 0.25,
			taker: 0.25
		};

		let market = 'USDT-BTC';

		return new Promise(function(resolve, reject) {
			bittrex.getbalances(function(data, err) {
				if (err) {
					reject(err);
				}

				let balances = {};
				console.log('Bittrex getArbitrageInfo getbalances data:', data);
				if (data) {
					data.result.filter(item => !!currencyMap[item.Currency.toUpperCase()])
						.forEach(item => {
							let currency = currencyMap[item.Currency.toUpperCase()];
						balances[currency] = {
							amount: item.Balance,
							available: item.Available
						};
					});
				}

				let orders = [];
				bittrex.getorderhistory({}, function(data, err) {
					if (err) {
						reject(err);
					}
					orders = data.result.map(item => {
						let side = item.OrderType.split('_').slice(-1)[0];
						return{
							id: item.OrderUuid,
							exchange: 'Bittrex',
							price: item.Price,
							amount: parseFloat(item.Quantity),
							side: side,
							type: item.OrderType,
							fee: {
								amount: parseFloat(item.Commission)
							},
							timestamp: new Date(item.TimeStamp).getTime(),
							time: utils.getTime(item.TimeStamp)
						}
					});

					resolve({ name: 'Bittrex', market, fees, balances, orders });
				});
			});
		});
	}
};
