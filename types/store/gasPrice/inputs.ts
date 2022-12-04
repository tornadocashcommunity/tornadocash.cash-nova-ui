import { ChainId } from '@/types'

import { GasPrice } from './entities'

export type SetGasPrice = {
  chainId: ChainId
} & GasPrice
