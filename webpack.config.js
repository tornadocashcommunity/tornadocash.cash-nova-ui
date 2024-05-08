import path from 'path'
import webpack from 'webpack'

export default [
  {
    mode: 'production',
    entry: './assets/events.worker.js',
    output: {
      path: path.resolve('static'),
      filename: 'events.worker.js',
    }
  },
  {
    mode: 'production',
    entry: './assets/nullifier.worker.js',
    output: {
      path: path.resolve('static'),
      filename: 'nullifier.worker.js',
    }
  },
  {
    mode: 'production',
    entry: './assets/syncEvents.js',
    output: {
      path: path.resolve('.'),
      filename: 'syncEvents.cjs',
    },
    target: 'node',
    plugins: [
      new webpack.BannerPlugin({
        banner: '#!/usr/bin/env node\n',
        raw: true
      })
    ],
    module: {
      rules: [
        {
          test: /\.mjs$/,
          include: /node_modules/,
          type: 'javascript/auto'
        }
      ]
    },
    resolve: {
      alias: {
        'fflate': 'fflate/esm'
      }
    },
    optimization: {
      minimize: false,
    }
  }
]