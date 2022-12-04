import { ChainId } from '@/types'

export interface Params {
  fromBlock?: number
  chainId: ChainId
}

export type Account = {
  key: string
  owner: string
  blockNumber: string
}

export type Accounts = Account[]
