var fs = require("fs");


var save = function (array, callback, errorFn) {
	var savedFiles = {};

	var saveFile = function () {
		if (array.length) {
			let file = array.pop(),
				fileData  = file.content.split(/:|;|,/); // data:image\/png;base64,

			if(fileData.length == 4) {
				let fileExtention = fileData[1].slice(6),
					binaryData = new Buffer(fileData[3], 'base64'),
					path = `/upload/${file.id}_${file.name}.${fileExtention}`;
				
				fs.writeFile(`.${path}`, binaryData, 'binary', function (err) {
					if (err) {
						errorFn(err);
					} else {
						savedFiles[file.name] = path;
						saveFile();
					}
				});
			} else {
				saveFile();
			}
		} else {
			callback(savedFiles);
		}
	};
	
	saveFile();
};

module.exports = { save };