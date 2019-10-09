const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = merge(common, {
	mode: 'development',
	plugins: [
		new CleanWebpackPlugin({
			verbose: true,
			cleanOnceBeforeBuildPatterns: ['dist/js/bobblehead.js']
		})
	],
	devtool: 'inline-source-map',
	devServer: {
		contentBase: './dist'
	}
});