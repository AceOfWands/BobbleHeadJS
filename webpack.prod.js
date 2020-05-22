const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = merge(common, {
	mode: 'production',
	plugins: [
		new CleanWebpackPlugin({
			verbose: true,
			cleanOnceBeforeBuildPatterns: ['dist/bobblehead.min.js']
		})
	],
	output: {
		filename: '[name].min.js',
		path: path.resolve(__dirname, 'dist')
	}
});