import { isEmpty } from 'lodash'
import { ApolloClient, InMemoryCache, gql } from '@apollo/client/core'
import { utils } from 'ethers'

import { GET_ACCOUNTS, GET_COMMITMENT, GET_NULLIFIER } from './queries'
import { ChainId, numbers } from '../constants'

const { getAddress } = utils

const first = 1000
const breakLength = 900

const CHAIN_GRAPH_URLS = {
  [ChainId.BSC]: 'https://api.thegraph.com/subgraphs/name/dan1kov/bsc-tornado-pool-subgraph',
  [ChainId.MAINNET]: 'https://tornadocash-rpc.com/subgraphs/name/tornadocash/mainnet-tornado-pool-subgraph',
  [ChainId.XDAI]: 'https://tornadocash-rpc.com/subgraphs/name/tornadocash/gnosis-tornado-nova-subgraph',
}

const link = (operation) => {
  const { chainId } = operation.getContext()
  return CHAIN_GRAPH_URLS[chainId]
}

const client = new ApolloClient({
  uri: link,
  cache: new InMemoryCache(),
})

export async function getAccounts({ fromBlock, chainId }) {
  const { data } = await client.query({
    context: {
      chainId,
    },
    query: gql(GET_ACCOUNTS),
    variables: { first, fromBlock },
  })

  if (!data) {
    return {
      results: [],
      lastSyncBlock: data._meta.block.number
    }
  }

  return {
    results: data.accounts,
    lastSyncBlock: data._meta.block.number
  }
}

export async function getAllAccounts({ fromBlock, toBlock, chainId }) {
  try {
    let accounts = []
    let lastSyncBlock

    while (true) {
      let { results, lastSyncBlock: lastBlock } = await getAccounts({ fromBlock, chainId })

      lastSyncBlock = lastBlock

      if (isEmpty(results)) {
        break
      }

      if (results.length < breakLength) {
        accounts = accounts.concat(results)
        break
      }

      const [lastEvent] = results.slice(-numbers.ONE)

      results = results.filter((e) => e.blockNumber !== lastEvent.blockNumber)
      fromBlock = Number(lastEvent.blockNumber)

      accounts = accounts.concat(results)

      if (toBlock && fromBlock >= Number(toBlock)) {
        break
      }
    }

    if (!accounts) {
      return {
        lastSyncBlock,
        events: [],
      }
    }

    const data = accounts.map((e) => ({
      key: e.key,
      owner: getAddress(e.owner),
      blockNumber: Number(e.blockNumber),
    }))

    const [lastEvent] = data.slice(-numbers.ONE)

    return {
      events: data,
      lastSyncBlock: (lastEvent && lastEvent.blockNumber >= lastSyncBlock)
        ? lastEvent.blockNumber + numbers.ONE
        : lastSyncBlock,
    }
  } catch (err) {
    console.log('Error from getAllAccounts')
    console.log(err)
    return {
      lastSyncBlock: '',
      events: [],
    }
  }
}

export async function getCommitments({ fromBlock, chainId }) {
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

export async function getAllCommitments({ fromBlock, toBlock, chainId }) {
  try {
    let commitments = []
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

      if (toBlock && fromBlock >= Number(toBlock)) {
        break
      }
    }

    if (!commitments) {
      return {
        lastSyncBlock,
        events: [],
      }
    }

    const data = commitments.map((e) => ({
      blockNumber: Number(e.blockNumber),
      transactionHash: e.transactionHash,
      index: Number(e.index),
      commitment: e.commitment,
      encryptedOutput: e.encryptedOutput
    }))

    const [lastEvent] = data.slice(-numbers.ONE)

    return {
      events: data,
      lastSyncBlock: (lastEvent && lastEvent.blockNumber >= lastSyncBlock)
        ? lastEvent.blockNumber + numbers.ONE
        : lastSyncBlock,
    }
  } catch (err) {
    console.log('Error from getAllCommitments')
    console.log(err)
    return {
      lastSyncBlock: '',
      events: [],
    }
  }
}

export async function getNullifiers({ fromBlock, chainId }) {
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

export async function getAllNullifiers({ fromBlock, chainId }) {
  try {
    let nullifiers = []
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
      lastSyncBlock: (lastEvent && lastEvent.blockNumber >= lastSyncBlock)
        ? lastEvent.blockNumber + numbers.ONE
        : lastSyncBlock,
    }
  } catch (err) {
    console.log('Error from getAllNullifiers')
    console.log(err)
    return {
      lastSyncBlock: '',
      events: [],
    }
  }
}