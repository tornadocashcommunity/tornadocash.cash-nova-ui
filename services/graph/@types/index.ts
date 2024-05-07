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

export type Commitment = {
  index: string
  commitment: string
  blockNumber: string
  encryptedOutput: string
  transactionHash: string
}

export type Commitments = Commitment[]

export type Nullifier = {
  nullifier: string
  blockNumber: string
  transactionHash: string
}

export type Nullifiers = Nullifier[]