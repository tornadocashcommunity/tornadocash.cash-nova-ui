# tornado-new

## Build Setup

If you use the latest Node.js version, you should modify your NODE_OPTIONS env

```bash
export NODE_OPTIONS="--openssl-legacy-provider"
```

```bash
# install dependencies
$ yarn install

# build for production and launch server
$ yarn build
$ yarn start

# generate static project
$ yarn generate

# serve with hot reload at localhost:3000
# should do yarn build first if worker files are changed
$ yarn dev

# update cached events from node & subgraphs
$ yarn update:events
```

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).
