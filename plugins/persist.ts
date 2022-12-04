import { Plugin } from '@nuxt/types'

import createPersistedState from 'vuex-persistedstate'

const persist: Plugin = ({ store, isHMR }) => {
  if (isHMR) {
    return
  }

  const paths = [
    'wallet',
    'relayer',
    'gasPrice',
    'transaction',
    'application',
    'account.address',
    'account.balance',
    'account.settings',
    'account.registeredInPoolStatus',
  ]

  createPersistedState({
    key: 'tornado_pool_ui',
    paths,
  })(store)
}

export default persist
