import { ActionTree, GetterTree, MutationTree } from 'vuex'

import { ChainId, RootState } from '@/types'
import { WalletMutation, WalletState } from '@/types/store/wallet'

import { getSanctionList } from '@/contracts'
import { toChecksumAddress, stringToHex } from '@/utilities'

import { ens, getProvider, getWalletProvider } from '@/services'
import { CHAINS, errors, METAMASK_LIST, SIGN_MESSAGE, L1_CHAIN_ID } from '@/constants'

export const actions: ActionTree<WalletState, RootState> = {
  async setProvider({ commit, dispatch, state }, params) {
    try {
      commit(WalletMutation.SET_PROVIDER, params)
      await dispatch('checkAppNetwork', params.network)
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async checkSanction({ getters }, address) {
    const contract = getSanctionList(getters.dependencies.l1ChainId)

    const isSanctioned = await contract.callStatic.isSanctioned(address)
    if (isSanctioned) {
      window.onbeforeunload = null
      // ToDo add type
      // @ts-expect-error
      window.location = 'https://twitter.com/TornadoCash/status/1514904975037669386'
    }
  },
  checkAppNetwork({ commit }, network) {
    try {
      // TODO create a selector for active network
      const filteredChain = L1_CHAIN_ID === ChainId.MAINNET ? ChainId.BSC : ChainId.MAINNET
      const availableChains = Object.values(ChainId).filter((id) => id !== filteredChain)

      if (!availableChains.includes(Number(network))) {
        throw new Error(errors.validation.MISMATCH_NETWORK)
      }

      commit(WalletMutation.MISMATCH_NETWORK, false)
    } catch (err) {
      console.error(err.message)
      commit(WalletMutation.MISMATCH_NETWORK, true)
    }
  },

  async checkNetwork({ dispatch, getters }) {
    const provider = getWalletProvider(getters.nameProvider || 'METAMASK')
    const network = await provider.checkNetworkVersion()

    await dispatch('checkAppNetwork', network)
  },

  async getWalletBalance({ commit, dispatch, getters }) {
    try {
      const { provider } = getProvider(getters.chainId)

      if (!getters.walletAddress || getters.mismatchNetwork) {
        return
      }

      const balance = await provider.getBalance(getters.walletAddress)

      commit(WalletMutation.SET_WALLET_BALANCE, balance.toString())
    } catch (err) {
      console.log('getWalletBalance has error:', err.message)
    }
  },

  async setWalletParams({ commit, dispatch }, address) {
    try {
      commit(WalletMutation.SET_WALLET_ADDRESS, address)
      const ensName = await ens.getEnsName(address, ChainId.MAINNET)
      commit(WalletMutation.SET_ENS_NAME, ensName)
      dispatch('getWalletBalance')
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async createWalletTransaction({ getters, commit, dispatch }, { calldata, to, transactionInfo, gas = null, amount = '0x0' }) {
    try {
      const provider = getWalletProvider(getters.nameProvider)

      const params = {
        to,
        value: amount,
        data: calldata,
        from: getters.walletAddress,
        ...getters.dependencies.txGasParams(getters.chainId, transactionInfo.method),
      }

      if (gas) {
        params.gas = gas
      }

      const txHash = await provider.sendRequest<string>({
        method: 'eth_sendTransaction',
        params: [params],
      })

      await dispatch('transaction/transactionWatcher', { txHash, transactionInfo, chainId: getters.chainId }, { root: true })

      return txHash
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async signStartMessage({ getters }, { signingAddress }) {
    try {
      const callParams = {
        method: 'personal_sign',
        params: [stringToHex(SIGN_MESSAGE), signingAddress],
      }

      const provider = getWalletProvider(getters.nameProvider)

      return await provider.sendRequest(callParams)
    } catch (err) {
      throw new Error(`Method personal sign has error: ${err.message}`)
    }
  },

  async changeChain({ getters, dispatch }, chainId) {
    const provider = getWalletProvider(getters.nameProvider)

    try {
      await provider.sendRequest({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAINS[chainId].hexChainId }],
      })
    } catch (error) {
      const parsedError = await dispatch(
        'application/errorHandler',
        { errorMessage: error.message, title: 'Change network' },
        { root: true },
      )

      if (parsedError === errors.wallet.TRY_ADDING_THE_CHAIN) {
        await provider.sendRequest({
          method: 'wallet_addEthereumChain',
          params: [METAMASK_LIST[chainId]],
        })
      }
    } finally {
      // TODO check the number of requests for this function
      dispatch('getWalletBalance')
    }
  },
}

export const getters: GetterTree<WalletState, RootState> = {
  mismatchNetwork: (state: WalletState) => {
    return state.provider.mismatchNetwork
  },
  nameProvider: (state: WalletState) => {
    return state.provider.name
  },
  walletEnsName: (state: WalletState) => {
    return state.account.ensName
  },
  isConnected: (state: WalletState) => {
    return state.provider.isConnected
  },
  chainId: (state: WalletState) => {
    return Number(state.provider.network)
  },
  isL1Chain: (state: WalletState, getters) => {
    return Number(state.provider.network) === getters.l1ChainId
  },
  isL2Chain: (state: WalletState, getters) => {
    return Number(state.provider.network) === getters.l2ChainId
  },
  l1ChainId: (state: WalletState) => {
    return state.provider.l1ChainId
  },
  l2ChainId: (state: WalletState) => {
    return state.provider.l2ChainId
  },
  chainConfig: (state: WalletState) => {
    return CHAINS[state.provider.l1ChainId]
  },
  walletAddress: (state: WalletState) => {
    return state.account.address
  },
  walletBalance: (state: WalletState) => {
    return state.account.balance
  },
  // another module dependencies
  dependencies: (state, getters, rootState, rootGetters) => {
    return {
      // gasPrice
      txGasParams: rootGetters['gasPrice/txGasParams'],
      // wallet
      l1ChainId: rootGetters['wallet/l1ChainId'],
    }
  },
}

export const mutations: MutationTree<WalletState> = {
  [WalletMutation.SET_WALLET_ADDRESS](state, payload) {
    state.account.address = toChecksumAddress(payload)
  },
  [WalletMutation.SET_ENS_NAME](state, payload) {
    state.account.ensName = payload
  },
  [WalletMutation.SET_WALLET_BALANCE](state, payload) {
    state.account.balance = payload
  },
  [WalletMutation.MISMATCH_NETWORK](state, payload) {
    state.provider.mismatchNetwork = payload
  },
  [WalletMutation.SET_PROVIDER](state, { network, name }) {
    state.provider = {
      ...state.provider,
      name,
      network,
      mismatchNetwork: false,
    }
  },
  [WalletMutation.SET_PROVIDER_CONNECTION](state, isConnected) {
    // @ts-expect-error
    this._vm.$set(state.provider, 'isConnected', isConnected)
  },
  [WalletMutation.CLEAR_PROVIDER](state) {
    state.provider = {
      name: '',
      network: L1_CHAIN_ID,
      l1ChainId: L1_CHAIN_ID,
      l2ChainId: ChainId.XDAI,
      isConnected: false,
      mismatchNetwork: false,
    }
    state.account = {
      address: '',
      ensName: '',
      balance: 0,
    }
  },
}

export const state = () => {
  return {
    provider: {
      name: '',
      network: L1_CHAIN_ID,
      l1ChainId: L1_CHAIN_ID,
      l2ChainId: ChainId.XDAI,
      isConnected: false,
      mismatchNetwork: false,
    },
    account: {
      ensName: '',
      address: '',
      balance: 0,
    },
  }
}
