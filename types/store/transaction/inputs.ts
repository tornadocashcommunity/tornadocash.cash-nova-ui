import { ChainId } from '@/types'

import { Transaction, TxInfo } from './entities'

export type TransactionWatcherParams = {
  txHash: string
  transactionInfo: TxInfo
  chainId: ChainId
}

export type SetTransactionParms = {
  transaction: Transaction
}
