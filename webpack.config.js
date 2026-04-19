const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const mode = argv.mode || 'development';
  return {
    mode,
    entry: './web/index.js',
    output: {
      path: path.resolve(__dirname, 'web-build'),
      filename: mode === 'production' ? '[name].[contenthash].js' : 'bundle.js',
      publicPath: '/',
      clean: true,
    },
    devtool: mode === 'production' ? 'source-map' : 'eval-cheap-module-source-map',
    devServer: {
      static: path.join(__dirname, 'web-build'),
      historyApiFallback: true,
      hot: true,
      host: '127.0.0.1',
      port: 8080,
    },
    module: {
      rules: [
        {
          test: /\.(tsx?|jsx?)$/,
          include: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'App.tsx'),
            path.resolve(__dirname, 'web'),
            path.resolve(__dirname, 'node_modules/react-native'),
            path.resolve(__dirname, 'node_modules/react-native-web'),
            path.resolve(__dirname, 'node_modules/@react-navigation'),
            path.resolve(__dirname, 'node_modules/react-native-paper'),
            path.resolve(__dirname, 'node_modules/react-native-vector-icons'),
            path.resolve(__dirname, 'node_modules/react-native-safe-area-context'),
            path.resolve(__dirname, 'node_modules/react-native-screens'),
            path.resolve(__dirname, 'node_modules/@react-native-async-storage'),
            path.resolve(__dirname, 'node_modules/react-native-svg'),
            path.resolve(__dirname, 'node_modules/@react-native'),
          ],
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              configFile: path.resolve(__dirname, 'babel.config.js'),
            },
          },
        },
        {
          test: /\.(png|jpg|jpeg|gif|webp)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(ttf|woff|woff2)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.wasm$/i,
          type: 'asset/resource',
        },
      ],
    },
    resolve: {
      extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js', '.jsx', '.json'],
      alias: {
        'react-native$': 'react-native-web',
        '@expo/vector-icons/MaterialCommunityIcons': path.resolve(
          __dirname,
          'node_modules/react-native-vector-icons/MaterialCommunityIcons',
        ),
        '@react-native-vector-icons/material-design-icons': path.resolve(
          __dirname,
          'node_modules/react-native-vector-icons/MaterialCommunityIcons',
        ),
        [path.resolve(__dirname, 'src/data/db/database.native.ts')]: path.resolve(
          __dirname,
          'src/data/db/database.web.ts',
        ),
        'react-native-webview': path.resolve(__dirname, 'web/shims/react-native-webview.tsx'),
        'react-native-fs': path.resolve(__dirname, 'web/shims/react-native-fs.ts'),
        'react-native-image-picker': path.resolve(__dirname, 'web/shims/react-native-image-picker.ts'),
        'react-native-html-to-pdf': path.resolve(__dirname, 'web/shims/react-native-html-to-pdf.ts'),
        'react-native-share': path.resolve(__dirname, 'web/shims/react-native-share.ts'),
        '@brooons/react-native-bluetooth-escpos-printer': path.resolve(
          __dirname,
          'web/shims/bluetooth-escpos-printer.ts',
        ),
      },
      fallback: {
        fs: false,
        net: false,
        tls: false,
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'web/index.html'),
        inject: true,
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(
              __dirname,
              'node_modules/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf',
            ),
            to: 'MaterialCommunityIcons.ttf',
          },
        ],
      }),
    ],
  };
};
