const webpack = require('webpack');
const Merge = require('webpack-merge');
const CommonConfig = require('./webpack.common.js');

module.exports = Merge(CommonConfig, {
    mode: 'production',
    optimization: {
        minimize: true
    },
    plugins: [
        new webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false
        }),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        })
    ]
});