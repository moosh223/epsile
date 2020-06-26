const path = require('path')
var HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
    mode: "production",
    entry: "./src/client/epsile.js",
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/client/template.html',
            favicon: './src/client/img/epsile_logo16.png',
            title: 'Epsile -- Talk to Strangers!',
        }),
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
        filename: 'main.js',
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
          {
            test: /\.html$/i,
            loader: 'html-loader'
          },
          {
            test: /\.(png|svg|jpg|gif|ogg|mp3)$/,
            exclude: /node_modules/,
            loader: 'file-loader',
        },
        ],
      },
}