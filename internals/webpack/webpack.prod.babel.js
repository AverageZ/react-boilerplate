const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const OfflinePlugin = require('offline-plugin');

module.exports = require('./webpack.base.babel')({
  // In production, we skip all hot-reloading stuff
  entry: [
    path.join(process.cwd(), 'app/app.js'),
  ],

  // Utilize long-term caching by adding content hashes (not compilation hashes) to compiled assets
  output: {
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].chunk.js',
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      children: true,
      minChunks: 2,
      async: true,
    }),

    new webpack.optimize.AggressiveMergingPlugin({
      moveToParents: true,
    }),

    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      output: {
        comments: false,
      },
      sourceMap: false,
    }),

    // Minify and optimize the index.html
    new HtmlWebpackPlugin({
      template: 'app/index.html',
      minify: {
        collapseWhitespace: true,
        keepClosingSlash: true,
        minifyCSS: true,
        minifyJS: true,
        minifyURLs: true,
        removeComments: true,
        removeEmptyAttributes: true,
        removeRedundantAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
      inject: true,
    }),

    // Put it in the end to capture all the HtmlWebpackPlugin's
    // assets manipulations and do leak its manipulations to HtmlWebpackPlugin
    new OfflinePlugin({
      relativePaths: false,
      publicPath: '/',

      // No need to cache .htaccess. See http://mxs.is/googmp,
      // this is applied before any match in `caches` section
      excludes: ['.htaccess'],

      updateStrategy: 'changed',

      ServiceWorker: {
        events: true,
        navigateFallbackURL: '/',
      },

      /*
      * Enables automatic updates of ServiceWorker and AppCache. If set to true,
      * it uses default interval of 1 hour. We've set it to 2 minutes
      * Set a number value to have provide custom update interval.
      */
      autoUpdate: 1000 * 60 * 2,

      caches: {
        main: [':rest:'],

        // All chunks marked as `additional`, loaded after main section
        // and do not prevent SW to install. Change to `optional` if
        // do not want them to be preloaded at all (cached only when first loaded)
        additional: ['*.chunk.js'],
      },

      // Removes warning for about `additional` section usage
      safeToUseOptionalCaches: true,

      AppCache: false,
    }),
  ],

  performance: {
    assetFilter: (assetFilename) => !(/(\.map$)|(^(main\.|favicon\.))/.test(assetFilename)),
  },
});
