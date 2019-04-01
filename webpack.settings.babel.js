import { config } from 'dotenv'

config()

export default {
  name: 'Name Project',
  copyright: 'Name Company',
  path: {
    src: {
      base: './src/',
      css: './src/css',
      js: './src/js'
    },
    dist: {
      base: './web/dist/',
      clean: [
        './img',
        './criticalcss',
        './css',
        './js'
      ]
    },
    templates: './templates'
  },
  urls: {},
  vars: {},
  entries: {
    'app': 'app.js'
  },
  copyWebpackConfig: [
    {
      from: '',
      to: ''
    }
  ],
  criticalCssConfig: {
    base: 'web/dist/criticalcss/',
    suffix: '_critical.min.css',
    criticalHeight: 1200,
    criticalWidth: 1200,
    ampPrefix: 'amp_',
    ampCriticalHeight: 19200,
    ampCriticalWidth: 600,
    pages: [
      {}
    ]
  },
  devServerConfig: {
    public: () => process.env.DEVSERVER_PUBLIC || 'http://localhost:8080',
    host: () => process.env.DEVSERVER_HOST || 'localhost',
    poll: () => process.env.DEVSERVER_POLL || false,
    port: () => process.env.DEVSERVER_PORT || 8080,
    https: () => process.env.DEVSERVER_HTTPS || false
  },
  manifestConfig: {
    basePath: ''
  },
  purgeCssConfig: {},
  saveRemoteFileConfig: [
    {
      url: 'https://www.google-analytics.com/analytics.js',
      filepath: 'js/analytics.js'
    }
  ],
  createSymlinkConfig: [
    {
      origin: 'img/favicons/favicon.ico',
      symlink: '../favicon.ico'
    }
  ],
  webappConfig: {
    logo: './src/img/favicon-src.png',
    prefix: 'img/favicons/'
  },
  workboxConfig: {
    swDest: '../sw.js',
    precacheManifestFilename: 'js/precache-manifest.[manifestHash].js',
    importScripts: [
      '/dist/workbox-catch-handler.js'
    ],
    exclude: [
      /\.(png|jpe?g|gif|svg|webp)$/i,
      /\.map$/,
      /^manifest.*\\.js(?:on)?$/
    ],
    globDirectory: './web/',
    globPatterns: [
      'offline.html',
      'offline.svg'
    ],
    offlineGoogleAnalytics: true,
    runtimeCashing: [
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
        handler: 'cacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 20
          }
        }
      }
    ]
  }
}
