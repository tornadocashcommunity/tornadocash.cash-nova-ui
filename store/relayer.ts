import { ActionTree, GetterTree, MutationTree } from 'vuex'

import { ChainId, RootState } from '@/types'
import { RelayerMutation, RelayerState, WatcherCallbackParams, Relayer } from '@/types/store/relayer'

import { fromWei, toChecksumAddress, toWei } from '@/utilities'
import { errors, numbers, BG_ZERO, jobStatuses, relayersTypes, transactionTitles, transactionMethods, CHAINS } from '@/constants'
import {
  Utxo,
  Keypair,
  getProvider,
  getRateToEth,
  relayerWatcher,
  eventService,
  relayerService,
  createTransactionData,
} from '@/services'

export const actions: ActionTree<RelayerState, RootState> = {
  async prepareWithdrawal({ getters, dispatch }, { amount, address, l1Fee }) {
    try {
      const etherAmount = toWei(amount)

      if (!getters.currentRelayer) {
        throw new Error(errors.validation.RELAYER_METHODS_NOT_AVAILABLE)
      }

      const amountWithFee = etherAmount.add(l1Fee)
      const relayerFee = getters.dependencies.operationFee(amountWithFee, 'withdraw')

      const amountWithBridgeAndRelayerFee = amountWithFee.add(relayerFee)

      const { unspentUtxo, totalAmount, senderKeyPair } = await dispatch(
        'account/getUserAccountInfo',
        {
          amount: amountWithBridgeAndRelayerFee,
        },
        { root: true },
      )

      if (totalAmount.lt(amountWithBridgeAndRelayerFee)) {
        throw new Error(`${errors.validation.INSUFFICIENT_FUNDS} ${fromWei(totalAmount)}`)
      }

      const outputs = [new Utxo({ amount: totalAmount.sub(amountWithBridgeAndRelayerFee), keypair: senderKeyPair })]

      const { args, extData } = await createTransactionData(
        {
          l1Fee,
          outputs,
          fee: relayerFee,
          inputs: unspentUtxo,
          recipient: toChecksumAddress(address),
          relayer: toChecksumAddress(getters.currentRelayer.rewardAddress),
        },
        senderKeyPair,
      )

      return { args, extData }
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async withdrawal({ getters, dispatch }, { amount, address }) {
    try {
      const { args, extData } = await dispatch('prepareTransfer', { address, amount })

      return await dispatch('createRelayerTransaction', {
        args,
        extData,
        transactionInfo: {
          amount,
          type: transactionTitles.WITHDRAW,
          method: transactionMethods.WITHDRAW,
          account: getters.dependencies.accountAddress,
        },
      })
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async prepareTransfer({ getters, dispatch }, { amount, address }) {
    try {
      const etherAmount = toWei(amount)
      const recipientAddress = await eventService.getAccountAddress(address)

      if (!recipientAddress) {
        throw new Error(errors.validation.NOT_REGISTERED_IN_POOL)
      }

      if (!getters.currentRelayer) {
        throw new Error(errors.validation.RELAYER_METHODS_NOT_AVAILABLE)
      }

      const fee = getters.dependencies.operationFee(etherAmount, 'transfer')

      const amountWithFee = etherAmount.add(fee)

      const { unspentUtxo, totalAmount, senderKeyPair } = await dispatch(
        'account/getUserAccountInfo',
        { amount: amountWithFee },
        { root: true },
      )

      if (totalAmount.lt(amountWithFee)) {
        throw new Error(`${errors.validation.INSUFFICIENT_FUNDS} ${fromWei(totalAmount)}`)
      }

      const senderChangeUtxo = new Utxo({
        keypair: senderKeyPair,
        amount: totalAmount.sub(amountWithFee).toString(),
      })

      const recipientUtxo = new Utxo({
        amount: etherAmount,
        keypair: Keypair.fromString(recipientAddress),
      })

      const outputs = totalAmount.sub(etherAmount).eq(numbers.ZERO) ? [recipientUtxo] : [recipientUtxo, senderChangeUtxo]

      const { args, extData } = await createTransactionData(
        {
          fee,
          outputs,
          inputs: unspentUtxo,
          relayer: toChecksumAddress(getters.currentRelayer.rewardAddress),
        },
        senderKeyPair,
      )

      return { args, extData }
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async mergeInputs({ getters, dispatch }) {
    try {
      const senderKeyPair = await dispatch('account/getAccountKeypair', {}, { root: true })
      const { unspentUtxo } = await dispatch('account/getUtxoFromKeypair', { keypair: senderKeyPair }, { root: true })

      const inputs = unspentUtxo.slice(numbers.ZERO, numbers.INPUT_LENGTH_16)

      // @ts-expect-error TODO type
      const amount = inputs.reduce((acc, curr) => acc.add(curr.amount), BG_ZERO)

      const fee = getters.dependencies.operationFee(amount, 'transfer')

      await dispatch('transfer', { address: getters.dependencies.accountAddress, amount: fromWei(amount.sub(fee)) })
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async transfer({ dispatch, getters }, { amount, address }) {
    try {
      const { args, extData } = await dispatch('prepareTransfer', { address, amount })

      return await dispatch('createRelayerTransaction', {
        args,
        extData,
        transactionInfo: {
          amount,
          type: transactionTitles.TRANSFER,
          method: transactionMethods.TRANSFER,
          account: getters.dependencies.accountAddress,
        },
      })
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async createRelayerTransaction({ dispatch, getters }, { transactionInfo, args, extData }) {
    try {
      const { url } = getters.currentRelayer
      const { jobUrl, id } = await relayerService.createJob({ params: { extData, args }, url })

      return await dispatch('jobWatcher', { transactionInfo, jobUrl, id })
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async jobWatcher({ commit, dispatch, getters }, { jobUrl, id, transactionInfo }) {
    try {
      const callback = async ({ id: jobId, status, txHash, error }: WatcherCallbackParams) => {
        if (getters.isActiveJobChanged(status, txHash)) {
          commit(RelayerMutation.UPDATE_ACTIVE_JOB, { ...transactionInfo, error, jobUrl, txHash, id: jobId, status })
        }

        if (status === jobStatuses.MINED || status === jobStatuses.CONFIRMED) {
          commit(RelayerMutation.FINISH_ACTIVE_JOB)
          await dispatch(
            'transaction/transactionWatcher',
            {
              txHash,
              transactionInfo,
              chainId: getters.dependencies.l2ChainId,
            },
            { root: true },
          )
        }

        if (status === jobStatuses.FAILED) {
          commit(RelayerMutation.FINISH_ACTIVE_JOB)
          throw new Error(error)
        }
      }

      return await relayerWatcher.startWatcher({ url: jobUrl, callback, id })
    } catch (err) {
      commit(RelayerMutation.FINISH_ACTIVE_JOB)
      throw new Error(err.message)
    }
  },

  async checkActiveJob({ dispatch, getters }) {
    try {
      if (!getters.activeJob) {
        return
      }

      return await dispatch('jobWatcher', getters.activeJob)
    } catch (err) {
      throw new Error(err)
    }
  },

  async getRelayer({ dispatch }, { ensName, url }) {
    try {
      return await relayerService.getStatus({ ensName, url })
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async getRegisteredRelayers() {
    try {
      const { provider } = getProvider(ChainId.MAINNET)
      const registeredRelayers = await relayerService.relayerRegister(provider).getRelayers(CHAINS[ChainId.XDAI].ensSubdomainKey)
      return registeredRelayers
    } catch (err) {
      throw new Error(`Get registered relayers error: ${err.message}`)
    }
  },
  async getRelayers({ dispatch, commit, getters }, type) {
    try {
      commit(RelayerMutation.SET_RELAYERS_FETCHING, true)
      const list = await dispatch('getRegisteredRelayers')
      const promiseArray = []
      for await (const { hostname, ensName } of list) {
        const relayer = dispatch('getRelayer', { url: hostname, ensName })
        promiseArray.push(relayer)
      }
      const settledPromises = await Promise.allSettled(promiseArray)
      const relayerStatusChecker = (acc: Relayer[], result: PromiseSettledResult<Relayer>) => {
        if (result.status === 'fulfilled') {
          acc.push({ ...result.value, type: relayersTypes.REGULAR })
        }
        return acc
      }

      const relayers = settledPromises.reduce(relayerStatusChecker, [])
      console.log('Valid relayers: ', relayers)
      const activeRelayer = relayerService.getRandomRelayer(relayers, type)
      if (getters.customRelayer) {
        relayers.push({ ...getters.customRelayer, type: relayersTypes.CUSTOM })
      }

      commit(RelayerMutation.SET_RELAYERS, relayers)
      commit(RelayerMutation.SET_ACTIVE_RELAYER, activeRelayer || getters.customRelayer)
    } catch (err) {
      console.error('getRelayers has error:', err.message)
    } finally {
      commit(RelayerMutation.SET_RELAYERS_FETCHING, false)
    }
  },

  async ethRateWatcher({ dispatch, commit }) {
    const TIME_OUT = 15
    const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f'

    try {
      const ethPriceRate = await getRateToEth(DAI_ADDRESS)
      commit(RelayerMutation.SET_ETH_RATE, ethPriceRate.toString())
    } catch (err) {
      console.log('ethRateWatcher has error:', err.message)
    } finally {
      setTimeout(() => {
        dispatch('ethRateWatcher')
      }, TIME_OUT * numbers.SECOND)
    }
  },
}

export const getters: GetterTree<RelayerState, RootState> = {
  customRelayer: (state: RelayerState) => {
    return state.relayers.list.find(({ type }) => type === relayersTypes.CUSTOM)
  },
  currentRelayer: (state: RelayerState) => {
    const { list, selected } = state.relayers
    const relayer = list.find(({ url, ensName, type }) => {
      const isSelected = url === selected.url || (selected.ensName && selected.ensName === ensName)

      return isSelected && type === selected.type
    })

    if (!relayer) {
      return {
        chainId: 100,
        serviceFee: {
          transfer: '0',
          withdrawal: 0,
        },
        rewardAddress: '',
        ensName: '',
      }
    }

    return relayer
  },
  relayersList: (state: RelayerState) => {
    return state.relayers.list
  },

  isActiveJobChanged: (state: RelayerState) => (newStatus: jobStatuses, newHash?: string) => {
    if (!state.jobs.activeJob) {
      return true
    }
    const { status, txHash } = state.jobs.activeJob
    return status !== newStatus || txHash !== newHash
  },
  activeJob: (state: RelayerState) => {
    return state.jobs.activeJob
  },

  ethRate: (state: RelayerState) => {
    return state.ethRate
  },

  isRelayersFetching: (state: RelayerState) => {
    return state.loaders.relayersFetching
  },

  // another module dependencies
  dependencies: (state: RelayerState, getters, rootState, rootGetters) => {
    return {
      // account
      accountAddress: rootGetters['account/accountAddress'],
      // wallet
      l1ChainId: rootGetters['wallet/l1ChainId'],
      l2ChainId: rootGetters['wallet/l2ChainId'],
      // application
      l1Fee: rootGetters['application/l1Fee'],
      operationFee: rootGetters['application/operationFee'],
    }
  },
}

export const mutations: MutationTree<RelayerState> = {
  [RelayerMutation.SET_RELAYERS](state, payload) {
    state.relayers.list = payload
  },
  [RelayerMutation.SET_RELAYERS_FETCHING](state, payload) {
    state.loaders.relayersFetching = payload
  },
  [RelayerMutation.EDIT_RELAYERS_LIST](state, payload) {
    const relayersList = state.relayers.list.filter((r) => r.type !== relayersTypes.CUSTOM)
    relayersList.push(payload)

    // @ts-expect-error
    this._vm.$set(state.relayers, 'list', relayersList)
  },
  [RelayerMutation.SET_ACTIVE_RELAYER](state, payload) {
    state.relayers.selected = payload
  },
  [RelayerMutation.UPDATE_ACTIVE_JOB](state, payload) {
    state.jobs.activeJob = payload
  },
  [RelayerMutation.FINISH_ACTIVE_JOB](state) {
    state.jobs.activeJob = null
  },
  [RelayerMutation.SET_ETH_RATE](state, payload) {
    state.ethRate = payload
  },
}

export const state = (): RelayerState => {
  return {
    ethRate: '1',
    loaders: {
      relayersFetching: false,
    },
    relayers: {
      list: [],
      selected: {
        name: '',
        ensName: '',
        url: '',
        chainId: numbers.ONE_HUNDRED,
        version: '',
        rewardAddress: '',
        type: '',
        health: {
          status: false,
          error: '',
        },
        serviceFee: {
          transfer: '',
          withdrawal: numbers.ZERO,
        },
      },
    },
    jobs: {
      activeJob: null,
    },
  }
}
