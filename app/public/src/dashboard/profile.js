angular.module('dashboardApp').controller('profileController', function($scope, $http) {
	$scope.data = [];
	$scope.formData = {};
	$scope.currentTab = 'account';
	$scope.changePasswordView = false;
	$scope.changePasswordDone = false;
	$scope.phoneCodeView = false;
	$scope.phoneConfirmDone = false;
	$scope.loadStatus = 0;
	$scope.isVerified = false;
	$scope.need2FA = false;
	$scope.errorMessage = '';
	$scope.successMessage = '';

	var fileNames = ['passport', 'registration', 'photoDoc'];

	$scope.changeTab = function (tab) {
		$scope.currentTab = tab;
	};

	$scope.setChangeView = function(bool) {
		$scope.changePasswordView = bool;
	};

	$scope.changePassword = function() {
		var data = $scope.formData;

		if (!checkPassword(data.password)) {
			showErrorMessage(`Password isn't strong enough`);
			return false;
		}

		if (data.password != data.confirm) {
			showErrorMessage('Password mismatch');
			return false;
		}

		if (data.oldPassword == data.password) {
			showErrorMessage('Passwords are the same');
			return false;
		}

		post('/changePassword', data, function(response) {
			$scope.changePasswordDone = true;
		});
	};

	$scope.confirmPhone = function () {
		if (!$scope.formData.phone) {
			showErrorMessage('Set the number!');
			return;
		}

		let digits = $scope.formData.phone.match(/\d+/g).join('');
		console.log('digits:',digits);
		if (digits.length == 11) {
			post('/phoneConfirm', { phone: digits }, function(response) {
				$scope.phoneCodeView = true;
			});
		} else {
			showErrorMessage('Wrong number!');
		}
	};

	$scope.confirmPhoneCode = function () {
		post('/phoneCodeConfirm', $scope.formData, function(response) {
			$scope.phoneConfirmDone = true;
		});
	};

	$scope.uploadFile = function () {
		console.log('uploadFile');
		var input = this;
		if (input.files && input.files[0]) {
			console.log('file:', input.files[0]);
			var reader = new FileReader();
			reader.onload = function (e) {
				console.log('loaded:', e);
				$scope.$apply(() => {
					$scope.User[input.name] = e.target.result;
				});
			};
			reader.readAsDataURL(input.files[0]);
		}
	};

	$scope.fileNameChanged = function (input) {
		console.log('file:', input.files);
		if (input.files && input.files[0]) {
			console.log('file:', input.files[0]);
			var reader = new FileReader();
			reader.addEventListener('load', function () {
				$scope.$apply(() => {
					$scope.User[input.name] = reader.result;
				});
			}, false);
			reader.readAsDataURL(input.files[0]);
		}
	};

	$scope.saveUserInfo = function () {
		console.log('Data:', $scope.User);

		let birthday = new Date($scope.User.birthday);

		if (birthday.getTime() > $scope.User.validBirthday.getTime()) {
			showErrorMessage('You should be older than 18');
			return false;
		}
		console.log('$scope.User:', $scope.User);

		if (validateUserInfo()) {
			$scope.loadStatus = 1;
			post('/setUserData', $scope.User, function(response) {
				$scope.loadStatus = 2;
				showSuccessMessage('Info successful updated!');
			});
		} else {
			showErrorMessage('All fields are required');
		}
	};

	$scope.changeUserInfo = function () {
		$scope.isVerified = false;
	};

	$scope.copyReferal = function () {
		var emailLink = document.querySelector('.j-referal');
		var range = document.createRange();
		range.selectNode(emailLink);
		window.getSelection().addRange(range);
		try {
			var successful = document.execCommand('copy');
			var msg = successful ? 'successful' : 'unsuccessful';
			console.log('Copy email command was ' + msg);
		} catch(err) {
			console.log('Oops, unable to copy');
		}

		window.getSelection().removeAllRanges();
	};

	$scope.$watch(
		scope => $scope.$parent.currentPage,
		value => {
			console.log('currentPage=', value);
			if (value == 'profile') {
				post('/getUserData', {}, function(user) {
					console.log(user);
					let now = new Date(),
						testDate = (now.getFullYear() - 18) +'-'+ (now.getMonth() + 1) +'-'+ now.getDate()

					//console.log('user:',user);
					$scope.User = user;
					$scope.User.validBirthday = new Date(testDate);
					$scope.isVerified = user.verified;
					$scope.formData.phone = user.phone;
					$scope.need2FA = user.need2FA;

					if (validateUserInfo()) {
						$scope.loadStatus = 2;
					}
				});

				tickers.userInfo = setInterval(updateUserData, 2000);

				post('/getUserReferals', {}, function(referals) {
					$scope.referals = referals;
				});
			}
		}
	);
	
	function updateUserData () {
		post('/getWalletData', {}, function(data) {
			//console.log('getWalletData:', data);

			let wallets = $scope.wallets || [];
			Object.keys(data.balances).forEach(key => {
				let found = wallets.filter(item => item.currency == key);
				if (found.length) {
					found[0].balance = data.balances[key];
					found[0].address = data.addresses[key];
					found[0].arbitrage = data.arbitrage[key];
				} else {
					wallets.push({
						currency: key,
						balance: data.balances[key],
						address: data.addresses[key],
						arbitrage: data.arbitrage[key]
					});
				}
			});
			$scope.wallets = wallets;
			$scope.transactionFees = data.fee;
		});
	}

	function validateUserInfo () {
		let result = true;
		let validKeys = ['birthday','citizen','firstname','lastname','passport','photoDoc','registration'];
		Object.keys($scope.User).forEach((key) => {
			let value = $scope.User[key];
			if (!value && validKeys.indexOf(key) != -1) {
				result = false;
			}
		});
		return result;
	}

	function post(url, data, cb) {
		$http.post(url, data)
			.success(function(response) {
				if (response.success) {
					cb(response.data);
				} else {
					console.log('response error:', response);
					if (response.logout) {
						window.location = '/';
					} else {
						if (response.block) {
							window.location = '/block';
						} else {
							showErrorMessage(response.message);
						}
					}
				}
			})
			.error(function(response) {
				console.log('error:', response);
				showErrorMessage(response.message);
			});
	}

	function checkPassword(password) {
		var s_letters = "qwertyuiopasdfghjklzxcvbnm"; // Буквы в нижнем регистре
		var b_letters = "QWERTYUIOPLKJHGFDSAZXCVBNM"; // Буквы в верхнем регистре
		var digits = "0123456789"; // Цифры
		var specials = "!@#$%^&*()_-+=\|/.,:;[]{}"; // Спецсимволы
		var is_s = false; // Есть ли в пароле буквы в нижнем регистре
		var is_b = false; // Есть ли в пароле буквы в верхнем регистре
		var is_d = false; // Есть ли в пароле цифры
		var is_sp = false; // Есть ли в пароле спецсимволы
		for (var i = 0; i < password.length; i++) {
			if (!is_s && s_letters.indexOf(password[i]) != -1) is_s = true;
			else if (!is_b && b_letters.indexOf(password[i]) != -1) is_b = true;
			else if (!is_d && digits.indexOf(password[i]) != -1) is_d = true;
			else if (!is_sp && specials.indexOf(password[i]) != -1) is_sp = true;
		}
		console.log(password, password.length, is_s, is_b, is_d, is_sp);
		return password.length >= 8 && is_s && is_b && is_d && is_sp;
	}

	function showErrorMessage(message) {
		$scope.errorMessage = message;
		setTimeout(() => {
			$scope.$apply(() => {
				$scope.errorMessage = '';
			});
		}, 3000);
	}

	function showSuccessMessage(message) {
		$scope.successMessage = message;
		setTimeout(() => {
			$scope.$apply(() => {
				$scope.successMessage = '';
			});
		}, 3000);
	}
});

angular.module('dashboardApp').controller('walletController', function($scope, $http) {
	$scope.errorMessage = '';
	$scope.successMessage = '';

	let oldValue = 0;

	$scope.hideCollapsed = function () {
		$('.collapse').collapse('hide');
	};

	$scope.setWithdrawView = function (item) {
		$('.collapse').collapse('hide');
		item.withdrawView = 'withdraw';
	};

	$scope.getHistory = function () {
		$('.collapse').collapse('hide');
		post('/getHistoryData', {}, function(response) {
			console.log('getHistoryData:', response.data);
			let transactions = response.data.transactions;
			let balanceHistory = {
				btc: [],
				eth: []
			};
			let arbitrageHistory = {
				btc: [],
				eth: []
			};
			response.data.history.balance.forEach(item => {
				let foundIn = transactions[item.currency]
					&& transactions[item.currency].in.filter(transaction => transaction.txid == item.txid);
				let foundOut = transactions[item.currency]
					&& transactions[item.currency].out.filter(transaction => transaction.txid == item.txid);
				let transaction = foundIn.length ? foundIn[0] : (foundOut.length ? foundOut[0] : {to: '', status: ''});

				balanceHistory[item.currency].push({
					date: new Date(item.dateTime).toLocaleString(),
					amount: (item.type == 'in' ? '+' : '-') + item.amount,
					type: (item.type == 'in' ? 'from external' : 'to external'),
					src: transaction.to,
					status: transaction.status
				});
			});
			response.data.history.arbitrage.forEach(item => {
				if(!item.profit) {
					arbitrageHistory[item.currency].push({
						date: new Date(item.dateTime).toLocaleString(),
						amount: (item.type == 'in' ? '+' : '-') + item.amount,
						type: (item.type == 'in' ? 'from balance' : 'to balance'),
						status: 'confirmed'
					});
				}
			});
			console.log('balanceHistory:', balanceHistory);
			console.log('arbitrageHistory:', arbitrageHistory);
			$scope.balanceHistory = balanceHistory;
			$scope.arbitrageHistory = arbitrageHistory;
		});
	};

	$scope.changeArbitrageView = function (wallet) {
		wallet.isChanging = true;
		oldValue = wallet.arbitrage;
	};

	$scope.withdraw = function (wallet) {
		wallet.withdrawView = '2FA';
	};

	$scope.check2FA = function(wallet) {
		if (!wallet.code) {
			showErrorMessage('Set the code!');
			return;
		}
		post('/checkSecret2FA', {token: wallet.code}, res => {
			let data = {
				address: wallet.withdraw_balance_address,
				amount: wallet.withdraw_balance_amount,
				currency: wallet.currency
			}
			console.log('withdraw_data:', data);
			post('/sendWithdrawEmail', data, res => {
				wallet.withdrawMessage = res.message;
				wallet.withdrawView = 'email';
			});
		});
	};

	$scope.cancel2FA = function(wallet) {
		wallet.withdrawView = 'withdraw';
	};

	$scope.changeArbitrage = function (wallet) {
		$scope.successMessage = '';
		wallet.isChanging = false;

		let amount = wallet.arbitrage - oldValue;

		console.log('changeArbitrage wallet:', wallet);
		if (amount == 0) {
			return;
		}

		if (amount < 0) {
			wallet.arbitrage = wallet.arbitrage - amount;
			showErrorMessage(`For now you can only increase arbitrage!`);
			return;
		}

		if (amount > wallet.balance) {
			wallet.arbitrage = wallet.arbitrage - amount;
			showErrorMessage(`Balance isn't enough!`);
			return;
		}

		let data = {
			currency: wallet.currency,
			amount,
			total: wallet.arbitrage,
			email: $scope.User.email
		}
		console.log('sendCurrency data:', data);
		$http.post('/sendCurrency', data)
			.success(function(response) {
				if (response.success) {
					console.log('response success:', response);
					let data = JSON.parse(response.data);
					showSuccessMessage(`Arbitrage deposit of ${wallet.currency} updated!`); // Transaction id: ${data.data.txid}`);
				} else {
					wallet.arbitrage = wallet.arbitrage - amount;
					console.error('response error:', response);
					showErrorMessage(`Balance isn't enough!`);
				}
			})
			.error(function(response) {
				wallet.arbitrage = wallet.arbitrage - amount;
				console.error('error:', response);
				showErrorMessage(response.message);
			});
	};

	function post(url, data, cb) {
		$http.post(url, data)
			.success(function(response) {
				if (response.success) {
					cb(response);
				} else {
					console.log('response error:', response);
					if (response.logout) {
						window.location = '/';
					} else {
						if (response.block) {
							window.location = '/block';
						} else {
							showErrorMessage(response.message);
						}
					}
				}
			})
			.error(function(response) {
				console.log('error:', response);
				showErrorMessage(response.message);
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

	function showSuccessMessage(message) {
		$scope.successMessage = message;
		setTimeout(() => {
			$scope.$apply(() => {
				$scope.successMessage = '';
			});
		}, 3000);
	}
});

// angular.module('dashboardApp').controller('referalController', function($scope, $http) {
// 	$scope.referals = [{
// 		email: 'dezerter@rambler.ru',
// 		balance: 0,
// 		adress: '',
// 		chains: 0
// 	}]
// });

angular.module('dashboardApp').controller('google2FAController', function($scope, $http) {
	$scope.errorMessage = '';
	$scope.Secret = {};

	$scope.switchOn = function() {
		post('/setSecret2FA', $scope.Secret, res => {
			$scope.Secret.active = true;
		});
	};

	$scope.reset = function() {
		post('/resetSecret2FA', {}, res => {

			updateData();
		});
	};

	function updateData() {
		post('/getSecret2FA', {}, function(data) {
			console.log(data);
			$scope.Secret.key = data.key;
			$scope.Secret.qr = data.qr;
			$scope.Secret.active = data.active;
			$scope.Secret.token = null;
		});
	}
	updateData();


	function post(url, data, cb) {
		$http.post(url, data)
			.success(function(response) {
				if (response.success) {
					cb(response.data);
				} else {
					console.log('response error:', response);
					if (response.logout) {
						window.location = '/';
					} else {
						if (response.block) {
							window.location = '/block';
						} else {
							showErrorMessage(response.message);
						}
					}
				}
			})
			.error(function(response) {
				console.log('error:', response);
				showErrorMessage(response.message);
			});
	}

	function showErrorMessage(message) {
		$scope.errorMessage = message;
		setTimeout(() => {
			$scope.$apply(() => {
				$scope.errorMessage = '';
			});
		}, 3000);
	};

});

angular.module('dashboardApp').directive('customOnChange', function($parse) {
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			var onChangeFunc = scope.$eval(attrs.customOnChange);
			var onChangeFunc = $parse(attrs['customOnChange']);
			element.bind('change', onChangeFunc);
		}
	};
});
