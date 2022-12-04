import { ActionTree, GetterTree, MutationTree } from 'vuex'
import { BigNumber, utils } from 'ethers'

import { ChainId, CheckIncomingUtxoInput, CheckUnspentUtxoInput, RootState, Transaction } from '@/types'

import { getBridgeHelper, getTornadoPool } from '@/contracts'
import { ens, Utxo, Keypair, toFixedHex, utxoFactory, eventService, privateStorage, createTransactionData } from '@/services'
import { UnspentUtxoData } from '@/services/utxoService/@types'

import {
  errors,
  numbers,
  BG_ZERO,
  txStatuses,
  SIGN_MESSAGE,
  POOL_CONTRACT,
  transferMethods,
  registerStatuses,
  transactionTitles,
  transactionMethods,
  SESSION_STORAGE_KEY,
} from '@/constants'

import { AccountState, AccountMutation } from '@/types/store/account'

import {
  toWei,
  fromWei,
  toChecksumAddress,
  encodeTransactData,
  encodeWrapAndRelayData,
  generatePrivateKeyFromEntropy,
} from '@/utilities'
import { NullifierEvents } from '~/services/events/@types'

export const actions: ActionTree<AccountState, RootState> = {
  async setAccountParams({ commit, dispatch, getters }, address) {
    try {
      const keypair = await dispatch('getKeypairFromStorage')

      if (!keypair) {
        await dispatch('generateKeypairFromSign', { address })
      }

      if (address !== getters.accountAddress || !getters.isRegisteredInPool) {
        const ensName = await ens.getEnsName(address, ChainId.MAINNET)
        commit(AccountMutation.SET_ENS_NAME, ensName)
        commit(AccountMutation.SET_ACCOUNT_ADDRESS, address)
        dispatch('checkRegisterInPool', address)
      } else {
        dispatch('getAccountBalance')
      }
    } catch (err) {
      throw new Error(err.message)
    }
  },

  setIncomingTransaction({ state, getters, dispatch }, { incomingAmount, transactionHash }) {
    try {
      const isPendingTxExist = getters.dependencies.pendingTxs.find(
        (pending: Transaction) => pending.transactionHash.toLowerCase() === transactionHash.toLowerCase(),
      )
      const isExistTx = isPendingTxExist || getters.dependencies.transactions(transactionHash.toLowerCase())

      if (isExistTx) {
        return
      }

      const transaction = {
        from: '',
        transactionHash,
        timestamp: Date.now(),
        account: state.address,
        confirmations: numbers.ONE,
        status: txStatuses.SUCCESS,
        amount: fromWei(incomingAmount),
        recipient: getters.accountAddress,
        type: transactionTitles.INCOMING_FUND,
        chainId: getters.dependencies.l2ChainId,
      }

      dispatch('transaction/setTransaction', transaction, { root: true })
    } catch (err) {
      throw new Error(`Method updateAccountBalance has error: ${err.message}`)
    }
  },

  async checkIncomingUtxo({ dispatch, getters }, { utxo, commitments }: CheckIncomingUtxoInput) {
    try {
      const utxoService = utxoFactory.getService(getters.dependencies.l2ChainId, getters.accountAddress)
      const nullifiers: NullifierEvents = await utxoService.getNullifierEventsFromTxHash(utxo.transactionHash)

      const senderNullifiers = nullifiers.filter((n) =>
        commitments.find((c) => toFixedHex(c.nullifier) === toFixedHex(n.nullifier)),
      )

      if (!senderNullifiers?.length) {
        await dispatch('setIncomingTransaction', {
          incomingAmount: utxo.amount,
          transactionHash: utxo.transactionHash,
        })
      }
    } catch (err) {
      console.error('Method checkIncomingUtxo for ', utxo.transactionHash, 'has error', err.message)
    }
  },

  checkUnspentUtxo({ dispatch }, { unspentUtxo, decryptedEvents }: CheckUnspentUtxoInput) {
    try {
      // eslint-disable-next-line
      unspentUtxo.forEach((utxo) => dispatch('checkIncomingUtxo', { utxo, commitments: decryptedEvents }))
    } catch (err) {
      console.error('Method checkUnspentUtxo has error', err.message)
    }
  },

  async getUtxoFromKeypair({ dispatch, getters, commit }, { keypair, withCache }) {
    try {
      if (!getters.accountAddress) {
        return { unspentUtxo: [], totalAmount: BG_ZERO }
      }
      const utxoService = utxoFactory.getService(getters.dependencies.l2ChainId, getters.accountAddress)
      const { totalAmount, unspentUtxo, freshUnspentUtxo, freshDecryptedEvents } = await utxoService.fetchUnspentUtxo({
        keypair,
        withCache,
        accountAddress: getters.accountAddress,
        callbacks: {
          update: (payload: UnspentUtxoData) => {
            if (payload.accountAddress === getters.accountAddress) {
              commit(AccountMutation.UPDATE_ACCOUNT_BALANCE, payload.totalAmount.toString())
            }
          },
          set: (payload: UnspentUtxoData) => {
            if (payload.accountAddress === getters.accountAddress) {
              commit(AccountMutation.SET_ACCOUNT_BALANCE, payload.totalAmount.toString())
            }
          },
        },
      })

      if (freshUnspentUtxo.length) {
        dispatch('checkUnspentUtxo', { unspentUtxo: freshUnspentUtxo, decryptedEvents: freshDecryptedEvents })
      }

      return { unspentUtxo, totalAmount }
    } catch (err) {
      throw new Error(`Method getUtxoFromKeypair has error: ${err.message}`)
    }
  },

  async accountBalanceWatcher({ getters, dispatch }) {
    try {
      const keypair = await dispatch('getKeypairFromStorage')

      if (!keypair || getters.dependencies.isProcessingStarted) {
        return
      }

      await dispatch('getUtxoFromKeypair', { keypair, withCache: false })
    } finally {
      setTimeout(() => {
        dispatch('accountBalanceWatcher')
      }, numbers.GET_EVENTS_TIMEOUT)
    }
  },

  async getAccountBalance({ commit, dispatch }) {
    let error = ''
    try {
      commit(AccountMutation.SET_IS_BALANCE_FETCHING, true)
      const keypair = await dispatch('getKeypairFromStorage')

      if (!keypair) {
        return
      }

      await dispatch('getUtxoFromKeypair', { keypair })
    } catch (err) {
      error = err.message
      throw new Error(`Method getAccountBalance has error: ${error}`)
    } finally {
      if (!error || !error.includes('Account was changed')) {
        commit(AccountMutation.SET_IS_BALANCE_FETCHING, false)
      } else {
        error = ''
      }
    }
  },

  async mergeInputs({ getters, dispatch }) {
    try {
      const senderKeyPair = await dispatch('getAccountKeypair')
      const { unspentUtxo } = await dispatch('getUtxoFromKeypair', { keypair: senderKeyPair })

      const inputs = unspentUtxo.slice(numbers.ZERO, numbers.INPUT_LENGTH_16)

      // @ts-expect-error TODO type
      const amount = inputs.reduce((acc, curr) => acc.add(curr.amount), BG_ZERO)

      await dispatch('createTransfer', { address: getters.accountAddress, amount: fromWei(amount) })
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async getUserAccountInfo({ dispatch }, { amount }) {
    try {
      const senderKeyPair = await dispatch('getAccountKeypair')
      const { unspentUtxo } = await dispatch('getUtxoFromKeypair', { keypair: senderKeyPair })

      const result = []
      let requiredAmount = BG_ZERO

      for (const utxo of unspentUtxo) {
        if (requiredAmount.lt(amount) && result.length < numbers.INPUT_LENGTH_16) {
          requiredAmount = requiredAmount.add(utxo.amount)
          result.push(utxo)
        } else if (
          requiredAmount.gte(amount) &&
          result.length > numbers.INPUT_LENGTH_2 &&
          result.length < numbers.INPUT_LENGTH_16
        ) {
          requiredAmount = requiredAmount.add(utxo.amount)
          result.push(utxo)
        } else {
          break
        }
      }

      if (unspentUtxo.length !== result.length && result.length === numbers.INPUT_LENGTH_16 && requiredAmount.lt(amount)) {
        const utxo = unspentUtxo.slice(numbers.ZERO, numbers.INPUT_LENGTH_16 * numbers.TWO - numbers.ONE)

        // @ts-expect-error TODO type
        const availableBalanceAfterMerge = utxo.reduce((acc, curr) => acc.add(curr.amount), BG_ZERO)

        throw new Error(
          `${errors.validation.INSUFFICIENT_INPUTS} ${fromWei(requiredAmount)}:${fromWei(availableBalanceAfterMerge)}`,
        )
      }

      return {
        senderKeyPair,
        isNeedMerged: false,
        unspentUtxo: result,
        totalAmount: requiredAmount,
      }
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async getAccountKeypair({ dispatch, getters }) {
    try {
      const storageKeypair = await dispatch('getKeypairFromStorage')

      if (storageKeypair) {
        return storageKeypair
      }

      // TODO how to check the user has to account
      const poolAddress = await eventService.getAccountAddress(getters.dependencies.walletAddress)
      console.log('getAccountKeypair', poolAddress)

      if (!poolAddress) {
        return undefined
      }

      const keypair = await dispatch('generateKeypairFromSign', { address: getters.dependencies.walletAddress })

      if (keypair.address() !== poolAddress) {
        throw new Error('different addresses and private key')
      }

      return keypair
    } catch (err) {
      return undefined
    }
  },

  async generateKeypairFromSign({ dispatch, getters }, { address }) {
    const signedMessage = await dispatch('wallet/signStartMessage', { signingAddress: address }, { root: true })

    const { walletAddress } = getters.dependencies
    const addressFromSign = utils.verifyMessage(SIGN_MESSAGE, signedMessage)

    if (walletAddress !== addressFromSign) {
      throw new Error(errors.validation.INVALID_SIGNATURE)
    }

    const privateKey = generatePrivateKeyFromEntropy(signedMessage)

    privateStorage.set(SESSION_STORAGE_KEY, privateKey)

    const keypair = new Keypair(privateKey)
    console.log('generateKeypairFromSign', keypair.address())
    return keypair
  },

  getKeypairFromStorage() {
    const session = privateStorage.get(SESSION_STORAGE_KEY)
    if (session?.data) {
      return new Keypair(session.data)
    }
    return undefined
  },

  async getIsRegisterInPool({ dispatch }, address) {
    try {
      const poolAddress = await eventService.getAccountAddress(address)
      console.log('Metamask', address)
      console.log('getIsRegisterInPool NOVA address', poolAddress)
      return Boolean(poolAddress)
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async checkRegisterInPool({ dispatch, commit }, address) {
    try {
      if (!address) {
        throw new Error('Connect wallet and try again')
      }
      commit(AccountMutation.SET_REGISTERED_IN_POOL_STATUS, registerStatuses.NOT_CHECKED)
      const isRegisteredInPool = await dispatch('getIsRegisterInPool', address)

      const status = isRegisteredInPool ? registerStatuses.REGISTERED : registerStatuses.NOT_REGISTERED
      commit(AccountMutation.SET_REGISTERED_IN_POOL_STATUS, status)

      if (isRegisteredInPool) {
        await dispatch('getAccountBalance')
      } else {
        commit(AccountMutation.SET_ACCOUNT_BALANCE, String(numbers.ZERO))
      }
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async setupAccount({ dispatch, commit, getters }) {
    try {
      const { walletAddress, network, transactions } = getters.dependencies
      const keypair = await dispatch('getKeypairFromStorage')
      const poolAddress = await eventService.getAccountAddress(walletAddress)

      if (poolAddress) {
        throw new Error(errors.validation.ALREADY_REGISTERED_IN_POOL)
      }

      await dispatch('application/getBackUpShieldedKey', { privateKey: keypair.privkey }, { root: true })
      await dispatch('application/checkWalletParams', { isRelayerPossible: false, walletAddress, network }, { root: true })

      const output = new Utxo({ keypair })

      const txHash = await dispatch('registerInPool', { poolAddress: output.keypair.address() })

      const transaction = transactions(txHash)

      const status = BigNumber.from(txStatuses.SUCCESS).eq(transaction.status)
        ? registerStatuses.REGISTERED
        : registerStatuses.NOT_REGISTERED

      commit(AccountMutation.SET_REGISTERED_IN_POOL_STATUS, status)
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async checkSession({ commit, getters, dispatch }) {
    try {
      const session = privateStorage.get(SESSION_STORAGE_KEY)

      if (session?.data) {
        await dispatch('setBackupedAddressFromPublicKey', { privateKey: session.data })

        // TODO: refactor
        if (getters.accountAddress) {
          await dispatch('checkRegisterInPool', getters.accountAddress)
        } else {
          commit(AccountMutation.SET_REGISTERED_IN_POOL_STATUS, registerStatuses.NOT_REGISTERED)
        }
      } else {
        commit(AccountMutation.CLEAR_ACCOUNT)
        if (getters.dependencies.walletAddress) {
          dispatch('checkRegisterInPool', getters.dependencies.walletAddress)
        }
      }
    } catch (err) {
      const errorText = await dispatch(
        'application/errorHandler',
        { errorMessage: err.message, title: 'Check session error' },
        { root: true },
      )
      throw new Error(errorText)
    }
  },

  async setBackupedAddressFromPublicKey({ commit }, { privateKey }) {
    try {
      const address = new Keypair(privateKey).address()
      console.log('setBackupedAddressFromPublicKey', address)
      const ownerAddress = await eventService.getBackupedAddressFromPublicKey(address)
      console.log('Metamask address', ownerAddress)

      if (ownerAddress) {
        const ensName = await ens.getEnsName(address, ChainId.MAINNET)
        commit(AccountMutation.SET_ENS_NAME, ensName)
        commit(AccountMutation.SET_ACCOUNT_ADDRESS, ownerAddress)
      }
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async registerInPool({ dispatch, getters, state }, { poolAddress }) {
    try {
      const contract = getBridgeHelper(getters.dependencies.l1ChainId)

      const params = {
        publicKey: poolAddress,
        owner: getters.dependencies.walletAddress,
      }

      const data = contract.interface.encodeFunctionData('register', [params])

      return await dispatch(
        'wallet/createWalletTransaction',
        {
          calldata: data,
          to: contract.address,
          transactionInfo: {
            amount: numbers.ZERO,
            account: state.address,
            type: transactionTitles.SETUP,
            method: transactionMethods.SETUP,
          },
        },
        { root: true },
      )
    } catch (err) {
      throw new Error(`Method register has error: ${err.message}`)
    }
  },

  async prepareDeposit({ getters }, { amount, address }) {
    const recipientAddress = await eventService.getAccountAddress(address)

    if (!recipientAddress) {
      throw new Error(`Address ${address} is not registered in pool`)
    }

    const keypair = Keypair.fromString(recipientAddress)
    const output = new Utxo({ amount: toWei(amount), keypair })
    const { extData, args } = await createTransactionData({ outputs: [output] }, keypair)

    return encodeWrapAndRelayData({
      chainId: getters.dependencies.l1ChainId,
      address: POOL_CONTRACT[getters.dependencies.l2ChainId],
      data: encodeTransactData({ args, extData }),
    })
  },

  async prepareDepositWithRegister({ getters, dispatch }, { amount }) {
    const poolAddress = await eventService.getAccountAddress(getters.dependencies.walletAddress)
    console.log('prepareDepositWithRegister', poolAddress)

    if (poolAddress) {
      throw new Error(errors.validation.ALREADY_REGISTERED_IN_POOL)
    }

    const keypair = await dispatch('getAccountKeypair')

    const output = new Utxo({ amount: toWei(amount), keypair })
    const { extData, args } = await createTransactionData({ outputs: [output] }, keypair)

    return encodeWrapAndRelayData({
      chainId: getters.dependencies.l1ChainId,
      address: POOL_CONTRACT[ChainId.XDAI],
      data: encodeTransactData({ args, extData }),
      account: { owner: getters.dependencies.walletAddress, publicKey: output.keypair.address() },
    })
  },

  async prepareTransfer({ dispatch }, { amount, address }) {
    try {
      const etherAmount = toWei(amount)
      const recipientAddress = await eventService.getAccountAddress(address)

      if (!recipientAddress) {
        throw new Error(errors.validation.NOT_REGISTERED_IN_POOL)
      }

      const recipientUtxo = new Utxo({
        amount: etherAmount,
        keypair: Keypair.fromString(recipientAddress),
      })

      const { unspentUtxo, totalAmount, senderKeyPair } = await dispatch('getUserAccountInfo', { amount: etherAmount })

      if (totalAmount.lt(etherAmount)) {
        throw new Error(`${errors.validation.INSUFFICIENT_FUNDS} ${fromWei(totalAmount)}`)
      }

      const senderChangeUtxo = new Utxo({
        keypair: senderKeyPair,
        amount: totalAmount.sub(etherAmount).toString(),
      })

      const outputs = totalAmount.sub(etherAmount).eq(numbers.ZERO) ? [recipientUtxo] : [recipientUtxo, senderChangeUtxo]

      const { extData, args } = await createTransactionData({ outputs, inputs: unspentUtxo }, senderKeyPair)

      return { args, extData }
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async submitAction({ dispatch, getters }, { args, extData, transactionInfo }) {
    try {
      const contract = getTornadoPool(getters.dependencies.l2ChainId)
      const calldata = contract.interface.encodeFunctionData('transact', [args, extData])

      return await dispatch(
        'wallet/createWalletTransaction',
        {
          calldata,
          transactionInfo,
          to: POOL_CONTRACT[getters.dependencies.l2ChainId],
        },
        { root: true },
      )
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async createTransfer({ state, dispatch, getters }, { amount, address }) {
    try {
      const { args, extData } = await dispatch('prepareTransfer', { amount, address })

      const contract = getTornadoPool(getters.dependencies.l2ChainId)
      const calldata = contract.interface.encodeFunctionData('transact', [args, extData])

      return await dispatch(
        'wallet/createWalletTransaction',
        {
          transactionInfo: {
            amount,
            account: state.address,
            type: transactionTitles.TRANSFER,
            method: transactionMethods.TRANSFER,
          },
          calldata,
          to: POOL_CONTRACT[getters.dependencies.l2ChainId],
        },
        { root: true },
      )
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async prepareWithdrawal({ dispatch, getters }, { amount, address, l1Fee, isL1Withdrawal = true }) {
    try {
      const etherAmount = toWei(amount)
      const amountWithFee = etherAmount.add(l1Fee)

      const { unspentUtxo, totalAmount, senderKeyPair } = await dispatch('getUserAccountInfo', { amount: amountWithFee })

      if (totalAmount.lt(amountWithFee)) {
        throw new Error(`${errors.validation.INSUFFICIENT_FUNDS} ${fromWei(totalAmount)}`)
      }

      const outputs = [new Utxo({ amount: totalAmount.sub(amountWithFee), keypair: senderKeyPair })]

      const { extData, args } = await createTransactionData(
        {
          l1Fee,
          outputs,
          isL1Withdrawal,
          inputs: unspentUtxo,
          recipient: toChecksumAddress(address),
        },
        senderKeyPair,
      )

      return { extData, args }
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async createWithdrawal({ dispatch, getters, state }, { amount, address, isL1Withdrawal = true }) {
    try {
      const { extData, args } = await dispatch('prepareWithdrawal', { amount, address, isL1Withdrawal })

      const contract = getTornadoPool(getters.dependencies.l2ChainId)
      const calldata = contract.interface.encodeFunctionData('transact', [args, extData])

      return await dispatch(
        'wallet/createWalletTransaction',
        {
          transactionInfo: {
            account: state.address,
            amount: fromWei(amount._hex),
            type: transactionTitles.WITHDRAW,
            method: transactionMethods.WITHDRAW,
          },
          amount: amount._hex,
          calldata,
          to: POOL_CONTRACT[getters.dependencies.l2ChainId],
        },
        { root: true },
      )
    } catch (err) {
      throw new Error(err.message)
    }
  },
}

export const getters: GetterTree<AccountState, RootState> = {
  accountAddress: (state: AccountState) => {
    return state.address
  },
  accountEnsName: (state: AccountState) => {
    return state.ensName
  },
  accountBalance: (state: AccountState) => {
    try {
      return BigNumber.from(state.balance)
    } catch {
      return '0'
    }
  },

  isRegisteredInPoolNotChecked: (state: AccountState) => {
    return state.registeredInPoolStatus === registerStatuses.NOT_CHECKED
  },
  isRegisteredInPool: (state: AccountState) => {
    return state.registeredInPoolStatus === registerStatuses.REGISTERED
  },
  isNotRegisteredInPool: (state: AccountState) => {
    return state.registeredInPoolStatus !== registerStatuses.REGISTERED
  },
  isRegisterProcessing: (state: AccountState) => {
    return state.registeredInPoolStatus === registerStatuses.PROCESSING
  },
  // settings
  shouldShowPoolTransferAlert: (state) => {
    return state.settings.shouldShowPoolTransferAlert
  },
  shouldShowConfirmModal: (state) => {
    return state.settings.shouldShowConfirmModal
  },
  shouldShowRiskAlert: (state) => {
    return state.settings.shouldShowRiskAlert
  },
  shouldShowEthLinkAlert: (state) => {
    return state.settings.shouldShowEthLinkAlert
  },
  shouldShowPrivacyAlert: (state) => {
    return state.settings.shouldShowPrivacyAlert
  },
  transferMethod: (state: AccountState) => {
    return state.settings.transferMethod
  },
  isRelayer: (state: AccountState) => {
    return state.settings.transferMethod === transferMethods.RELAYER
  },
  // another module dependencies
  dependencies: (state: AccountState, getters, rootState, rootGetters) => {
    return {
      // application
      l1Fee: rootGetters['application/l1Fee'],
      isProcessingStarted: rootGetters['application/isProcessingStarted'],
      // wallet
      network: rootGetters['wallet/chainId'],
      l1ChainId: rootGetters['wallet/l1ChainId'],
      l2ChainId: rootGetters['wallet/l2ChainId'],
      walletAddress: rootGetters['wallet/walletAddress'],
      // transactions
      pendingTxs: rootGetters['transaction/pendingTxs'],
      transactions: rootGetters['transaction/currentTransaction'],
    }
  },
}

export const mutations: MutationTree<AccountState> = {
  [AccountMutation.SET_ACCOUNT_ADDRESS](state, payload) {
    state.address = toChecksumAddress(payload)
  },
  [AccountMutation.SET_ENS_NAME](state, payload) {
    state.ensName = payload
  },
  [AccountMutation.SET_ACCOUNT_BALANCE](state, payload) {
    state.balance = state.address ? payload : ''
  },
  [AccountMutation.UPDATE_ACCOUNT_BALANCE](state, payload) {
    state.balance = state.address ? BigNumber.from(state.balance).add(payload).toString() : ''
  },
  [AccountMutation.SET_IS_BALANCE_FETCHING](state, payload) {
    state.isBalanceFetching = payload
  },
  [AccountMutation.SET_REGISTERED_IN_POOL_STATUS](state, payload) {
    state.registeredInPoolStatus = payload
  },
  [AccountMutation.SET_TRANSFER_METHOD](state, payload) {
    // @ts-expect-error
    this._vm.$set(state.settings, 'transferMethod', payload)
  },
  [AccountMutation.SET_SHOULD_SHOW_POOL_TRANSFER_ALERT](state, shouldShow) {
    state.settings.shouldShowPoolTransferAlert = shouldShow
  },
  [AccountMutation.SET_SHOULD_SHOW_CONFIRM_MODAL](state, shouldShow) {
    state.settings.shouldShowConfirmModal = shouldShow
  },
  [AccountMutation.SET_SHOULD_SHOW_RISK_ALERT](state, shouldShow) {
    state.settings.shouldShowRiskAlert = shouldShow
  },
  [AccountMutation.SET_SHOULD_SHOW_ETH_LINK_ALERT](state, shouldShow) {
    state.settings.shouldShowEthLinkAlert = shouldShow
  },
  [AccountMutation.SET_SHOULD_PRIVACY_ALERT](state, shouldShow) {
    state.settings.shouldShowPrivacyAlert = shouldShow
  },
  [AccountMutation.CLEAR_ACCOUNT](state) {
    state.address = ''
    state.balance = '0'
    state.registeredInPoolStatus = registerStatuses.NOT_CHECKED

    state.settings = {
      shouldShowConfirmModal: true,
      shouldShowPrivacyAlert: true,
      shouldShowPoolTransferAlert: true,
      transferMethod: transferMethods.RELAYER,
      shouldShowRiskAlert: state.settings.shouldShowRiskAlert,
      shouldShowEthLinkAlert: state.settings.shouldShowEthLinkAlert,
    }
  },
}

export const state = () => {
  return {
    ensName: '',
    address: '',
    balance: '0',
    isBalanceFetching: false,
    registeredInPoolStatus: registerStatuses.NOT_CHECKED,
    settings: {
      shouldShowRiskAlert: true,
      shouldShowEthLinkAlert: true,
      shouldShowConfirmModal: true,
      shouldShowPrivacyAlert: true,
      shouldShowPoolTransferAlert: true,
      transferMethod: transferMethods.RELAYER,
    },
  }
}
