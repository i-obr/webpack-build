import path from 'path';
import merge from 'webpack-merge';

import sane from 'sane';
import webpack from 'webpack';

import Dashboard from 'webpack-dashboard';
import DashboardPlugin from 'webpack-dashboard/plugin';

import common from './webpack.common.babel';
import settings from './webpack.settings.babel';

const LEGACY_CONFIG = 'legacy';
const MODERN_CONFIG = 'modern';

const dashboard = new Dashboard();

const configureDevServer = buildType => {
  return {
    public: settings.devServerConfig.public(),
    contentBase: path.resolve(__dirname, settings.paths.templates),
    host: settings.devServerConfig.host(),
    port: settings.devServerConfig.port(),
    https: !!parseInt(settings.devServerConfig.https()),
    disableHostCheck: true,
    quiet: true,
    hot: true,
    hotOnly: true,
    overlay: true,
    stats: 'errors-only',
    watchOptions: {
      poll: !!parseInt(settings.devServerConfig.poll()),
      ignored: /node_modules/
    },
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    before: (app, server) => {
      const watcher = sane(path.join(__dirname, settings.paths.templates), {
        glob: ['**/*'],
        poll: !!parseInt(settings.devServerConfig.poll())
      });
      watcher.on('change', filePath => {
        console.log('Файл изменён:', filePath);
        server.sockWrite(server.sockets, 'content-changed');
      });
    }
  };
};

const configureImageLoader = buildType => {
  if (buildType === LEGACY_CONFIG) {
    return {
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: 'img/[name].[hash].[ext]'
          }
        }
      ]
    };
  }
  if (buildType === MODERN_CONFIG) {
    return {
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: 'img/[name].[hash].[ext]'
          }
        }
      ]
    };
  }
};

const configurePostcssLoader = buildType => {
  if (buildType === LEGACY_CONFIG) {
    return {
      test: /\.(pcss|css)$/,
      loader: 'ignore-loader'
    };
  }
  if (buildType === MODERN_CONFIG) {
    return {
      test: /\.(pcss|css)$/,
      use: [
        {
          loader: 'style-loader'
        },
        {
          loader: 'css-loader',
          options: {
            importLoaders: 2,
            sourceMap: true
          }
        },
        {
          loader: 'resolve-url-loader'
        },
        {
          loader: 'postcss-loader',
          options: {
            sourceMap: true
          }
        }
      ]
    };
  }
};

export default [
  merge(common.legacyConfig, {
    output: {
      filename: path.join('./js', '[name]-legacy.js'),
      publicPath: `${settings.devServerConfig.public()}/`
    },
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: configureDevServer(LEGACY_CONFIG),
    module: {
      rules: [configurePostcssLoader(LEGACY_CONFIG), configureImageLoader(LEGACY_CONFIG)]
    },
    plugins: [new webpack.HotModuleReplacementPlugin()]
  }),
  merge(common.modernConfig, {
    output: {
      filename: path.join('./js', '[name].js'),
      publicPath: `${settings.devServerConfig.public()}/`
    },
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: configureDevServer(MODERN_CONFIG),
    module: {
      rules: [configurePostcssLoader(MODERN_CONFIG), configureImageLoader(MODERN_CONFIG)]
    },
    plugins: [new webpack.HotModuleReplacementPlugin(), new DashboardPlugin(dashboard.setData)]
  })
];
