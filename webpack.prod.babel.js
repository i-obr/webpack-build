import path from 'path';
import git from 'git-rev-sync';
import glob from 'glob-all';
import merge from 'webpack-merge';
import webpack from 'webpack';
import moment from 'moment';

import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import CleanWebpackPlugin from 'clean-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
import CreateSymlinkPlugin from 'create-symlink-webpack-plugin';
// import CriticalCssPlugin from 'critical-css-webpack-plugin';
import HtmlCriticalWebpackPlugin from 'html-critical-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ImageminWebpWebpackPlugin from 'imagemin-webp-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import PurgecssPlugin from 'purgecss-webpack-plugin';
import SaveRemoteFilePlugin from 'save-remote-file-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import WebappWebpackPlugin from 'webapp-webpack-plugin';
import WhitelisterPlugin from 'purgecss-whitelister';
import WorkboxPlugin from 'workbox-webpack-plugin';
import zopfli from '@gfx/zopfli';
import imageminGifsicle from 'imagemin-gifsicle';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminOptipng from 'imagemin-optipng';
import imageminSvgo from 'imagemin-svgo';

import common from './webpack.common.babel';
import pkg from './package.json';
import settings from './webpack.settings.babel';

const LEGACY_CONFIG = 'legacy';
const MODERN_CONFIG = 'modern';

const configureBanner = () => {
  return {
    banner: [
      '/*!',
      ` * @project        ${settings.name}`,
      ` * @name           ${'[filebase]'}`,
      ` * @author         ${pkg.author.name}`,
      ` * @build          ${moment().format('llll')} ET`,
      ` * @release        ${git.long()} [${git.branch()}]`,
      ` * @copyright      Copyright (c) ${moment().format('YYYY')} ${settings.copyright}`,
      ' *',
      ' */',
      ''
    ].join('\n'),
    raw: true
  };
};

const configureBundleAnalyzer = buildType => {
  if (buildType === LEGACY_CONFIG) {
    return {
      analyzerMode: 'static',
      reportFilename: 'report-legacy.html'
    };
  }
  if (buildType === MODERN_CONFIG) {
    return {
      analyzerMode: 'static',
      reportFilename: 'report-modern.html'
    };
  }
};

const configureCriticalCss = () => {
  return settings.criticalCssConfig.pages.map(row => {
    const criticalSrc = settings.urls.critical + row.url;
    const criticalDest =
      settings.criticalCssConfig.base + row.template + settings.criticalCssConfig.suffix;
    const { criticalWidth } = settings.criticalCssConfig;
    const { criticalHeight } = settings.criticalCssConfig;

    console.log(`source: ${criticalSrc} dest: ${criticalDest}`);

    return new HtmlCriticalWebpackPlugin({
      base: './',
      src: criticalSrc,
      dest: criticalDest,
      extract: false,
      inline: false,
      minify: true,
      width: criticalWidth,
      height: criticalHeight
    });
  });
};

const configureCleanWebpack = () => {
  return {
    root: path.resolve(__dirname, settings.paths.dist.base),
    verbose: true,
    dry: false
  };
};

const configureCompression = () => {
  return {
    filename: '[path].gz[query]',
    test: /\.(js|css|html|svg)$/,
    threshold: 10240,
    minRatio: 0.8,
    deleteOriginalAssets: false,
    compressionOptions: {
      numiterations: 15,
      level: 9
    },
    algorithm(input, compressionOptions, callback) {
      return zopfli.gzip(input, compressionOptions, callback);
    }
  };
};

const configureHtml = () => {
  return {
    templateContent: '',
    filename: 'webapp.html',
    inject: false
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
        },
        {
          loader: 'img-loader',
          options: {
            plugins: [
              imageminGifsicle({
                interlaced: true
              }),
              imageminMozjpeg({
                progressive: true,
                arithmetic: false
              }),
              imageminOptipng({
                optimizationLevel: 5
              }),
              imageminSvgo({
                plugins: [{ convertPathData: false }]
              })
            ]
          }
        }
      ]
    };
  }
};

const configureTerser = () => {
  return {
    cache: true,
    parallel: true,
    sourceMap: true
  };
};

const configureOptimization = buildType => {
  if (buildType === LEGACY_CONFIG) {
    return {
      splitChunks: {
        cacheGroups: {
          default: false,
          common: false,
          styles: {
            name: settings.vars.cssName,
            test: /\.(pcss|css|vue)$/,
            chunks: 'all',
            enforce: true
          }
        }
      },
      minimizer: [
        new TerserPlugin(configureTerser()),
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            map: {
              inline: false,
              annotation: true
            },
            safe: true,
            discardComments: true
          }
        })
      ]
    };
  }
  if (buildType === MODERN_CONFIG) {
    return {
      minimizer: [new TerserPlugin(configureTerser())]
    };
  }
};

const configurePostcssLoader = buildType => {
  if (buildType === LEGACY_CONFIG) {
    return {
      test: /\.(pcss|css)$/,
      use: [
        MiniCssExtractPlugin.loader,
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

  if (buildType === MODERN_CONFIG) {
    return {
      test: /\.(pcss|css)$/,
      loader: 'ignore-loader'
    };
  }
};

const configurePurgeCss = () => {
  const paths = [];

  Object.entries(settings.purgeCssConfig.paths).forEach(([, value]) => {
    paths.push(path.join(__dirname, value));
  });

  return {
    paths: glob.sync(paths),
    whitelist: WhitelisterPlugin(settings.purgeCssConfig.whitelist),
    whitelistPatterns: settings.purgeCssConfig.whitelistPatterns,
    extractors: [
      {
        extensions: settings.purgeCssConfig.extensions
      }
    ]
  };
};

const configureWebapp = () => {
  return {
    logo: settings.webappConfig.logo,
    prefix: settings.webappConfig.prefix,
    cache: false,
    inject: 'force',
    favicons: {
      appName: pkg.name,
      appDescription: pkg.description,
      developerName: pkg.author.name,
      developerURL: pkg.author.url,
      path: settings.paths.dist.base
    }
  };
};

const configureWorkbox = () => {
  const config = settings.workboxConfig;

  return config;
};

export default [
  merge(common.legacyConfig, {
    output: {
      filename: path.join('./js', '[name]-legacy.[chunkhash].js')
    },
    mode: 'production',
    devtool: 'source-map',
    optimization: configureOptimization(LEGACY_CONFIG),
    module: {
      rules: [configurePostcssLoader(LEGACY_CONFIG), configureImageLoader(LEGACY_CONFIG)]
    },
    plugins: [
      new CleanWebpackPlugin(configureCleanWebpack()),
      new MiniCssExtractPlugin({
        path: path.resolve(__dirname, settings.paths.dist.base),
        filename: path.join('./css', '[name].[chunkhash].css')
      }),
      new PurgecssPlugin(configurePurgeCss()),
      new webpack.BannerPlugin(configureBanner()),
      new HtmlWebpackPlugin(configureHtml()),
      new WebappWebpackPlugin(configureWebapp()),
      new CreateSymlinkPlugin(settings.createSymlinkConfig, true),
      new SaveRemoteFilePlugin(settings.saveRemoteFileConfig),
      new CompressionPlugin(configureCompression()),
      new BundleAnalyzerPlugin(configureBundleAnalyzer(LEGACY_CONFIG))
    ].concat(configureCriticalCss())
  }),
  merge(common.modernConfig, {
    output: {
      filename: path.join('./js', '[name].[chunkhash].js')
    },
    mode: 'production',
    devtool: 'source-map',
    optimization: configureOptimization(MODERN_CONFIG),
    module: {
      rules: [configurePostcssLoader(MODERN_CONFIG), configureImageLoader(MODERN_CONFIG)]
    },
    plugins: [
      new webpack.optimize.ModuleConcatenationPlugin(),
      new webpack.BannerPlugin(configureBanner()),
      new ImageminWebpWebpackPlugin(),
      new WorkboxPlugin.GenerateSW(configureWorkbox()),
      new CompressionPlugin(configureCompression()),
      new BundleAnalyzerPlugin(configureBundleAnalyzer(MODERN_CONFIG))
    ]
  })
];
