import { BigNumberish } from 'ethers'

import { ChainId } from '@/types'
import { transactionMethods } from '@/constants'

export type ConfirmationStatus = '' | 'success' | 'fail' | 'loading'
export type ConfirmationStep = 'generate' | 'transact' | 'wait' | 'bridge' | 'complete'

export type ConfirmationStatuses = { [key in ConfirmationStep]: ConfirmationStatus }

export type ContractConstants = {
  maximumDepositAmount: BigNumberish
  omnibridgeDailyLimit: BigNumberish
  minimalWithdrawalAmount: BigNumberish
  maximumWithdrawalAmount: BigNumberish
}

export type ProcessingModal = {
  title: string
  isShow: boolean
  chainId: ChainId
  type: transactionMethods
}

export type Processing = {
  info: {
    type: string
    txHash: string
    blockNumber: number
    params: object
    account: string
  }
  modal: ProcessingModal
  statuses: ConfirmationStatuses
}

export type AmountToViewPayload = {
  amount: string
  method: string
  isRelayer: boolean
  withRelayer: boolean
  isCustom: boolean
}
