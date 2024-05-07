const { isEmpty } = require('lodash')
const { ApolloClient, InMemoryCache, gql } = require('@apollo/client/core')

const { GET_COMMITMENT, GET_NULLIFIER } = require('./queries')
const { ChainId, numbers } = require('../constants')

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

async function getCommitments({ fromBlock, chainId }) {
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

async function getAllCommitments({ fromBlock, chainId }) {
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
    }

    if (!commitments) {
      return {
        lastSyncBlock,
        events: [],
      }
    }

    const data = commitments.map((e) => ({
      index: Number(e.index),
      commitment: e.commitment,
      blockNumber: Number(e.blockNumber),
      encryptedOutput: e.encryptedOutput,
      transactionHash: e.transactionHash
    }))

    const [lastEvent] = data.slice(-numbers.ONE)

    return {
      events: data,
      lastSyncBlock: (lastEvent && lastEvent.blockNumber > lastSyncBlock)
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

async function getNullifiers({ fromBlock, chainId }) {
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

async function getAllNullifiers({ fromBlock, chainId }) {
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
      lastSyncBlock: (lastEvent && lastEvent.blockNumber > lastSyncBlock)
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

module.exports = {
  getAllCommitments,
  getAllNullifiers
}