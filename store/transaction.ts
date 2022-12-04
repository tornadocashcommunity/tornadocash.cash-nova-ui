import { ActionTree, GetterTree, MutationTree } from 'vuex'

import { BigNumber } from 'ethers'

import { TransactionMutation, PendingTx, RootState, Transaction, TransactionState, ChainId } from '@/types'

import { getEtherscanLink, fromWei } from '@/utilities'
import { NullifierEvents } from '@/services/events/@types'
import { errors, numbers, transactionTitles, txStatuses } from '@/constants'
import { getProvider, Keypair, toFixedHex, utxoFactory, workerProvider } from '@/services'

async function checkIsSavedTx(txHash: string, accountAddress: string) {
  try {
    const utxoService = utxoFactory.getService(ChainId.XDAI, accountAddress)

    const foundTx: NullifierEvents = await utxoService.getNullifierEventsFromTxHash(txHash)
    return foundTx
  } catch {
    return null
  }
}

async function getDecryptedEventsFromTxHash(txHash: string, keypair: Keypair) {
  try {
    const decryptedEvents = await workerProvider.getDecryptedEventsFromTxHash(keypair, txHash)
    return decryptedEvents
  } catch {
    return []
  }
}

export const actions: ActionTree<TransactionState, RootState> = {
  async migrateTxHistory({ commit, dispatch, state, getters }) {
    try {
      const keypair = await dispatch('account/getKeypairFromStorage', {}, { root: true })

      if (!keypair) {
        return
      }

      if (!Object.keys(state.entities).length) {
        return
      }

      const checksArray = await Promise.all(
        Object.keys(state.entities).map(async (txHash) => await checkIsSavedTx(txHash, getters.dependencies.accountAddress)),
      )
      const decryptedEvents = await Promise.all(
        Object.keys(state.entities).map(async (txHash) => await getDecryptedEventsFromTxHash(txHash, keypair)),
      )

      const includesTxs = Object.entries(state.entities).reduce((acc: Record<string, Transaction>, [key, tx], index) => {
        const nullifiersByTx = checksArray[index]

        if (nullifiersByTx) {
          const senderNullifiers = nullifiersByTx.find((n) =>
            decryptedEvents.flat().find((c) => {
              const isSameNullifier = toFixedHex(c.nullifier) === toFixedHex(n.nullifier)
              const isSameTx = c.transactionHash.toLowerCase() === n.transactionHash.toLowerCase()

              return isSameTx || isSameNullifier
            }),
          )
          if (senderNullifiers) {
            acc[key] = tx
          }
        }
        return acc
      }, {})

      const foundTxs = Object.keys(includesTxs)

      if (foundTxs.length) {
        commit(TransactionMutation.REMOVE_ENTITIES, { txHashes: Object.keys(includesTxs) })
      }

      commit(TransactionMutation.SET_ACCOUNT_ENTITIES, { account: getters.dependencies.accountAddress, includesTxs })
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async transactionWatcher({ commit, dispatch }, { txHash, transactionInfo, chainId }) {
    try {
      const provider = getProvider(chainId)

      commit(TransactionMutation.SET_PENDING_TRANSACTION, { txHash, transactionInfo, chainId })

      const transaction = await provider.waitForTxReceipt({ txHash })

      dispatch('setTransaction', { ...transaction, ...transactionInfo, chainId, timestamp: Date.now() })
      const status = BigNumber.from(transaction.status)

      if (status.eq(txStatuses.FAIL)) {
        throw new Error(errors.wallet.FAILED_TX)
      }
    } catch (err) {
      throw new Error(err.message)
    }
  },

  async waitConfirmation({ commit, getters }, { chainId, account, txHash, minConfirmation = numbers.MIN_BRIDGE_CONFIRMATION }) {
    try {
      const provider = getProvider(chainId)

      const callback = ({ type, amount, ...tx }: Transaction) => {
        commit(TransactionMutation.UPDATE_TRANSACTION, { ...tx, txHash, account })
      }

      await provider.waitForTxConfirmations({ txHash, minConfirmation, callback })
    } catch (err) {
      throw new Error(err.message)
    }
  },

  checkPendingTx({ getters, commit, dispatch }) {
    const callback = async ({ transactionHash, type, chainId, account }: PendingTx) => {
      const provider = getProvider(chainId)

      const tx = await provider.waitForTxReceipt({ txHash: transactionHash })

      if (tx?.blockNumber != null) {
        dispatch('setTransaction', {
          ...tx,
          type,
          chainId,
          account,
          timestamp: Date.now(),
          status: txStatuses.SUCCESS,
          amount: fromWei(tx.value),
        })
      } else {
        commit(TransactionMutation.UPDATE_PENDING_TRANSACTION, transactionHash)
      }
    }

    getters.pendingTxs.forEach((pendingTx: PendingTx) => {
      callback(pendingTx)
    })
  },

  setTransaction({ commit, getters }, transaction) {
    try {
      commit(TransactionMutation.SET_TRANSACTION, transaction)

      commit(TransactionMutation.UPDATE_PENDING_TRANSACTION, transaction.transactionHash)

      const typesByTxStatus = {
        [txStatuses.FAIL]: 'error',
        [txStatuses.SUCCESS]: 'success',
        [txStatuses.PENDING]: 'warning',
      }

      const toastStatus = typesByTxStatus[BigNumber.from(transaction.status)._hex]
      if (!toastStatus || toastStatus === 'error') {
        return
      }

      const link = getEtherscanLink(transaction.chainId, transaction.transactionHash, 'transaction')

      this.$notification({
        type: transaction.type,
        title: transaction.type,
        duration: numbers.TOAST_DURATION,
        data: { link, linkTitle: 'Explorer link' },
        text: transactionTitles.SETUP === transaction.type ? '' : `${transaction.amount} ETH`,
      })
    } catch (err) {
      console.error('setTransaction has error:', err.message)
    }
  },
}

export const getters: GetterTree<TransactionState, RootState> = {
  txHash: (state: TransactionState) => {
    return state.txHash
  },
  pendingTxs: (state: TransactionState) => {
    return state.pendingTxs
  },
  isPendingTxs: (state: TransactionState) => {
    return Boolean(state.pendingTxs.length)
  },
  accountHistory: (state: TransactionState, getters) => {
    return state.accountsEntities[getters.dependencies.accountAddress]
  },
  txsHistory: (state: TransactionState, getters) => {
    const accountHistory = state.accountsEntities[getters.dependencies.accountAddress]
    if (accountHistory) {
      return Object.values(accountHistory).reverse()
    }
    return []
  },
  currentTransaction: (state: TransactionState, getters) => (txHash: string) => {
    const txStorage = state.accountsEntities[getters.dependencies.accountAddress]
    if (txStorage) {
      return txStorage[txHash]
    }

    return undefined
  },
  // another module dependencies
  dependencies: (state: TransactionState, getters, rootState, rootGetters) => {
    return {
      accountAddress: rootGetters['account/accountAddress'],
    }
  },
}

export const mutations: MutationTree<TransactionState> = {
  [TransactionMutation.SET_PENDING_TRANSACTION](state, payload) {
    const isExist = state.pendingTxs.find(({ transactionHash }) => transactionHash === payload.txHash)
    if (!isExist) {
      state.pendingTxs = [
        ...state.pendingTxs,
        { ...payload.transactionInfo, transactionHash: payload.txHash, chainId: payload.chainId },
      ]
    }
  },
  [TransactionMutation.SET_ACCOUNT_ENTITIES](state, { account, includesTxs }) {
    const existingStore = state.accountsEntities[account] || {}
    // @ts-expect-error
    this._vm.$set(state.accountsEntities, account, { ...existingStore, ...includesTxs })
  },
  [TransactionMutation.REMOVE_ENTITIES](state, { txHashes }) {
    txHashes.forEach((txHash: string) => {
      if (state.entities[txHash]) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete state.entities[txHash]
      }
    })
  },
  [TransactionMutation.SET_TRANSACTION](state, { account, ...payload }) {
    if (!(account in state.accountsEntities)) {
      // @ts-expect-error
      this._vm.$set(state.accountsEntities, account, { [payload.transactionHash]: payload })
    } else {
      // @ts-expect-error
      this._vm.$set(state.accountsEntities[account], payload.transactionHash, payload)
    }
  },
  [TransactionMutation.UPDATE_TRANSACTION](state, { account, ...payload }) {
    // @ts-expect-error
    this._vm.$set(state.accountsEntities[account], payload.txHash, {
      ...state.accountsEntities[account][payload.txHash],
      ...payload,
    })
  },
  [TransactionMutation.UPDATE_PENDING_TRANSACTION](state, payload) {
    state.pendingTxs = state.pendingTxs.filter(({ transactionHash }) => transactionHash !== payload)

    if (!state.txHash.includes(payload)) {
      state.txHash = [...state.txHash, payload]
    }
  },
}

export const state = () => {
  return {
    txHash: [],
    pendingTxs: [],
    accountsEntities: {},
    entities: {}, // rudiment
  }
}
