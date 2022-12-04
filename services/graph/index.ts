import { Operation } from '@apollo/client/link/core'
import { ApolloClient, InMemoryCache, gql } from '@apollo/client/core'

import { ChainId } from '@/types'
import { numbers } from '@/constants'
import { isEmpty, toChecksumAddress } from '@/utilities'

import { Params, Accounts } from './@types'
import { _META, GET_ACCOUNTS, GET_REGISTERED } from './queries'

const first = 1000
const breakLength = 900

const link = (operation: Operation) => {
  const { chainId } = operation.getContext()
  return CHAIN_GRAPH_URLS[chainId]
}

const CHAIN_GRAPH_URLS: { [chainId in ChainId]: string } = {
  [ChainId.BSC]: 'https://api.thegraph.com/subgraphs/name/dan1kov/bsc-tornado-pool-subgraph',
  [ChainId.MAINNET]: 'https://api.thegraph.com/subgraphs/name/tornadocash/mainnet-tornado-pool-subgraph',
}

const client = new ApolloClient({
  uri: link,
  cache: new InMemoryCache(),
})

const registryClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/tornadocash/tornado-relayer-registry',
  cache: new InMemoryCache(),
})

async function getRegisters(fromBlock: number) {
  const { data } = await registryClient.query({
    context: {
      chainId: ChainId.MAINNET,
    },
    query: gql(GET_REGISTERED),
    variables: { first, fromBlock },
  })

  if (!data) {
    return []
  }

  return data.relayers
}

export async function getAccounts({ fromBlock, chainId }: Params): Promise<Accounts> {
  const { data } = await client.query({
    context: {
      chainId,
    },
    query: gql(GET_ACCOUNTS),
    variables: { first, fromBlock },
  })

  if (!data) {
    return []
  }

  return data.accounts
}

export async function getAllRegisters(fromBlock: number) {
  try {
    const relayers = await getRegisters(fromBlock)

    if (!relayers) {
      return { lastSyncBlock: '', events: [] }
    }

    const lastSyncBlock = await getRegisteredMeta()

    return { lastSyncBlock, events: relayers }
  } catch {
    return { lastSyncBlock: '', events: [] }
  }
}

export async function getAllAccounts({ fromBlock, chainId }: Params) {
  try {
    let accounts: Accounts = []

    while (true) {
      let result = await getAccounts({ fromBlock, chainId })

      if (isEmpty(result)) {
        break
      }

      if (result.length < breakLength) {
        accounts = accounts.concat(result)
        break
      }

      const [lastEvent] = result.slice(-numbers.ONE)

      result = result.filter((e) => e.blockNumber !== lastEvent.blockNumber)
      fromBlock = Number(lastEvent.blockNumber)

      accounts = accounts.concat(result)
    }

    if (!accounts) {
      return {
        lastSyncBlock: '',
        events: [],
      }
    }

    const lastSyncBlock = await getMeta({ chainId })

    const data = accounts.map((e) => ({
      key: e.key,
      owner: toChecksumAddress(e.owner),
      blockNumber: Number(e.blockNumber),
    }))

    const [lastEvent] = data.slice(-numbers.ONE)

    return {
      events: data,
      lastSyncBlock: lastEvent?.blockNumber > lastSyncBlock ? lastEvent.blockNumber + numbers.ONE : lastSyncBlock,
    }
  } catch {
    return {
      lastSyncBlock: '',
      events: [],
    }
  }
}

async function getRegisteredMeta() {
  try {
    const { data } = await registryClient.query({
      context: {
        chainId: ChainId.MAINNET,
      },
      query: gql(_META),
    })

    if (!data) {
      return undefined
    }

    return data._meta.block.number
  } catch {
    return undefined
  }
}

async function getMeta({ chainId }: Params) {
  try {
    const { data } = await client.query({
      context: {
        chainId,
      },
      query: gql(_META),
    })

    if (!data) {
      return undefined
    }

    return data._meta.block.number
  } catch {
    return undefined
  }
}
