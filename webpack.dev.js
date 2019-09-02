const webpack = require('webpack');
const path = require('path');
const Merge = require('webpack-merge');
const CommonConfig = require('./webpack.common.js');

module.exports = Merge(CommonConfig, {
	mode: 'development',
	devtool: 'cheap-module-eval-source-map',
	plugins: [
	  new webpack.HotModuleReplacementPlugin()
	],
	devServer: {
		contentBase: [path.join(__dirname, 'public'), path.join(__dirname, 'dist')], // 访问url域名对应的根目录
		open: true, // 打开浏览器，访问当前服务器
		port: 5000, // 服务器绑定端口
		host: 'localhost', // 服务器运行ip
		publicPath: '/',
		hot: true
	},
	optimization: {
		usedExports: true
	}
});