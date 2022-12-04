import { ChainId } from '@/types'

export type GasPrice = {
  low: number
  fast: number
  instant: number
  standard: number
}

export type SelectedGasPrice = keyof GasPrice

export type SetSelectedGasPrice = {
  select: keyof GasPrice
  chainId: ChainId
}

export type GasPrices = {
  [k in number]: GasPrice & {
    selected: SelectedGasPrice
  }
}

export type GasParams = {
  baseFee: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
}

export type BaseFee = Record<number, string>
export type EIPGasParams = Record<number, GasParams>
