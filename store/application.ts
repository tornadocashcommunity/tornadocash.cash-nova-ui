import { ActionTree, GetterTree, MutationTree } from 'vuex'
import { BigNumber } from 'ethers'

import {
  RootState,
  ConfirmationStep,
  ApplicationState,
  ContractConstants,
  AmountToViewPayload,
  ApplicationMutation,
} from '@/types'

import { BackupModal, ConfirmationModal, ContinueModal, MergeInputsModal } from '@/modals'
import { eventService, getProvider, getWalletProvider, relayerService, workerProvider, ens } from '@/services'
import { getMulticall, getTornadoPool, getBridgeFeeManager, getForeignOmnibridge, getOmnibridge } from '@/contracts'

import {
  sleep,
  toWei,
  fromWei,
  checkEns,
  isAmount,
  isAddress,
  reduceText,
  errorParser,
  createModalArgs,
  toDecimalsPlaces,
  onStaticMulticall,
  getMessageIdFromTransaction,
  getOperationChecker,
} from '@/utilities'

import {
  BRIBE,
  errors,
  numbers,
  BG_ZERO,
  L1_CHAIN_ID,
  WRAPPED_TOKEN,
  MIN_GAS_PRICE,
  BRIDGE_HELPER,
  confirmationStep,
  transactionTitles,
  confirmationStatus,
  operationGasLimits,
  transactionMethods,
  L1_WITHDRAW_GAS_LIMIT,
} from '@/constants'

export const actions: ActionTree<ApplicationState, RootState> = {
  async getBackUpShieldedKey(_, { privateKey }) {
    return await new Promise((resolve, reject) => {
      const onReject = (err: string) => {
        return reject(new Error(err))
      }

      const onResolve = () => {
        resolve(true)
      }

      // @ts-expect-error
      this._vm.$modal.show(
        ...createModalArgs(
          BackupModal,
          {
            privateKey,
            callback: onResolve,
            rejectCallback: onReject,
          },
          { clickToClose: false },
        ),
      )
    })
  },

  async getContinueConfirmation({ getters }, { method }) {
    return await new Promise((resolve, reject) => {
      if (!getters.dependencies.shouldShowConfirmModal) {
        resolve(true)
        return
      }
      const onReject = (err: string) => {
        return reject(new Error(err))
      }

      const onResolve = () => {
        resolve(true)
      }

      // @ts-expect-error
      this._vm.$modal.show(
        ...createModalArgs(ContinueModal, { method, rejectCallback: onReject, callback: onResolve }, { clickToClose: false }),
      )
    })
  },
  async checkRecipientAddress({ dispatch }, recipientAddress) {
    try {
      const { isInvalidAddress, isRegistered, isENS, ensAddress } = await dispatch('validateAddress', recipientAddress)

      return { isRegistered, isInvalidAddress, isENS, ensAddress }
    } catch (err) {
      if (err.message.includes('bad address checksum')) {
        return { isRegistered: false, isInvalidAddress: false }
      } else {
        this.$notification({
          type: 'error',
          title: 'Check address error',
          text: err.message,
        })
        return undefined
      }
    }
  },
  async createPullOperation({ commit, getters, dispatch }, { address, amount, title, type }) {
    try {
      const l1Fee = getters.l1Fee
      const chainId = getters.dependencies.l2ChainId
      commit(ApplicationMutation.SET_PROCESSING_MODAL, { type, title, chainId })

      // @ts-expect-error
      this._vm.$modal.show(...createModalArgs(ConfirmationModal, {}, { clickToClose: false }))
      const action = type === transactionMethods.WITHDRAW ? 'createWithdrawalWithStatus' : 'createTransferWithStatus'
      await dispatch(action, { address, amount, l1Fee })
    } catch (err) {
      if (err.message.includes(errors.validation.INSUFFICIENT_INPUTS)) {
        const [, subString] = err.message.split('Insufficient inputs')
        const [currentAmount, availableAmount] = subString.split(':')

        // @ts-expect-error
        this._vm.$modal.show(...createModalArgs(MergeInputsModal, { currentAmount, availableAmount }))
      }
      throw new Error(err.message)
    }
  },
  async getContractConstants({ commit, getters }) {
    try {
      const poolContract = getTornadoPool(getters.dependencies.l2ChainId)
      const multicallContract = getMulticall(getters.dependencies.l2ChainId)

      const params = [
        {
          gasLimit: '0x6f6d',
          target: poolContract.address,
          callData: poolContract.interface.encodeFunctionData('maximumDepositAmount'),
        },
        // {
        //   gasLimit: '0x6f9a',
        //   target: poolContract.address,
        //   callData: poolContract.interface.encodeFunctionData('minimalWithdrawalAmount'),
        // },
      ]
      const { returnData } = await multicallContract.callStatic.multicall(params)

      const [maximumDepositAmount] = returnData

      commit(ApplicationMutation.SET_CONTRACT_CONSTANTS, {
        maximumDepositAmount: maximumDepositAmount.returnData,
        minimalWithdrawalAmount: BG_ZERO,
      })
    } catch (err) {
      console.log('getContractConstants has error:', err.message)
    }
  },

  async checkWithdrawalComplete({ dispatch, getters, commit }, { txHash }) {
    try {
      const { provider } = getProvider(getters.dependencies.l2ChainId)

      const withdrawalTx = getters.dependencies.currentTransaction(txHash)

      const receipt = await provider.getTransactionReceipt(txHash)

      const messageId = getMessageIdFromTransaction('withdrawal', receipt)

      const [request] = await eventService.getUserRequestForSignature({ messageId, blockFrom: withdrawalTx.blockNumber })

      const [event] = await eventService.getRelayedMessage({
        messageId: request.topics[numbers.ONE],
      })

      if (request.topics[numbers.ONE] === event.topics[numbers.THREE]) {
        dispatch('wallet/getWalletBalance', {}, { root: true })

        const tx = getters.dependencies.currentTransaction(request.transactionHash)

        dispatch(
          'transaction/transactionWatcher',
          {
            txHash: event.transactionHash,
            chainId: getters.dependencies.l1ChainId,
            transactionInfo: {
              amount: tx.amount,
              type: transactionTitles.BRIDGE,
              method: transactionMethods.BRIDGE,
              account: getters.dependencies.accountAddress,
            },
          },
          { root: true },
        )

        commit(ApplicationMutation.SET_PROCESSING_STATUS, { step: confirmationStep.BRIDGE, status: confirmationStatus.SUCCESS })
        commit(ApplicationMutation.SET_PROCESSING_STATUS, {
          step: confirmationStep.COMPLETE,
          status: confirmationStatus.SUCCESS,
        })
      }
    } catch (err) {
      console.log('checkWithdrawalComplete error:', err.message)
    }
  },

  async checkDepositComplete({ dispatch, commit, getters }, { txHash }) {
    try {
      const { provider } = getProvider(getters.dependencies.l1ChainId)

      const tx = getters.dependencies.currentTransaction(txHash)

      const receipt = await provider.getTransactionReceipt(txHash)

      const messageId = getMessageIdFromTransaction('deposit', receipt)

      const [affirmation] = await eventService.getUserRequestForAffirmation({ messageId, blockFrom: tx.blockNumber })

      const [event] = await eventService.getAffirmationCompleted({ messageId: affirmation.args[numbers.ZERO] })

      if (event.topics[numbers.THREE] === affirmation.args[numbers.ZERO]) {
        commit(ApplicationMutation.SET_PROCESSING_STATUS, { step: confirmationStep.BRIDGE, status: confirmationStatus.SUCCESS })
        commit(ApplicationMutation.SET_PROCESSING_STATUS, { step: confirmationStep.COMPLETE, status: confirmationStatus.SUCCESS })
      }
    } catch (err) {
      console.log('checkDepositComplete has error:', err.message)
    }
  },

  async checkWalletParams({ getters }, payload) {
    const { walletAddress, mismatchNetwork, isRelayer } = getters.dependencies

    if (!walletAddress) {
      return
    }

    const provider = getWalletProvider(getters.nameProvider || 'METAMASK')
    const network = await provider.checkNetworkVersion()
    const defaultParams = {
      isRelayer,
      additionalCondition: payload.isRelayerPossible,
    }

    if (getOperationChecker({ ...defaultParams, checker: mismatchNetwork })) {
      throw new Error(errors.validation.MISMATCH_NETWORK)
    }

    if (getOperationChecker({ ...defaultParams, checker: network !== payload.network })) {
      throw new Error('Network changed during operation')
    }

    if (getOperationChecker({ ...defaultParams, additionalCondition: false, checker: walletAddress !== payload.walletAddress })) {
      throw new Error('Wallet changed during operation')
    }
  },

  async createDepositWithStatus({ getters, commit, dispatch }, { amount, address, withRegister = false }) {
    try {
      const account = getters.dependencies.accountAddress
      const { network, walletAddress, l1ChainId: chainId } = getters.dependencies

      if (getters.isNotCompleteStep(confirmationStep.GENERATE)) {
        commit(ApplicationMutation.SET_PROCESSING_INFO, { type: 'deposit', account })
        commit(ApplicationMutation.SET_PROCESSING_STATUS, { step: confirmationStep.GENERATE, status: confirmationStatus.LOADING })

        await dispatch('checkWalletParams', { isRelayerPossible: false, walletAddress, network })

        const calldata = withRegister
          ? await dispatch('account/prepareDepositWithRegister', { amount }, { root: true })
          : await dispatch('account/prepareDeposit', { amount, address }, { root: true })

        dispatch('processingOnNextStep', { currentStep: confirmationStep.GENERATE, nextStep: confirmationStep.TRANSACT })

        if (withRegister) {
          const keypair = await dispatch('account/getKeypairFromStorage', null, { root: true })
          await dispatch('getBackUpShieldedKey', { privateKey: keypair.privkey })
        }

        await dispatch('checkWalletParams', { isRelayerPossible: false, walletAddress, network })

        const params = {
          calldata,
          amount: toWei(amount)._hex,
          to: BRIDGE_HELPER[chainId],
          gas: operationGasLimits.FUND,
          recipient: withRegister ? getters.dependencies.walletAddress : address,
          transactionInfo: {
            amount,
            account,
            recipient: address,
            method: transactionMethods.FUND,
            type: withRegister ? transactionTitles.SETUP : transactionTitles.FUND,
          },
        }

        await dispatch('checkWalletParams', { isRelayerPossible: false, walletAddress, network })

        const txHash = await dispatch('wallet/createWalletTransaction', params, { root: true })
        commit(ApplicationMutation.SET_PROCESSING_INFO, { txHash })

        await dispatch('processingOnNextStep', { currentStep: confirmationStep.TRANSACT, nextStep: confirmationStep.WAIT })
      }

      if (getters.isNotCompleteStep(confirmationStep.WAIT) && getters.processingTxHash) {
        await dispatch(
          'transaction/waitConfirmation',
          { txHash: getters.processingTxHash, account: getters.processingAccount, chainId },
          { root: true },
        )
        await dispatch('processingOnNextStep', { currentStep: confirmationStep.WAIT, nextStep: confirmationStep.BRIDGE })
      }

      if (withRegister) {
        dispatch('account/checkRegisterInPool', address, { root: true })
      }

      if (getters.isNotCompleteStep(confirmationStep.BRIDGE) && getters.processingTxHash) {
        await dispatch('checkDepositComplete', { txHash: getters.processingTxHash })
      }

      dispatch('account/getAccountBalance', {}, { root: true })

      await dispatch('markProcessingAsComplete')
    } catch (err) {
      await dispatch('markPendingStepAsFail', { errorMessage: err.message, title: 'Fund error' })
    }
  },

  async createTransferWithStatus({ getters, commit, dispatch }, { amount, address }) {
    try {
      const network = getters.dependencies.network
      const chainId = getters.dependencies.l2ChainId
      const walletAddress = getters.dependencies.walletAddress
      const account = getters.dependencies.accountAddress

      if (getters.isNotCompleteStep(confirmationStep.GENERATE)) {
        commit(ApplicationMutation.SET_PROCESSING_INFO, { type: transactionTitles.TRANSFER, account })
        commit(ApplicationMutation.SET_PROCESSING_STATUS, { step: confirmationStep.GENERATE, status: confirmationStatus.LOADING })

        const { args, extData } = getters.dependencies.isRelayer
          ? await dispatch('relayer/prepareTransfer', { amount, address }, { root: true })
          : await dispatch('account/prepareTransfer', { amount, address }, { root: true })

        commit(ApplicationMutation.SET_PROCESSING_INFO, {
          params: {
            args,
            extData,
            transactionInfo: {
              amount,
              recipient: address,
              type: transactionTitles.TRANSFER,
              account: getters.processingAccount,
              method: transactionMethods.TRANSFER,
            },
          },
        })

        dispatch('processingOnNextStep', { currentStep: confirmationStep.GENERATE, nextStep: confirmationStep.TRANSACT })
        await dispatch('checkWalletParams', { isRelayerPossible: true, walletAddress, network })
        await dispatch('getContinueConfirmation', { method: 'Transfer' })
      }

      if (getters.isNotCompleteStep(confirmationStep.TRANSACT) && !getters.dependencies.activeJob) {
        await dispatch('checkWalletParams', { isRelayerPossible: true, walletAddress, network })

        const txHash = getters.dependencies.isRelayer
          ? await dispatch('relayer/createRelayerTransaction', getters.processingParams, { root: true })
          : await dispatch('account/submitAction', getters.processingParams, { root: true })

        commit(ApplicationMutation.SET_PROCESSING_INFO, { txHash })

        await dispatch('processingOnNextStep', { currentStep: confirmationStep.TRANSACT, nextStep: confirmationStep.WAIT })
      }

      if (getters.processingStatuses.generate === confirmationStatus.SUCCESS && getters.dependencies.activeJob) {
        const txHash = await dispatch('relayer/checkActiveJob', getters.dependencies.activeJob, { root: true })
        commit(ApplicationMutation.SET_PROCESSING_INFO, { txHash })

        await dispatch('processingOnNextStep', { currentStep: confirmationStep.TRANSACT, nextStep: confirmationStep.WAIT })
      }

      if (getters.isNotCompleteStep(confirmationStep.WAIT) && getters.processingTxHash) {
        await dispatch(
          'transaction/waitConfirmation',
          {
            txHash: getters.processingTxHash,
            account: getters.processingAccount,
            chainId,
            minConfirmation: numbers.MIN_TRANSFER_CONFIRMATION,
          },
          { root: true },
        )
        await dispatch('processingOnNextStep', { currentStep: confirmationStep.WAIT, nextStep: confirmationStep.BRIDGE })
      }

      dispatch('account/getAccountBalance', {}, { root: true })

      await dispatch('markProcessingAsComplete')
    } catch (err) {
      await dispatch('markPendingStepAsFail', { errorMessage: err.message, title: 'Transfer error' })
    }
  },

  async createWithdrawalWithStatus({ getters, commit, dispatch }, { amount, address, l1Fee }) {
    try {
      const network = getters.dependencies.network
      const chainId = getters.dependencies.l2ChainId
      const account = getters.dependencies.accountAddress
      const walletAddress = getters.dependencies.walletAddress

      if (getters.isNotCompleteStep(confirmationStep.GENERATE)) {
        commit(ApplicationMutation.SET_PROCESSING_INFO, { type: 'withdrawal', account })
        commit(ApplicationMutation.SET_PROCESSING_STATUS, { step: confirmationStep.GENERATE, status: confirmationStatus.LOADING })

        const { args, extData } = getters.dependencies.isRelayer
          ? await dispatch('relayer/prepareWithdrawal', { amount, address, l1Fee }, { root: true })
          : await dispatch('account/prepareWithdrawal', { amount, address, l1Fee }, { root: true })

        commit(ApplicationMutation.SET_PROCESSING_INFO, {
          params: {
            args,
            extData,
            transactionInfo: {
              amount,
              recipient: address,
              type: transactionTitles.WITHDRAW,
              account: getters.processingAccount,
              method: transactionMethods.WITHDRAW,
            },
          },
        })

        dispatch('processingOnNextStep', { currentStep: confirmationStep.GENERATE, nextStep: confirmationStep.TRANSACT })
        await dispatch('checkWalletParams', { isRelayerPossible: true, walletAddress, network })
        await dispatch('getContinueConfirmation', { method: 'Withdrawal' })
      }

      if (getters.isNotCompleteStep(confirmationStep.TRANSACT) && !getters.dependencies.activeJob) {
        await dispatch('checkWalletParams', { isRelayerPossible: true, walletAddress, network })
        await dispatch('getDayLimit')

        const isGreaterThanMax = Number(amount) > Number(getters.maximumWithdrawal)
        if (isGreaterThanMax) {
          throw new Error(errors.errorsGetter([getters.maximumWithdrawal]).MAX_WITHDRAW_AMOUNT)
        }
        const txHash = getters.dependencies.isRelayer
          ? await dispatch('relayer/createRelayerTransaction', getters.processingParams, { root: true })
          : await dispatch('account/submitAction', getters.processingParams, { root: true })

        commit(ApplicationMutation.SET_PROCESSING_INFO, { txHash })

        await dispatch('processingOnNextStep', { currentStep: confirmationStep.TRANSACT, nextStep: confirmationStep.WAIT })
      }

      if (getters.processingStatuses.generate === confirmationStatus.SUCCESS && getters.dependencies.activeJob) {
        const txHash = await dispatch('relayer/checkActiveJob', getters.dependencies.activeJob, { root: true })
        commit(ApplicationMutation.SET_PROCESSING_INFO, { txHash })

        await dispatch('processingOnNextStep', { currentStep: confirmationStep.TRANSACT, nextStep: confirmationStep.WAIT })
      }

      if (getters.isNotCompleteStep(confirmationStep.WAIT) && getters.processingTxHash) {
        await dispatch(
          'transaction/waitConfirmation',
          { txHash: getters.processingTxHash, chainId, account: getters.processingAccount },
          { root: true },
        )
        await dispatch('processingOnNextStep', { currentStep: confirmationStep.WAIT, nextStep: confirmationStep.BRIDGE })
      }

      if (getters.isNotCompleteStep(confirmationStep.BRIDGE) && getters.processingTxHash) {
        await dispatch('checkWithdrawalComplete', { txHash: getters.processingTxHash })
      }

      dispatch('account/getAccountBalance', {}, { root: true })

      await dispatch('markProcessingAsComplete')
    } catch (err) {
      await dispatch('markPendingStepAsFail', { errorMessage: err.message, title: 'Withdrawal error' })
    }
  },

  async getBridgeFeePercent({ getters }) {
    try {
      const bridgeFeeManager = getBridgeFeeManager(getters.dependencies.l2ChainId)
      const HOME_TO_FOREIGN_FEE = '0x741ede137d0537e88e0ea0ff25b1f22d837903dbbee8980b4a06e8523247ee26'

      const bridgeFeePercent = await bridgeFeeManager.getFee(HOME_TO_FOREIGN_FEE, WRAPPED_TOKEN[getters.dependencies.l2ChainId])
      return bridgeFeePercent
    } catch (err) {
      throw new Error(`getBridgeFeePercent has error: ${err.message}`)
    }
  },

  checkProcessing({ getters, dispatch }) {
    try {
      const type = getters.processingType

      // TODO enum for type
      if (type === 'withdrawal') {
        dispatch('createWithdrawalWithStatus', {})
      } else if (type === 'transfer') {
        dispatch('createTransferWithStatus', {})
      } else if (type === 'deposit') {
        dispatch('createDepositWithStatus', {})
      }
    } catch (err) {
      console.warn(`checkProcessing has error: ${err.message}`)
    }
  },

  async markPendingStepAsFail({ getters, dispatch, commit }, { errorMessage, title }) {
    const pendingStep = Object.keys(getters.processingStatuses).find(
      (key) => getters.processingStatuses[key] === confirmationStatus.LOADING,
    )
    if (pendingStep) {
      commit(ApplicationMutation.SET_PROCESSING_STATUS, { step: pendingStep, status: confirmationStatus.FAIL })
    }

    const errorText = await dispatch('errorHandler', { errorMessage, title })

    throw new Error(errorText)
  },

  processingOnNextStep({ commit }, { currentStep, nextStep }) {
    commit(ApplicationMutation.SET_PROCESSING_STATUS, { step: currentStep, status: confirmationStatus.SUCCESS })
    commit(ApplicationMutation.SET_PROCESSING_STATUS, { step: nextStep, status: confirmationStatus.LOADING })
  },

  async setTransactionComplete({ commit, dispatch }, txInfo) {
    commit(ApplicationMutation.SET_PROCESSING_STATUS, { step: confirmationStep.TRANSACT, status: confirmationStatus.SUCCESS })
    await dispatch('checkConfirmation', txInfo)
  },

  async markProcessingAsComplete({ commit }) {
    commit(ApplicationMutation.SET_PROCESSING_STATUS, { step: confirmationStep.BRIDGE, status: confirmationStatus.SUCCESS })
    commit(ApplicationMutation.SET_PROCESSING_STATUS, {
      step: confirmationStep.COMPLETE,
      status: confirmationStatus.SUCCESS,
    })

    await sleep(numbers.SECOND)
    commit(ApplicationMutation.CLEAR_PROCESSING)
  },

  setupWorker({ getters }) {
    workerProvider.workerSetup(getters.dependencies.l2ChainId)
  },

  async validateAddress({ dispatch, getters }, address) {
    try {
      if (!address) {
        return { isInvalidAddress: false, isRegistered: false, isENS: false, ensAddress: '' }
      }

      const isENS = checkEns(address)

      if (isENS) {
        address = await ens.getAddress(address, getters.dependencies.l1ChainId)
      }
      const isInvalidAddress = !isAddress(address)

      if (isInvalidAddress) {
        return { isInvalidAddress, isENS, ensAddress: address, isRegistered: false }
      }

      const isRegistered = await dispatch('account/getIsRegisterInPool', address, { root: true })

      return { isInvalidAddress, isENS, isRegistered, ensAddress: address }
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async getDayLimit({ getters, commit }) {
    const { l1ChainId, l2ChainId } = getters.dependencies

    const WETHL1 = WRAPPED_TOKEN[l1ChainId]
    const WETHL2 = WRAPPED_TOKEN[l2ChainId]

    const foreignOmnibridge = getForeignOmnibridge(l1ChainId)
    const omnibridge = getOmnibridge(l2ChainId)

    const currentDayL1 = await foreignOmnibridge.callStatic.getCurrentDay()

    const [multicallL1Res, multicallL2Res] = await Promise.all([
      onStaticMulticall(l1ChainId, [
        { contract: foreignOmnibridge, methodName: 'executionDailyLimit', args: [WETHL1] },
        { contract: foreignOmnibridge, methodName: 'totalExecutedPerDay', args: [WETHL1, currentDayL1] },
      ]),
      onStaticMulticall(l2ChainId, [
        { contract: omnibridge, methodName: 'dailyLimit', args: [WETHL2] },
        { contract: omnibridge, methodName: 'totalSpentPerDay', args: [WETHL2, currentDayL1] },
      ]),
    ])

    const [{ returnData: executionDailyLimit }, { returnData: totalExecutedPerDay }] = multicallL1Res.returnData
    const [{ returnData: dailyLimit }, { returnData: totalSpentPerDay }] = multicallL2Res.returnData

    const l1Diff = BigNumber.from(executionDailyLimit).sub(totalExecutedPerDay)
    const l2Diff = BigNumber.from(dailyLimit).sub(totalSpentPerDay)

    commit(ApplicationMutation.SET_CONTRACT_CONSTANTS, {
      omnibridgeDailyLimit: dailyLimit,
      maximumWithdrawalAmount: l2Diff.gte(l1Diff) ? l1Diff : l2Diff,
    })
  },

  errorHandler(_, { errorMessage, title = '' }) {
    const errorText = errorParser(errorMessage)
    this.$notification({ type: 'error', title, text: reduceText(errorText), duration: numbers.TOAST_DURATION })
    if (errorMessage.includes(errors.validation.INSUFFICIENT_INPUTS)) {
      return errorMessage
    }
    return errorText
  },
}

export const getters: GetterTree<ApplicationState, RootState> = {
  networkFee: (state: ApplicationState, getters) => (method: string) => {
    return BigNumber.from(getters.dependencies.currentGasPriceL2).mul(operationGasLimits[method.toUpperCase()])
  },
  networkFeeFund: (state: ApplicationState, getters) => {
    const { maxFeePerGas, gasPrice } = getters.dependencies.txGasParams(getters.dependencies.l1ChainId, transactionMethods.FUND)
    return BigNumber.from(maxFeePerGas || gasPrice).mul(operationGasLimits.FUND)
  },
  l2EthNetworkFee: (state: ApplicationState, getters) => (method: string) => {
    const networkFee = getters.networkFee(method)

    return networkFee.mul(getters.dependencies.ethRate).div(toWei('1'))
  },

  operationFee: (state: ApplicationState, getters) => (amount: BigNumber, method: string, isRelayer: boolean) => {
    const isRelayerMethod = isRelayer === undefined ? getters.dependencies.isRelayer : isRelayer

    if (isRelayerMethod) {
      if (!getters.dependencies.currentRelayer) {
        return BG_ZERO
      }

      const { serviceFee } = getters.dependencies.currentRelayer

      return relayerService.getOperationFee({
        method,
        amount,
        serviceFee,
        networkFee: getters.l2EthNetworkFee(method),
      })
    }
    return getters.networkFee(method)
  },
  operationAmounts: (state: ApplicationState, getters) => (amount: string, method: string, isRelayer: boolean) => {
    try {
      if (!isAmount(amount)) {
        return { toSend: '', toReceive: '' }
      }

      const l1Fee = getters.l1Fee
      const amountInWei = toWei(amount)

      if (isRelayer) {
        const operationFee = getters.operationFee(amountInWei, method, isRelayer)

        if (method === 'transfer') {
          const toReceive = fromWei(amountInWei.add(operationFee))
          return { toSend: toReceive, toReceive: toReceive }
        }

        const toReceive = amountInWei.sub(operationFee).sub(l1Fee)
        return { toSend: amount, toReceive: fromWei(toReceive) }
      }

      const toReceive = method === 'transfer' ? amount : fromWei(amountInWei.sub(l1Fee))

      return { toSend: amount, toReceive }
    } catch (err) {
      return { toSend: amount, toReceive: amount }
    }
  },

  tokensToSend: (state: ApplicationState, getters) => (amount: string, method: string, isRelayer: boolean) => {
    try {
      if (!isAmount(amount)) {
        return ''
      }

      const l1Fee = getters.l1Fee
      const amountInWei = toWei(amount)

      if (isRelayer) {
        if (method === 'transfer') {
          const operationFee = getters.operationFee(amountInWei, method, isRelayer)
          return fromWei(amountInWei.add(operationFee))
        }
        const operationFee = getters.operationFee(amountInWei.add(l1Fee), method, isRelayer)

        const toSend = amountInWei.add(operationFee).add(l1Fee)
        return fromWei(toSend)
      }

      return method === 'transfer' ? amount : fromWei(amountInWei.add(l1Fee))
    } catch (err) {
      return amount
    }
  },

  amountsToView:
    (state: ApplicationState, getters) =>
    ({ amount, method, isRelayer, withRelayer, isCustom }: AmountToViewPayload) => {
      if (method === 'transfer') {
        const { toReceive, toSend } = getters.operationAmounts(amount, method, withRelayer)

        return {
          toReceive: isAmount(toReceive) ? toDecimalsPlaces(toReceive, numbers.FEE_PRECISION) : null,
          toSend: isAmount(toSend) ? toDecimalsPlaces(toSend, numbers.FEE_PRECISION) : null,
        }
      }

      let toSendValue = null
      let toReceiveValue = null

      if (isCustom) {
        const toSendWithType = getters.tokensToSend(amount, method, withRelayer)

        toReceiveValue = amount
        toSendValue = toSendWithType
      } else {
        const toSendWithType = getters.tokensToSend(amount, method, isRelayer)
        const { toReceive, toSend } = getters.operationAmounts(toSendWithType, method, withRelayer)

        toReceiveValue = toReceive
        toSendValue = toSend
      }
      return {
        toSend: isAmount(toSendValue) ? toDecimalsPlaces(toSendValue, numbers.FEE_PRECISION) : null,
        toReceive: isAmount(toReceiveValue) ? toDecimalsPlaces(toReceiveValue, numbers.FEE_PRECISION) : null,
      }
    },

  getMaxAmount: (state: ApplicationState, getters) => (method: string) => {
    const balance = BigNumber.from(getters.dependencies.accountBalance)

    if (getters.dependencies.isRelayer) {
      const operationFee = getters.operationFee(balance, method)

      const maxAmount = balance.sub(operationFee)
      if (maxAmount.isNegative()) {
        return BG_ZERO
      }

      return maxAmount
    }
    return balance
  },
  getIsBalanceEnough: (state: ApplicationState, getters) => (amount: string, method: string) => {
    if (!isAmount(amount)) {
      return true
    }

    if (!isAmount(getters.dependencies.accountBalance)) {
      return false
    }

    const balance = BigNumber.from(getters.dependencies.accountBalance)

    if (getters.dependencies.isRelayer) {
      const { toSend } = getters.operationAmounts(amount, method, getters.dependencies.isRelayer)

      return balance.gte(toWei(toSend))
    }

    return balance.gte(toWei(amount))
  },
  getIsBalanceEnoughFund: (state: ApplicationState, getters) => (amount: string) => {
    const amountInWei = toWei(amount)

    const existAmount = BigNumber.from(getters.dependencies.walletBalance).sub(amountInWei).sub(getters.networkFeeFund)

    return !existAmount.lt(numbers.ZERO)
  },
  getMaxAmountFund: (state: ApplicationState, getters) => () => {
    const balance = BigNumber.from(getters.dependencies.walletBalance)
    const operationFee = getters.networkFeeFund

    const maxAmount = balance.sub(operationFee)

    if (maxAmount.isNegative()) {
      return BG_ZERO
    }

    return maxAmount
  },

  actionButtonText: (state: ApplicationState, getters) => (baseText: string, amount: string) => {
    const buttonSuffix =
      Number(amount) > numbers.ZERO
        ? `${toDecimalsPlaces(amount, numbers.FEE_PRECISION)} ${getters.dependencies.chainConfig.symbol}`
        : ''
    return `${baseText} ${buttonSuffix}`
  },

  maximumDeposit: (state: ApplicationState) => {
    return fromWei(state.contract.maximumDepositAmount)
  },
  minimalWithdrawal: (state: ApplicationState) => {
    return fromWei(state.contract.minimalWithdrawalAmount)
  },
  maximumWithdrawal: (state: ApplicationState) => {
    return fromWei(state.contract.maximumWithdrawalAmount)
  },
  omnibridgeDailyLimit: (state: ApplicationState) => {
    return toDecimalsPlaces(fromWei(state.contract.omnibridgeDailyLimit), numbers.ZERO)
  },
  l1Fee: (state: ApplicationState, getters) => {
    const minGasPrice = BigNumber.from(MIN_GAS_PRICE)
    const gasLimit = BigNumber.from(L1_WITHDRAW_GAS_LIMIT)

    let gasPrice = getters.dependencies.gasPrice

    if (gasPrice.lt(minGasPrice)) {
      gasPrice = minGasPrice
    }

    const l1Fee = gasLimit.mul(gasPrice).add(BRIBE)
    return l1Fee
  },

  shouldProcessingWatch: (state: ApplicationState, getters) => {
    const isProcessingTx = Boolean(state.processing.info.txHash)
    const processingTxHasActiveJob = Boolean(getters.dependencies.activeJob)

    return processingTxHasActiveJob || isProcessingTx
  },
  isNotCompleteStep: (state: ApplicationState) => (step: ConfirmationStep) => {
    return state.processing.statuses[step] !== confirmationStatus.SUCCESS
  },
  processingBlockNumber: (state: ApplicationState) => {
    return state.processing.info.blockNumber
  },
  processingTxHash: (state: ApplicationState) => {
    return state.processing.info.txHash
  },
  processingAccount: (state: ApplicationState) => {
    return state.processing.info.account
  },
  processingType: (state: ApplicationState) => {
    return state.processing.info.type
  },
  processingParams: (state: ApplicationState) => {
    return state.processing.info.params
  },
  processingStatuses: (state: ApplicationState) => {
    return state.processing.statuses
  },
  isProcessingComplete: (state: ApplicationState) => {
    return state.processing.statuses.complete === confirmationStatus.SUCCESS
  },
  isProcessingStarted: (state: ApplicationState) => {
    return Boolean(state.processing.statuses.generate)
  },
  isShowProcessingModal: (state: ApplicationState) => {
    return state.processing.modal.isShow
  },
  isProcessingError: (state: ApplicationState) => {
    const statusesValues = Object.values(state.processing.statuses)
    return statusesValues.includes(confirmationStatus.FAIL)
  },

  // another module dependencies
  dependencies: (state: ApplicationState, getters, rootState, rootGetters) => {
    return {
      // transaction
      currentTransaction: rootGetters['transaction/currentTransaction'],
      // wallet
      network: rootGetters['wallet/chainId'],
      l1ChainId: rootGetters['wallet/l1ChainId'],
      l2ChainId: rootGetters['wallet/l2ChainId'],
      chainConfig: rootGetters['wallet/chainConfig'],
      walletBalance: rootGetters['wallet/walletBalance'],
      walletAddress: rootGetters['wallet/walletAddress'],
      mismatchNetwork: rootGetters['wallet/mismatchNetwork'],
      // account
      isRelayer: rootGetters['account/isRelayer'],
      accountBalance: rootGetters['account/accountBalance'],
      accountAddress: rootGetters['account/accountAddress'],
      shouldShowConfirmModal: rootGetters['account/shouldShowConfirmModal'],
      // relayer
      ethRate: rootGetters['relayer/ethRate'],
      activeJob: rootGetters['relayer/activeJob'],
      currentRelayer: rootGetters['relayer/currentRelayer'],
      // gasPrice
      gasPrice: rootGetters['gasPrice/gasPrice'],
      txGasParams: rootGetters['gasPrice/txGasParams'],
      currentGasPriceL2: rootGetters['gasPrice/currentGasPriceL2'],
    }
  },
}

export const mutations: MutationTree<ApplicationState> = {
  [ApplicationMutation.SET_CONTRACT_CONSTANTS](state, payload: ContractConstants) {
    state.contract = { ...state.contract, ...payload }
  },
  [ApplicationMutation.SET_PROCESSING_MODAL](state, payload) {
    state.processing.modal = { ...state.processing.modal, ...payload }
  },
  [ApplicationMutation.SET_PROCESSING_INFO](state, payload) {
    // @ts-expect-error
    this._vm.$set(state.processing, 'info', { ...state.processing.info, ...payload })
  },
  [ApplicationMutation.SET_PROCESSING_STATUS](state, payload) {
    // @ts-expect-error
    this._vm.$set(state.processing.statuses, payload.step, payload.status)
  },
  [ApplicationMutation.CLEAR_PROCESSING](state) {
    state.processing = {
      info: {
        type: '',
        txHash: '',
        params: {},
        account: '',
        blockNumber: 0,
      },
      modal: {
        title: '',
        chainId: L1_CHAIN_ID,
        type: transactionMethods.TRANSFER,
        isShow: false,
      },
      statuses: {
        generate: '',
        transact: '',
        wait: '',
        bridge: '',
        complete: '',
      },
    }
  },
}

export const state = (): ApplicationState => {
  return {
    contract: {
      maximumDepositAmount: BG_ZERO,
      omnibridgeDailyLimit: BG_ZERO,
      minimalWithdrawalAmount: BG_ZERO,
      maximumWithdrawalAmount: BG_ZERO,
    },
    processing: {
      info: {
        txHash: '',
        blockNumber: 0,
        params: {},
        type: '',
        account: '',
      },
      modal: {
        title: '',
        isShow: false,
        chainId: L1_CHAIN_ID,
        type: transactionMethods.TRANSFER,
      },
      statuses: {
        generate: '',
        transact: '',
        wait: '',
        bridge: '',
        complete: '',
      },
    },
  }
}
