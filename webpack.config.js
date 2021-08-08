import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './src/spelboy.ts',
  devtool: 'inline-source-map',
  mode: 'development',
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Spelboy',
      template: 'src/index.html'
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: [
          /tests/,
          /node_modules/
        ],
        include: path.resolve(__dirname, "src"),
      },
      {
        test: /\.(bin|gb)$/,
        use: 'arraybuffer-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: 1234,
  },
};
