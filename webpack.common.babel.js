import path from 'path'
import merge from 'webpack-merge'

import CopyWebpackPlugin from 'copy-webpack-plugin'
import ManifestPlugin from 'webpack-manifest-plugin'
import WebpackNotifierPlugin from 'webpack-notifier'

import pkg from './package.json'
import settings from './webpack.settings.babel'

const LEGACY_CONFIG = 'legacy'
const MODERN_CONFIG = 'modern'

const configureEntries = () => {
  let entries = {}
  for (const [key, value] of Object.entries(settings.entries)) {
    entries[key] = path.resolve(__dirname, settings.paths.src.js + value)
  }

  return entries
}

const configureBabelLoader = (browserslist) => {
  return {
    test: /\.js$/,
    exclude: '/node_modules/',
    use: {
      loader: 'babel-loader',
      options: {
        presets: [
          [
            '@babel/preset-env', {
              modules: false,
              useBuiltIns: 'entry',
              corejs: '3.0.0',
              targets: {
                browsers: browserslist
              }
            }
          ]
        ],
        plugins: [
          '@babel/plugin-syntax-dynamic-import',
          [
            '@babel/plugin-transform-runtime', {
              'regenerator': true,
              useESModules: true
            }
          ]
        ]
      }
    }
  }
}

const configureFont = () => {
  // Example imports fonts
  // import comicsans from '../fonts/ComicSans.woff2';
  return {
    test: /\.(ttf|eot|woff2?)$/i,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      }
    ]
  }
}

const configureManifest = (fileName) => {
  return {
    fileName: fileName,
    basePath: settings.manifestConfig.basePath,
    map: (file) => {
      file.name = file.name.replace(/(\.[a-f0-9]{32})(\..*)$/, '$2')
      return file
    }
  }
}

const baseConfig = {
  name: pkg.name,
  entry: configureEntries(),
  output: {
    path: path.resolve(__dirname, settings.paths.dist.base),
    publicPath: settings.urls.publicPath()
  },
  resolve: {},
  module: {},
  plugins: [
    new WebpackNotifierPlugin({ title: 'Webpack', excludeWarnings: true, alwaysNotify: true })
  ]
}

const legacyConfig = {
  module: {
    rules: [
      configureBabelLoader(Object.values(pkg.browserslist.legacyBrowsers))
    ]
  },
  plugins: [
    new CopyWebpackPlugin(
      settings.copyWebpackConfig
    ),
    new ManifestPlugin(
      configureManifest('manifest-legacy.json')
    )
  ]
}

const modernConfig = {
  module: {
    rules: [
      configureBabelLoader(Object.values(pkg.browserslist.modernBrowsers))
    ]
  },
  plugins: [
    new ManifestPlugin(
      configureManifest('manifest.json')
    )
  ]
}

export default {
  'legacyConfig': merge.strategy({
    module: 'prepend',
    plugins: 'prepend'
  })(baseConfig, legacyConfig),
  'modernConfig': merge.strategy({
    module: 'prepend',
    plugins: 'prepend'
  })(baseConfig, modernConfig)
}
