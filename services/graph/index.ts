import { Operation } from '@apollo/client/link/core'
import { ApolloClient, InMemoryCache, gql } from '@apollo/client/core'

import { ChainId } from '@/types'
import { numbers } from '@/constants'
import { isEmpty, toChecksumAddress } from '@/utilities'

import { Params, Accounts, Commitments, Nullifiers } from './@types'
import { _META, GET_ACCOUNTS, GET_REGISTERED, GET_COMMITMENT, GET_NULLIFIER } from './queries'

const first = 1000
const breakLength = 900

const link = (operation: Operation) => {
  const { chainId } = operation.getContext()
  return CHAIN_GRAPH_URLS[chainId]
}

const CHAIN_GRAPH_URLS: { [chainId in ChainId]: string } = {
  [ChainId.BSC]: 'https://api.thegraph.com/subgraphs/name/dan1kov/bsc-tornado-pool-subgraph',
  [ChainId.MAINNET]: 'https://tornadocash-rpc.com/subgraphs/name/tornadocash/mainnet-tornado-pool-subgraph',
  [ChainId.XDAI]: 'https://tornadocash-rpc.com/subgraphs/name/tornadocash/gnosis-tornado-nova-subgraph',
}

const client = new ApolloClient({
  uri: link,
  cache: new InMemoryCache(),
})

const registryClient = new ApolloClient({
  uri: 'https://tornadocash-rpc.com/subgraphs/name/tornadocash/tornado-relayer-registry',
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


export async function getCommitments({ fromBlock, chainId }: Params): Promise<{
  results: Commitments,
  lastSyncBlock: number
}> {
  const { data } = await client.query({
    context: {
      chainId,
    },
    query: gql(GET_COMMITMENT),
    variables: { first, fromBlock },
  })

  if (!data) {
    return {
      results: [],
      lastSyncBlock: data._meta.block.number
    }
  }

  return {
    results: data.commitments,
    lastSyncBlock: data._meta.block.number
  }
}

export async function getAllCommitments({ fromBlock, chainId }: Params) {
  try {
    let commitments: Commitments = []
    let lastSyncBlock

    while (true) {
      let { results, lastSyncBlock: lastBlock } = await getCommitments({ fromBlock, chainId })

      lastSyncBlock = lastBlock

      if (isEmpty(results)) {
        break
      }

      if (results.length < breakLength) {
        commitments = commitments.concat(results)
        break
      }

      const [lastEvent] = results.slice(-numbers.ONE)

      results = results.filter((e) => e.blockNumber !== lastEvent.blockNumber)
      fromBlock = Number(lastEvent.blockNumber)

      commitments = commitments.concat(results)
    }

    if (!commitments) {
      return {
        lastSyncBlock,
        events: [],
      }
    }

    const data = commitments
      .map((e) => ({
        index: Number(e.index),
        commitment: e.commitment,
        blockNumber: Number(e.blockNumber),
        encryptedOutput: e.encryptedOutput,
        transactionHash: e.transactionHash
      }))
      .sort((a, b) => a.index - b.index)

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

export async function getNullifiers({ fromBlock, chainId }: Params): Promise<{
  results: Nullifiers,
  lastSyncBlock: number
}> {
  const { data } = await client.query({
    context: {
      chainId,
    },
    query: gql(GET_NULLIFIER),
    variables: { first, fromBlock },
  })

  if (!data) {
    return {
      results: [],
      lastSyncBlock: data._meta.block.number
    }
  }

  return {
    results: data.nullifiers,
    lastSyncBlock: data._meta.block.number
  }
}

export async function getAllNullifiers({ fromBlock, chainId }: Params) {
  try {
    let nullifiers: Nullifiers = []
    let lastSyncBlock

    while (true) {
      let { results, lastSyncBlock: lastBlock } = await getNullifiers({ fromBlock, chainId })

      lastSyncBlock = lastBlock

      if (isEmpty(results)) {
        break
      }

      if (results.length < breakLength) {
        nullifiers = nullifiers.concat(results)
        break
      }

      const [lastEvent] = results.slice(-numbers.ONE)

      results = results.filter((e) => e.blockNumber !== lastEvent.blockNumber)
      fromBlock = Number(lastEvent.blockNumber)

      nullifiers = nullifiers.concat(results)
    }

    if (!nullifiers) {
      return {
        lastSyncBlock,
        events: [],
      }
    }

    const data = nullifiers.map((e) => ({
      nullifier: e.nullifier,
      blockNumber: Number(e.blockNumber),
      transactionHash: e.transactionHash
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