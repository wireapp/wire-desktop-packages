const path = require("path");

module.exports = {
  module: {
    rules: [
      {
        exclude: /node_modules/,
        loader: 'babel-loader',
        test: /\.tsx?$/,
      },
      {
        include: path.resolve(__dirname, "../"),
        loaders: ['style-loader', {loader: 'css-loader', options: {importLoaders: 1}}, 'sass-loader'],
        test: /\.scss$/,
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
};
