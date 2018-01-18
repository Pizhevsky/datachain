'use strict';

var Bitfinex = require('../services/exchanges/bitfinex');
var Bittrex = require('../services/exchanges/bittrex');
var Wex = require('../services/exchanges/wex');
var Poloniex = require('../services/exchanges/poloniex');

var Exchanges = {
	Bitfinex,
	Bittrex,
	//Kraken,
	Wex,
	Poloniex
}

let ticker = null;
let exchangesData = {};
let exchangesMarkets = {};
let commonMarkets = ['BTC-ETH', 'BTC-USD'];
let config = {
	markets: ['BTC-ETH', 'BTC-USD'],
	marketsCount: 1,
	exchanges: ['Bitfinex','Bittrex','Wex','Poloniex'],
	actions: ['ticker', 'orderBook', 'trades'],
	depth: 1000,
	tickInterval: 5 // seconds
};

config.exchanges.forEach(exchange => {
	getExchangeMarkets(exchange);
	exchangesData[exchange] = {};

	config.actions.forEach(action => {
		exchangesData[exchange][action] = {};
	});
});

function getExchangeMarkets(exchange) {
	Exchanges[exchange].getMarkets()
		.then(array => {
			exchangesMarkets[exchange] = array;
			if (Object.keys(exchangesMarkets).length == config.exchanges.length) {
				console.log('ticker run...');
				startTicker();
			}
		});
}

function makeRequest(exchange, action, market) {
	let marketFound = exchangesMarkets[exchange].indexOf(market) != -1
		|| commonMarkets.indexOf(market) != -1;
	if (marketFound) {
		Exchanges[exchange][action]({market, depth: config.depth})
			.then(response => {
				exchangesData[exchange][action][market] = response;
			})
			.catch(e => {
				//let a = exchangesMarkets;
				console.error(`Don't worry exchange dido:`, exchange, action, market);
				//console.log('ERROR >>', e.error || e);
			});
	}
}

function send() {
	config.exchanges.forEach(exchange => {
		config.actions.forEach(action => {
			config.markets.forEach(market => {
				setTimeout(() => {
					makeRequest(exchange, action, market);
				}, 200);
			});
		});
	});
}

function startTicker(seconds) {
	if (ticker) {
		clearInterval(ticker);
		ticker = null;
	}
	ticker = setInterval(send, (seconds || config.tickInterval) * 1000);
}

module.exports = {
	getTickData: options => {
		if (!options.exchange) {
			return;
		}

		if (config.markets.indexOf(options.market) == -1) {
			if (config.markets.length > config.marketsCount + 2) {
				config.markets.splice(1,config.markets.length - 2);
			}
			console.log(`getTickData add new market=${options.market} to markets:`, config.markets);

			config.markets.push(options.market);
		}

		return options.action
			? options.market
				? exchangesData[options.exchange][options.action][options.market]
				: exchangesData[options.exchange][options.action]
			: exchangesData[options.exchange];
	}
}