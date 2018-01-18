angular.module('dashboardApp').controller('tradeController', function($scope, $http, Starter) {
	let tickCount;
	let scrolls = {};

	$scope.markets = [];
	$scope.errorMessage = '';
	$scope.balance = {
		deposit: {
			address: '',
		},
		withdraw: {
			currency: '',
			available: 0,
			amount: 0,
			address: ''
		}
	}

	function init(options) {
		if (tickers.trade) {
			clearInterval(tickers.trade);
			tickers.trade = null;
		}

		$scope.model = {
			exchanges: options.exchanges || [],
			pairs: options.pairs || [],
			fees: options.fees || {},
			exchange: options.exchange || '',
			pair: options.pair || '',
			wallet: null,
			orders: null
		};

		['sell', 'buy'].forEach(side => {
			$scope.model[side] = {
				type: 'limit',
				price: 0,
				amount: 0,
				result: 0,
				fee: 0.2
			}
		});

		$scope.tickerData = null;
		$scope.orderBook = null;
		$scope.tradeHistory = null;
		$scope.marketSearch = '';
		$scope.showBalancePopup = false;
	}

	$scope.$watch(
			scope => $scope.$parent.currentPage,
			value => {
				console.log('currentPage=', value);
				if (value == 'trade') {
					init({});
					scrolls.markets = new PerfectScrollbar('#scrollbar2');
					scrolls.sell = new PerfectScrollbar('#scrollbar3');
					scrolls.buy = new PerfectScrollbar('#scrollbar4');
					scrolls.trade = new PerfectScrollbar('#scrollbar6');
					scrolls.exchanges = new PerfectScrollbar('#scrollbar7');

					post('/getWalletData', {}, function(data) {
						console.log('trade getWalletData:', data);

						$scope.userBalances = data.balances;
					});

					post('/getExchangesList', {}, function(response) {
						console.log('getExchangesList:', response);
						$scope.model.exchanges = response;

						setWatches();

						$scope.changeExchange(response[0]);
					});
				}
			}
		);

	$scope.changeExchange = function(exchange) {
		console.log('Exchange change:', exchange);
		init({
			exchanges: $scope.model.exchanges,
			exchange: exchange
		});
		$scope.markets = [];
		post('/getExchangeInfo', { exchange: exchange }, function(response) {
			console.log('getExchangeInfo:', response);
			$scope.model.fees = response.fees;
			$scope.model.pairs = response.markets;
			$scope.markets = response.markets;
			$scope.changePair(response.markets[0]);
		});
	};

	$scope.changePair = function(pair) {
		console.log('Pair change:', pair, $scope.model);
		init({
			exchanges: $scope.model.exchanges,
			exchange: $scope.model.exchange,
			fees: $scope.model.fees,
			pairs: $scope.model.pairs,
			pair: pair
		});

		$scope.model.buy.fee = $scope.model.fees.common.taker;
		$scope.model.sell.fee = $scope.model.fees.common.taker;

		getUserData();
	};

	$scope.buy = function () {
		// sendOrder('buy', function(response) {
		// 	console.log('buy response:', response);
		// 	getUserData();
		// });
	};

	$scope.sell = function () {
		// sendOrder('sell', function(response) {
		// 	console.log('sell response:', response);
		// 	getUserData();
		// });
	};
	
	$scope.cancelOrder = function (id) {
		let data = {
			exchange: $scope.model.exchange,
			market:  $scope.model.pair.id,
			orderId: id
		};
		post('/cancelOrder', data, function(response) {
			console.log('cancelOrder:', response);
			getUserData();
		});
	};
	
	$scope.deposit = function (currency) {
		$scope.balance.withdraw.currency = '';
		$scope.showBalancePopup = true;
		let data = {
			exchange: $scope.model.exchange,
			market:  $scope.model.pair.id,
			currency: currency
		};
		post('/getDepositAddress', data, function(response) {
			console.log('deposit:', response);
			$scope.balance.deposit.address = response.address;
		});
	};

	$scope.withdraw = function () {
		let data = {
			exchange: $scope.model.exchange,
			market:  $scope.model.pair.id,
			currency: $scope.balance.withdraw.currency,
			amount: $scope.balance.withdraw.amount,
			address: $scope.balance.withdraw.address
		};
		post('/withdraw', data, function(response) {
			console.log('deposit:', response);
			
			//getUserData();
		});
	};

	$scope.showWithdraw = function (currency) {
		$scope.balance.withdraw.currency = currency.name;
		$scope.balance.withdraw.available = currency.available;
		$scope.balance.withdraw.amount = 0;
		$scope.balance.withdraw.address = '';
		$scope.balance.deposit.address = '';
		$scope.showBalancePopup = true;
		let data = {
			exchange: $scope.model.exchange,
			market:  $scope.model.pair.id,
			currency: currency.name
		};
		post('/getWithdrawInfo', data, function(response) {
			console.log('getWithdrawInfo response:', response);
			$scope.balance.withdraw.fee = response.fee;
		});
	};

	$scope.closeBalancePopup = function () {
		$scope.showBalancePopup = false;
	}

	function getUserData () {
		let data = {
			exchange: $scope.model.exchange,
			market:  $scope.model.pair.id
		};
		post('/getUserTradeData', data, function(response) {
			console.log('getUserTradeData:', response);
			$scope.model.wallet = response.balances;
			$scope.model.orders = response.orders;

			$scope.model.pair.wallet1 = response.balances.filter(item => item.name == $scope.model.pair.currency1)[0];
			$scope.model.pair.wallet2 = response.balances.filter(item => item.name == $scope.model.pair.currency2)[0];
			console.log('selected pair:', $scope.model.pair);

			//startTicker($scope.model.exchange == 'Kraken' ? 10 : 5, getTicker);
		});
		$scope.model.buy.price = 0;
		$scope.model.sell.price = 0;

		Starter.init({
			market: $scope.model.pair.id,
			exchanges: [$scope.model.exchange],
			includes: ['ticker', 'orderBook', 'trades']
		});

		Starter.onTick( (exchange, market, data) => {
			$scope.tickerData = data;
		});

		Starter.onOrderBook( (exchange, market, data) => {
			$scope.orderBook = data;

			if ($scope.model.buy.price == 0 || $scope.model.sell.price == 0) {
				$scope.model.buy.price = data.asks[0].price;
				$scope.model.sell.price = data.bids[0].price;
			}
		});

		Starter.onTrade( (exchange, market, data) => {
			$scope.tradeHistory = data.map(item => {
				item.style = item.type.toLowerCase() == 'sell' ? 'red' : 'green';
				return item;
			});
		});
	}

	function sendOrder(side, cb) {
		let m = $scope.model[side];
		console.log('sendOrder model:', m);
		if (!m.amount) {
			showErrorMessage('Please set amount!');
			return false;
		}
		if (m.type == 'limit' && !m.price) {
			showErrorMessage('Please set price!');
			return false;
		}

		let data = {
			exchange: $scope.model.exchange,
			market: $scope.model.pair.id,
			amount: m.amount.toString(),
			type: m.type,
			price: m.price.toString(),
			side: side
		};
		console.log('sendOrder data:', data);
		post('/newOrder', data, function(response) {
			cb(response);
		});
	}

	function setWatches () {
		['sell', 'buy'].forEach(side => {
			let m = $scope.model[side];
			$scope.$watch(
				scope => m.price,
				value => {
					//console.log('new price=', value);
					m.result = m.amount * value;
				}
			);
			$scope.$watch(
				scope => m.amount,
				value => {
					//console.log('new amount=', value);
					m.result = m.price * value;
				}
			);
			$scope.$watch(
				scope => m.result,
				value => {
					//console.log('new result=', value);
					m.amount = value / m.price;
				}
			);
		});
		
		$scope.$watch(
			scope => $scope.marketSearch,
			value => {
				if(value) {
					$scope.markets = $scope.model.pairs.filter(item => item.name.indexOf(value.toUpperCase()) != -1);
				} else {
					$scope.markets = $scope.model.pairs;
				}
			}
		);
	};
	
	function post(url, data, cb) {
		$http.post(url, data)
			.success(function(response) {
				if (response.success) {
					cb(response.data);
				} else {
					if (url == '/getUserTradeData' && response.message == 'Ratelimit' // bittrex
						|| url != '/getTickData' && $scope.model.exchange == 'Kraken' && !response.message.length) {
						post(url, data, cb);
					}
					console.error(url, 'response error:', response.message);
					showErrorMessage(response.message);
				}
			})
			.error(function(response) {
				console.error('error:', response);
				//showErrorMessage(response ? response.message : 'Unknown error!');
			});
	}
	
	function showErrorMessage(message) {
		$scope.errorMessage = message;
		setTimeout(() => {
			$scope.$apply(() => {
				$scope.errorMessage = '';
			});
		}, 3000);
	}
});