var webpack = require('webpack');
const path = require('path')

module.exports = {
    mode: 'development',
    entry: './src/index.tsx',
    devtool: 'inline-source-map',
    output: {
        publicPath: '/build',
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
          "path": require.resolve("path-browserify"),
          "buffer": require.resolve('buffer')
        }
    },
    devServer: {
      port: 3000
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': JSON.stringify(process.env)
     }),
     new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
     })
    ],
    module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
          },
          {
            test: /\.css$/i,
            use: ["style-loader", "css-loader"],
          }
        ],
    },
}