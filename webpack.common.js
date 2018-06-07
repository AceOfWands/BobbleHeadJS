const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
	entry: {
		bobblehead: './src/BobbleHead.js'
	},
	plugins: [
		new CleanWebpackPlugin(['dist/js/bobblehead.js'])
	],
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist', 'js')
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					'style-loader',
					'css-loader'
				]
			}
		]
	}
};