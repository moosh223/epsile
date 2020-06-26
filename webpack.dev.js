const path = require('path')
const common = require('./webpack.common')
const merge = require('webpack-merge')

module.exports = merge(common, {
    mode: "development",
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
                'style-loader', //extracts styles to separate CSS file
                'css-loader', // compiles CSS to styles
                'less-loader' // compiles Less to CSS
            ]
          },
        ],
      },
})