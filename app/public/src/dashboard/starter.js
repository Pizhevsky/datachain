angular.module('dashboardApp').factory('Starter', function(Exchanges) {
	const tickInterval = 5; // seconds
	const exchangesMarkets = {
		'BTC-USD': {
			Bitfinex: 'btcusd',
			Bittrex: 'USDT-BTC',
			//Kraken: 'XXBTZUSD',
			Wex: 'btc_usd',
			Poloniex: 'USDT_BTC'
		},
		'BTC-ETH': {
			Bitfinex: 'ethbtc',
			Bittrex: 'BTC-ETH',
			//Kraken: '?',
			Wex: 'eth_btc',
			Poloniex: 'BTC_ETH'
		}
	};

	let starterTicker = null;
	let state = {
		market: 'BTC-USD',
		exchanges: [],
		includes: ['ticker', 'orderBook', 'trades']
	};
	let actionsCallbacks = {
		ticker: (data) => {},
		orderBook: (data) => {},
		trades: (data) => {}
	};

	function startGroup(exchange, market) {
		state.includes.forEach(action => {
			(function (action) {
				Exchanges[action](exchange, market)
					.then(response => {
						//console.log('Starter:', exchange, market, action, 'response:', response);
						if (response && response.data) {
							actionsCallbacks[action](exchange, market, Exchanges.parse(exchange, market, action, response));
						}
					});
			})(action);
		});
	}

	function send() {
		if (state.exchanges.length) {
			let isSingle = state.exchanges.length == 1;
			if (!isSingle) {
				if (Object.keys(exchangesMarkets).indexOf(state.market) == -1) {
					console.error(state.market + ' not ready yet!');
					return;
				}
			}
			state.exchanges.forEach(exchange => {
				let market = exchangesMarkets[state.market] ? exchangesMarkets[state.market][exchange] : state.market;
				startGroup(exchange, market);
			});
		} else {
			console.log('no exchanges');
		}
	}

	function startTicker(seconds) {
		send();
		if (starterTicker) {
			clearInterval(starterTicker);
			starterTicker = null;
		}
		starterTicker = setInterval(send, (seconds || tickInterval) * 1000);
	}

	return {
		init: (options) => {
			angular.extend(state, options);
			console.log('init Starter with config:', state);
			startTicker();
		},
	
		changeMarket: (market) => {
			state.market = market;
			startTicker();
		},

		changeExchanges: (name, remove) => {
			if (remove) {
				state.exchanges = state.exchanges.filter(item => item !== name);
			} else {
				state.exchanges.push(name);
			}
		},

		setExchanges: (arr) => {
			state.exchanges = arr;
		},

		onTick: (cb) => {
			actionsCallbacks.ticker = cb;
		},

		onOrderBook: (cb) => {
			actionsCallbacks.orderBook = cb;
		},

		onTrade: (cb) => {
			actionsCallbacks.trades = cb;
		}
	};
});