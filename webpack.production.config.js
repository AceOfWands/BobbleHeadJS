const path = require('path');

module.exports = {
	mode: 'production',
	entry: './src/bobblehead.js',
	output: {
		filename: 'bobblehead.js',
		path: path.resolve(__dirname, 'dist', 'js')
	}
};