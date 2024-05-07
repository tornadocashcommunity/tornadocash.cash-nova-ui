import path from 'path'

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
  }
]