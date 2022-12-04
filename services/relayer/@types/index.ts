import { BigNumber } from 'ethers'

import { ChainId } from '@/types'
import { ArgsProof, ExtData } from '@/services/core/@types'

export type CreateTransactParams = {
  params: {
    args: ArgsProof
    extData: ExtData
  }
  url: string
}

export type GetOperationFeeParams = {
  serviceFee: {
    transfer: string
    withdrawal: number
  }
  amount: BigNumber
  networkFee: BigNumber
  method: string
}

export type GetStatusParams = {
  url: string
  ensName: string
}

export type EventRelayer = {
  ensName: string
  relayerAddress: string
}

export type EventRelayerList = EventRelayer[]

export type AggregatorRelayer = {
  owner: string
  balance: BigNumber
  isRegistered: boolean
  records: string[]
}

export type AggregatorRelayers = AggregatorRelayer[]

export type ValidRelayer = EventRelayer & {
  hostname: string
}

export type ValidRelayers = ValidRelayer[]

export type RegistryMethodInput = {
  chainId: ChainId
  relayers: EventRelayerList
}

export type GraphRelayerEvent = {
  address: string
  ensHash: string
  ensName: string
  __typename: string
  blockRegistration: string
}

export type GraphRelayerEvents = GraphRelayerEvent[]

export type GraphData = {
  lastSyncBlock: number
  events: GraphRelayerEvents
}

export type SaveRegisteredEventsParams = {
  events: EventRelayerList
  storeName: string
  lastSyncBlock: number
}
