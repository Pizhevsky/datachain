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

					$scope.User = user;
					$scope.User.validBirthday = new Date(testDate);
					$scope.isVerified = user.verified;
					$scope.formData.phone = user.phone;

					console.log('addr:', user.adresses);
					console.log('keys:', Object.keys(user.adresses));
					let wallets = [];
					Object.keys(user.balances).forEach(key => {
						wallets.push({
							currency: key.toUpperCase(),
							balance: user.balances[key],
							address: user.adresses[key],
							arbitrage: user.arbitrage[key]
						});
					});
					console.log('wallets:', wallets);
					$scope.wallets = wallets;

					if (validateUserInfo()) {
						$scope.loadStatus = 2;
					}
				});
				post('/getUserReferals', {}, function(referals) {
					$scope.referals = referals;
				});
			}
		}
	);


	function validateUserInfo () {
		let result = true;
		Object.keys($scope.User).forEach((key) => {
			let value = $scope.User[key];
			if (!value && key != 'phone' && key != 'verified') {
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
	}

	$scope.changeArbitrageView = function (wallet) {
		wallet.isChanging = true;
		oldValue = wallet.arbitrage;
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
