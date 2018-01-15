'use strict';

const fs = require('fs');
const path = require('path');
const Poloniex = require('poloniex-api-node');
const utils = require('../../utils');

const config = require(path.join(__dirname, '..', '..', 'config', 'config.json'));
const apiKey = config.exchanges.poloniex.apiKey;
const apiSecret = config.exchanges.poloniex.apiSecret;


let poloniex = new Poloniex(apiKey, apiSecret, { socketTimeout: 15000 });

const marketNameConvert = {
	'BTC-USD': 'USDT_BTC',
	'BTC-ETH': 'BTC_ETH'
};

module.exports = {
	
	ticker: function (params) {
		let market = marketNameConvert[params.market] || params.market;
		return poloniex.returnTicker().then(response => response[market]);
	},

	orderBook: function (params) {
		let market = marketNameConvert[params.market] || params.market;
		return poloniex.returnOrderBook(market, params.depth);
	},

	trades: function (params) {
		let market = marketNameConvert[params.market] || params.market;
		return poloniex.returnTradeHistory(market);
	},

	getMarkets: function (params) {
		return poloniex.returnTicker().then(Object.keys);
	},

	getExchangeInfo: function (params) {
		return Promise.all([
				poloniex.returnTicker(),
				poloniex.returnFeeInfo()
			])
			.then(([ticker, feeInfo]) => {
				let markets = [];
				Object.keys(ticker).forEach(key => {
					let item = ticker[key],
						tmpArr = key.split('_'),
						currency1 = tmpArr[0].toUpperCase(),
						currency2 = tmpArr[1].toUpperCase();

					markets.push({
						id: key,
						name: `${currency1}-${currency2}`,
						currency1,
						currency2
					});
				});


				let fees = {
					common: {
						maker: 100 * feeInfo.makerFee,
						taker: 100 * feeInfo.takerFee
					}
				};

				return { markets, fees };
			});
	},

	newOrder: function(params) {
		return poloniex[params.side](params.market, params.price, params.amount)
			.then(response => {
				return { orderId: response.orderNumber };
			});
	},
	
	cancelOrder: function(params) {
		return poloniex.cancelOrder(params.orderId);
	},

	getDepositAddress: function(params) {
		return poloniex.returnDepositAddresses()
			.then(response => {
				return { address: response[params.currency] };
			});
	},

	getWithdrawInfo: function(params) {
		return poloniex.returnCurrencies()
			.then(response => {
				let data = response[params.currency];
				return { fee: data.txFee };
			});
	},

	withdraw: function(params) {
		return poloniex.withdraw(params.currency, params.amount, params.address);
	},

	getUserData: function(params) {
		return Promise.all([
				poloniex.returnCompleteBalances(),
				poloniex.returnOpenOrders(params.market),
				poloniex.returnMyTradeHistory(params.market)
			])
			.then(([balancesData, openOrders, tradeHistory]) => {
				let balances = Object.keys(balancesData).map(key => {
					let item = balancesData[key];

					return {
						name: key.toUpperCase(),
						amount: Number(item.onOrders) + Number(item.available),
						available: item.available
					}
				});

				let orders = {
						open: openOrders.map(item => {
							return{
								id: item.orderNumber,
								pair: params.market,
								price: item.rate,
								amount: item.amount,
								side: item.type,
								type: item.type
								// timestamp: item.timestamp,
								// time: utils.getTime(item.timestamp * 1000),
								// cancelled: item.is_cancelled,
							}
						}),
						history: tradeHistory.map(item => {
							return {
								id: item.orderNumber,
								pair: params.market,
								price: parseFloat(item.rate),
								amount: parseFloat(item.amount),
								side: item.type,
								type: item.type,
								fee: {
									amount: parseFloat(item.fee)
								},
								timestamp: item.date,
								time: utils.getTime(item.date)
							}
						})
				};

				return { balances, orders };
			});
	},

	getArbitrageInfo: function(params) {
		let currencyMap = {
			'BTC': 'BTC',
			'XBT': 'BTC',
			'USD': 'USD',
			'USDT': 'USD'
		};

		let market = 'USDT_BTC';

		return Promise.all([
				poloniex.returnFeeInfo(),
				poloniex.returnCompleteBalances(),
				poloniex.returnMyTradeHistory(market)
			])
			.then(([info, balance, trades]) => {
				let fees = {
					maker: 100 * info.makerFee,
					taker: 100 * info.takerFee
				};

				let balances = {};
				Object.keys(balance).filter(key => !!currencyMap[key.toUpperCase()]).map(key => {
					let item = balance[key];
					let currency = currencyMap[key.toUpperCase()];

					balances[currency] = {
						amount: Number(item.onOrders) + Number(item.available),
						available: item.available
					};
				});

				let orders = trades.map(item => {
					return {
						id: item.orderNumber,
						exchange: 'Poloniex',
						price: parseFloat(item.rate),
						amount: parseFloat(item.amount),
						side: item.type,
						type: item.type,
						fee: {
							amount: parseFloat(item.fee)
						},
						timestamp: new Date(item.date).getTime(),
						time: utils.getTime(item.date)
					}
				});

				return { name:'Poloniex', market, fees, balances, orders };
			});
	}

};