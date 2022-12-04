import { ActionTree, GetterTree, MutationTree } from 'vuex'
import { BigNumber } from 'ethers'

import { ChainId, RootState } from '@/types'
import { GasPriceState, GasPriceMutation } from '@/types/store/gasPrice'

import { getGasPrice, estimateFees } from '@/services'
import { numbers, CHAINS, transactionMethods } from '@/constants'

export const actions: ActionTree<GasPriceState, RootState> = {
  async gasPriceWatcher({ commit, getters, dispatch }) {
    const TIME_OUT = 15

    try {
      const gasPricesL2 = await getGasPrice(getters.dependencies.l2ChainId)
      commit(GasPriceMutation.SET_GAS_PRICES, { ...gasPricesL2, chainId: getters.dependencies.l2ChainId })
    } catch (err) {
      console.log('gasPriceWatcher has error:', err.message)
    } finally {
      setTimeout(() => {
        dispatch('gasPriceWatcher')
      }, TIME_OUT * numbers.SECOND)
    }
  },

  async estimateGasWatcher({ commit, dispatch, getters }) {
    const TIME_OUT = 15

    try {
      if (getters.dependencies.l1ChainId === ChainId.MAINNET) {
        const { maxFeePerGas, maxPriorityFeePerGas, baseFee } = await estimateFees.getCurrentFees()

        commit(GasPriceMutation.SET_BASE_FEE, { baseFee, chainId: ChainId.MAINNET })
        commit(GasPriceMutation.SET_GAS_PARAMS, { maxFeePerGas, maxPriorityFeePerGas, chainId: ChainId.MAINNET })
      } else {
        const gasPricesL1 = await getGasPrice(getters.dependencies.l1ChainId)

        commit(GasPriceMutation.SET_GAS_PRICES, { ...gasPricesL1, chainId: getters.dependencies.l1ChainId })
      }
    } catch (err) {
      console.log('estimateGasWatcher has error: ', err.message)
    } finally {
      setTimeout(() => {
        dispatch('estimateGasWatcher')
      }, TIME_OUT * numbers.SECOND)
    }
  },
}

export const mutations: MutationTree<GasPriceState> = {
  [GasPriceMutation.SET_GAS_PRICES](state, { chainId, ...rest }) {
    // @ts-expect-error
    this._vm.$set(state.prices, chainId, { ...state.prices[chainId], ...rest })
  },
  [GasPriceMutation.SET_BASE_FEE](state, { chainId, ...rest }) {
    // @ts-expect-error
    this._vm.$set(state.baseFee, chainId, rest.baseFee)
  },
  [GasPriceMutation.SET_GAS_PARAMS](state, { chainId, ...rest }) {
    // @ts-expect-error
    this._vm.$set(state.params, chainId, rest)
  },
}

export const getters: GetterTree<GasPriceState, RootState> = {
  currentGasPriceL1: (state: GasPriceState, getters) => {
    if (CHAINS[getters.dependencies.l1ChainId].isEipSupported) {
      return getters.gasParams(getters.dependencies.l1ChainId).maxFeePerGas
    }
    return getters.currentGasPriceById(getters.dependencies.l1ChainId)
  },
  currentGasPriceL2: (state: GasPriceState, getters) => {
    const currentGas = state.prices[getters.dependencies.l2ChainId]
    return BigNumber.from(currentGas[currentGas.selected])._hex
  },
  baseFee: (state: GasPriceState) => (chainId: ChainId) => {
    return state.baseFee[chainId]
  },
  gasPrice: (state: GasPriceState, getters) => {
    const baseFee = state.baseFee[getters.dependencies.l1ChainId]
    if (baseFee) {
      return BigNumber.from(baseFee).mul('130').div(numbers.ONE_HUNDRED)
    }
    return state.prices[getters.dependencies.l1ChainId]
  },
  gasParams: (state: GasPriceState) => (chainId: ChainId) => {
    return state.params[chainId]
  },
  txGasParams: (_, getters) => (chainId: ChainId, method?: string) => {
    if (CHAINS[chainId].isEipSupported) {
      const gasParams = getters.gasParams(chainId)
      if (method === transactionMethods.FUND) {
        const compoundBaseFee = estimateFees.getCompoundBaseFee(getters.baseFee(chainId))
        const maxFeePerGas = compoundBaseFee.add(gasParams.maxPriorityFeePerGas)

        return { maxFeePerGas, maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas }
      }
      return gasParams
    }

    return { gasPrice: getters.currentGasPriceById(chainId) }
  },

  // private
  currentGasPriceById: (state: GasPriceState) => (chainId: ChainId) => {
    const currentGas = state.prices[chainId]
    return BigNumber.from(currentGas[currentGas.selected])._hex
  },
  // another module dependencies
  dependencies: (state, getters, rootState, rootGetters) => {
    return {
      // wallet
      l1ChainId: rootGetters['wallet/l1ChainId'],
      l2ChainId: rootGetters['wallet/l2ChainId'],
    }
  },
}

export const state = () => {
  return {
    params: {
      [ChainId.MAINNET]: {
        maxFeePerGas: '0x25FF7A6000',
        maxPriorityFeePerGas: '0x77359400',
      },
    },
    baseFee: {
      [ChainId.MAINNET]: '0xDF8475800',
    },
    prices: {
      [ChainId.MAINNET]: {
        low: 10,
        fast: 50,
        instant: 80,
        standard: 30,
        selected: 'fast',
      },
      [ChainId.BSC]: {
        low: 10,
        fast: 50,
        instant: 80,
        standard: 30,
        selected: 'fast',
      },
      [ChainId.XDAI]: {
        low: 10,
        fast: 50,
        instant: 80,
        standard: 30,
        selected: 'fast',
      },
    },
  }
}
