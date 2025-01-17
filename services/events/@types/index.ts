import { ChainId } from '@/types'

import { BaseUtxo } from '@/services/core/@types'

export interface EventsClass {
  getRelayedMessage: (params: GetRelayedMessageParams) => Promise<RelayedMessageEvents | []>
  getUserRequestForAffirmation: (params: GetAffirmationParams) => Promise<DefaultEvents | []>

  getAffirmationCompleted: (params: GetAffirmationParams) => Promise<DefaultEvents | []>

  getAccountAddress: (address: string) => Promise<string | undefined>

  saveEvents: (params: SaveEventsParams) => void
}

export type DecryptedCommitmentEvent = {
  utxo: BaseUtxo
  nullifierHash: string
}

export type DecryptedCommitmentEvents = DecryptedCommitmentEvent[]

type CommitmentEvent = {
  blockNumber: number
  transactionHash: string
  index: number
  commitment: string
  encryptedOutput: string
}

export type CommitmentEvents = CommitmentEvent[]

type NullifierEvent = {
  nullifier: string
  blockNumber: number
  transactionHash: string
}

export type NullifierEvents = NullifierEvent[]

type AccountEvent = {
  key: string
  owner: string
  blockNumber: number
}

export type AccountEvents = AccountEvent[]

type RelayedMessageEvent = {
  transactionHash: string
  topics: string[]
}

export type RelayedMessageEvents = RelayedMessageEvent[]

type DefaultEvent = {
  args: string[]
  topics: string[]
}

export type DefaultEvents = DefaultEvent[]

export type GetRelayedMessageParams = {
  messageId: string
  blockFrom?: number
  attempt?: number
}

export type GetAffirmationParams = {
  blockFrom?: number
  messageId?: string
  attempt?: number
}

export type MulticallParams = {
  events: DecryptedCommitmentEvents
  gasLimit: number
}

export type SaveEventsParams = {
  events: CommitmentEvents | AccountEvents | NullifierEvents
  storeName: string
  chainId: ChainId
}
