const path = require('path');

module.exports = {
	mode: 'development',
	entry: './src/bobblehead.js',
	output: {
		filename: 'bobblehead.js',
		path: path.resolve(__dirname, 'dist', 'js')
	}
};