const path = require('path')
var HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    entry: "./src/epsile.js",
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/template.html',
            favicon: './src/img/epsile_logo16.png',
            title: 'Epsile -- Talk to Strangers!'
        })
    ],
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
          {
            test: /\.less$/,
            exclude: /node_modules/,
            loader: 'style-loader!css-loader!less-loader' // compiles Less to CSS
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