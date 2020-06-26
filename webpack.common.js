const path = require('path')
var HtmlWebpackPlugin = require('html-webpack-plugin')
const clientPath = path.resolve(__dirname, "src/client/")

module.exports = {
    entry: clientPath+"/epsile.js",
    plugins: [
        new HtmlWebpackPlugin({
            template: clientPath+'/template.html',
            favicon: clientPath+'/img/epsile_logo16.png',
            title: 'Epsile -- Talk to Strangers!',
        })
    ],
    module: {
        rules: [
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