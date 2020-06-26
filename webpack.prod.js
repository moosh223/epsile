const path = require('path')
const common = require('./webpack.common')
const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = merge(common, {
    mode: "production",
    plugins: [
        new MiniCssExtractPlugin({
        })
    ],
    optimization: {
        minimizer: [
            new TerserPlugin({}),
            new OptimizeCssAssetsPlugin({})
        ]
    },
    output: {
        filename: 'main-[contentHash].js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
          {
            test: /\.less$/,
            exclude: /node_modules/,
            use: [
                MiniCssExtractPlugin.loader, //extracts styles to separate CSS file
                'css-loader', // compiles CSS to styles
                'less-loader' // compiles Less to CSS
            ]
          },
        ],
      },
})