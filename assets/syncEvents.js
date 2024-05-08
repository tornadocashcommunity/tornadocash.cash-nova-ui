import path from 'path'
import { stat, readFile, writeFile } from 'fs/promises'
import { Contract, providers, utils } from 'ethers'

import { BatchEventsService } from './services/batch'
import { getAllAccounts, getAllCommitments, getAllNullifiers } from './services/graph'
import { POOL_CONTRACT, BRIDGE_HELPER, RPC_LIST, ChainId, CHAINS, numbers } from './services/constants'
import { zipAsync, unzipAsync } from './services/zip'
import { poolAbi } from './services/pool'
import { bridgeAbi } from './services/bridgeHelper'

const { getAddress } = utils
const { StaticJsonRpcProvider } = providers

const EVENT_PATH = './static'

async function existsAsync(fileOrDir) {
  try {
    await stat(fileOrDir);

    return true;
  } catch {
    return false;
  }
}

const getProvider = (chainId) => {
  return new StaticJsonRpcProvider({ skipFetchSetup: true, url: RPC_LIST[chainId] }, chainId)
}

const getTornadoPool = (chainId, provider) => {
  const TornadoPool = new Contract(POOL_CONTRACT[chainId], poolAbi, provider)

  return {
    TornadoPool,
    BatchEventsService: new BatchEventsService({
      provider,
      contract: TornadoPool
    })
  }
}

const getBridgeHelper = (chainId, provider) => {
  const BridgeHelper = new Contract(BRIDGE_HELPER[chainId], bridgeAbi, provider)

  return {
    BridgeHelper,
    BridgeEventsService: new BatchEventsService({
      provider,
      contract: BridgeHelper
    })
  }
}

const loadEvents = async (fileName, deployedBlock) => {
  fileName = fileName.toLowerCase()

  const filePath = path.join(EVENT_PATH, fileName + '.zip')

  if (!(await existsAsync(filePath))) {
    return {
      events: [],
      lastBlock: deployedBlock
    }
  }

  try {
    const data = await readFile(filePath)
    const { [fileName]: content } = await unzipAsync(data)

    const events = JSON.parse(new TextDecoder().decode(content))

    const lastBlock = events && Array.isArray(events) && events[events.length - 1]
      ? events[events.length - 1].blockNumber
      :  deployedBlock

    return {
      events,
      lastBlock
    }
  } catch {
    return {
      events: [],
      lastBlock: deployedBlock
    }
  }
}

const saveEvents = async (fileName, events) => {
  fileName = fileName.toLowerCase()

  const filePath = path.join(EVENT_PATH, fileName + '.zip')

  const payload = await zipAsync({
    [fileName]: new TextEncoder().encode(JSON.stringify(events, null, 2) + '\n')
  })

  await writeFile(filePath, payload)
}

const syncAccounts = async (chainId, BatchEventsService) => {
  const fileName = `accounts_${chainId}.json`

  console.log(`Syncing ${fileName}`)

  const cachedEvents = await loadEvents(fileName, CHAINS[chainId].deployBlock) 

  const events = [...cachedEvents.events]
  let fromBlock = cachedEvents.lastBlock + numbers.ONE

  console.log({
    cachedEvents: events.length,
    cachedBlock: fromBlock
  })

  const { events: graphEvents, lastSyncBlock } = await getAllAccounts({
    fromBlock,
    chainId
  })

  console.log({
    graphEvents: graphEvents.length,
    graphBlock: lastSyncBlock
  })

  if (lastSyncBlock) {
    events.push(...graphEvents)
    fromBlock = lastSyncBlock
  }

  let nodeEvents = await BatchEventsService.getBatchEvents({
    fromBlock,
    type: 'PublicKey'
  })

  console.log({
    nodeEvents: nodeEvents.length,
    nodeBlock: nodeEvents && nodeEvents[nodeEvents.length - 1] ? nodeEvents[nodeEvents.length - 1].blockNumber : undefined
  })

  if (nodeEvents && nodeEvents.length) {
    nodeEvents = nodeEvents.map(({ blockNumber, args }) => ({
      key: args.key,
      owner: getAddress(args.owner),
      blockNumber,
    }))

    events.push(...nodeEvents)
  }

  await saveEvents(fileName, events)
}

const syncCommitments = async (chainId, BatchEventsService) => {
  const fileName = `commitments_${chainId}.json`

  console.log(`Syncing ${fileName}`)

  const cachedEvents = await loadEvents(fileName, CHAINS[chainId].deployBlock) 

  const events = [...cachedEvents.events]
  let fromBlock = cachedEvents.lastBlock + numbers.ONE

  console.log({
    cachedEvents: events.length,
    cachedBlock: fromBlock
  })

  const { events: graphEvents, lastSyncBlock } = await getAllCommitments({
    fromBlock,
    chainId
  })

  console.log({
    graphEvents: graphEvents.length,
    graphBlock: lastSyncBlock
  })

  if (lastSyncBlock) {
    events.push(...graphEvents)
    fromBlock = lastSyncBlock
  }

  let nodeEvents = await BatchEventsService.getBatchEvents({
    fromBlock,
    type: 'NewCommitment'
  })

  console.log({
    nodeEvents: nodeEvents.length,
    nodeBlock: nodeEvents && nodeEvents[nodeEvents.length - 1] ? nodeEvents[nodeEvents.length - 1].blockNumber : undefined
  })

  if (nodeEvents && nodeEvents.length) {
    nodeEvents = nodeEvents.map(({ blockNumber, transactionHash, args }) => ({
      blockNumber,
      transactionHash,
      index: Number(args.index),
      commitment: args.commitment,
      encryptedOutput: args.encryptedOutput,
    }))

    events.push(...nodeEvents)
  }

  await saveEvents(fileName, events)
}

const syncNullifiers = async (chainId, BatchEventsService) => {
  const fileName = `nullifiers_${chainId}.json`

  console.log(`Syncing ${fileName}`)

  const cachedEvents = await loadEvents(fileName, CHAINS[chainId].deployBlock) 

  const events = [...cachedEvents.events]
  let fromBlock = cachedEvents.lastBlock + numbers.ONE

  console.log({
    cachedEvents: events.length,
    cachedBlock: fromBlock
  })

  const { events: graphEvents, lastSyncBlock } = await getAllNullifiers({
    fromBlock,
    chainId
  })

  console.log({
    graphEvents: graphEvents.length,
    graphBlock: lastSyncBlock
  })

  if (lastSyncBlock) {
    events.push(...graphEvents)
    fromBlock = lastSyncBlock
  }

  let nodeEvents = await BatchEventsService.getBatchEvents({
    fromBlock,
    type: 'NewNullifier'
  })

  console.log({
    nodeEvents: nodeEvents.length,
    nodeBlock: nodeEvents && nodeEvents[nodeEvents.length - 1] ? nodeEvents[nodeEvents.length - 1].blockNumber : undefined
  })

  if (nodeEvents && nodeEvents.length) {
    nodeEvents = nodeEvents.map(({ blockNumber, transactionHash, args }) => ({
      blockNumber,
      transactionHash,
      nullifier: args.nullifier,
    }))

    events.push(...nodeEvents)
  }

  await saveEvents(fileName, events)
}

const main = async () => {
  const chainId = ChainId.XDAI

  const ethChainId = ChainId.MAINNET

  const provider = getProvider(chainId)

  const ethProvider = getProvider(ethChainId)
  
  const { BatchEventsService } = getTornadoPool(chainId, provider)

  const { BridgeEventsService } = getBridgeHelper(ethChainId, ethProvider)

  console.log(`Connected with ${chainId}: (block: ${await provider.getBlockNumber()})`)

  console.log(`Connected with ${ethChainId}: (block: ${await ethProvider.getBlockNumber()})`)

  await syncAccounts(ethChainId, BridgeEventsService)

  await syncCommitments(chainId, BatchEventsService)

  await syncNullifiers(chainId, BatchEventsService)
}
main()