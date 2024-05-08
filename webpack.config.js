import path from 'path'
import webpack from 'webpack'

export default [
  {
    mode: 'production',
    entry: './assets/events.worker.js',
    module: {
      rules: [
        {
          test: /\.(tsx|ts)?$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.worker.json'
            }
          }
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      path: path.resolve('static'),
      filename: 'events.worker.js',
    }
  },
  {
    mode: 'production',
    entry: './assets/nullifier.worker.js',
    module: {
      rules: [
        {
          test: /\.(tsx|ts)?$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.worker.json'
            }
          }
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
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