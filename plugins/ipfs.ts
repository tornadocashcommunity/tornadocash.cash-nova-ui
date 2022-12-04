import { Plugin } from '@nuxt/types'

import { getIPFSPrefix } from '@/utilities'

const ipfs: Plugin = ({ app }) => {
  const ipfsPathPrefix = getIPFSPrefix()

  if (ipfsPathPrefix) {
    // @ts-expect-error
    __webpack_public_path__ = ipfsPathPrefix + '/_nuxt/'

    if (typeof window !== 'undefined') {
      // @ts-expect-error
      app.router.history.base = ipfsPathPrefix || window.location.host
    }
  }
}

export default ipfs
