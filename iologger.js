module.exports = {
	logIO: function(logData) {
		var loggingFile = 'decksite.log'
		var date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
		var toLog = date + ': ' + logData + '\n';
		require('fs').appendFile(loggingFile, toLog, function (err) {
			if (err) throw err;
			console.log(toLog.replace('\n',''));
		});
	}
}