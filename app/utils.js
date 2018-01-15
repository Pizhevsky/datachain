module.exports = {
	roundDecimal: function (number, precision) {
		let factor = Math.pow(10, precision),
			e = number.toString().split('e'),
			digits = e.length > 1 ? +e[1].slice(1) + e[0].split('.').length - 1 : 0,
			fix = e.length > 1 ? parseFloat(number).toFixed(digits) : number,
			tmp = fix * factor,
			rounded = Math.round(tmp);

		return parseInt(fix) ? rounded / factor : fix;
	},

	engineerNumberToString: function (number) {
		let strNumber = number.toString();
		if (strNumber.indexOf('e') == -1) {
			return number;
		}
		let e = strNumber.split('e'),
			precision = e[1].slice(1);
		
		return parseFloat(number).toFixed(precision);
	},

	getTime: function (value) {
		let date = new Date(value),
			offset = date.getTimezoneOffset(),
			time = [
				date.getHours(), // - offset / 60,
				date.getMinutes(),
				date.getSeconds()
			].map(item => {
				return item < 10 ? `0${item}` : item;
			}).join(':');

		return time;
	}
};