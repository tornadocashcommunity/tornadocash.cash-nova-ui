import { BigNumber } from 'ethers'
import { namehash } from 'ethers/lib/utils'

import { ChainId } from '@/types'
import { IDB, IndexDBStores } from '@/services/idb/@types'
import { ExtendedProvider } from '@/services/ether/ExtendedProvider'

import { getAllRegisters } from '@/services'
import { toChecksumAddress } from '@/utilities'
import { Aggregator, RelayerRegistry } from '@/_contracts'
import { getAggregator, getRelayerRegistry } from '@/contracts'
import { CHAINS, numbers, REGISTRY_DEPLOYED_BLOCK } from '@/constants'

import {
  GraphData,
  EventRelayer,
  ValidRelayers,
  EventRelayerList,
  AggregatorRelayer,
  GraphRelayerEvent,
  SaveRegisteredEventsParams,
} from './@types'

const MIN_STAKE_BALANCE = '0x22B1C8C1227A00000' // 40 TORN

class RelayerRegister {
  public provider: ExtendedProvider
  public aggregator: Aggregator
  public subdomains: string[]
  public relayerRegistry: RelayerRegistry
  // @ts-expect-error
  public $indexedDB: IDB

  public constructor(provider: ExtendedProvider) {
    this.provider = provider
    this.$indexedDB = window.$nuxt.$indexedDB
    this.subdomains = Object.values(CHAINS).map(({ ensSubdomainKey }) => ensSubdomainKey)

    this.aggregator = getAggregator(ChainId.MAINNET)
    this.relayerRegistry = getRelayerRegistry(ChainId.MAINNET)
  }

  public getRelayers = async (ensSubdomainKey: string) => {
    const relayers = await this.fetchRelayers()

    const validRelayers = await this.getValidRelayers(relayers, ensSubdomainKey)

    return validRelayers
  }

  private readonly fetchRelayers = async () => {
    // eslint-disable-next-line prefer-const
    let { blockFrom, blockTo, cachedEvents = [] } = await this.getCachedData()
    let allRelayers = cachedEvents

    if (blockFrom !== blockTo) {
      const registeredRelayersEvents: GraphData = await getAllRegisters(blockFrom)

      let relayers = {
        lastSyncBlock: registeredRelayersEvents.lastSyncBlock,
        events: registeredRelayersEvents.events.map((el: GraphRelayerEvent) => ({
          ensName: el.ensName,
          relayerAddress: toChecksumAddress(el.address),
        })),
      }

      const isGraphLate = relayers.lastSyncBlock && blockTo > Number(relayers.lastSyncBlock)

      if (isGraphLate) {
        blockFrom = relayers.lastSyncBlock
      }

      if (!relayers.events.length || isGraphLate) {
        const multicallEvents = await this.fetchEvents(blockFrom, blockTo)
        const eventsRelayers = multicallEvents.map((el) => ({
          ensName: el.ensName,
          relayerAddress: el.relayerAddress,
        }))

        relayers = {
          lastSyncBlock: blockTo,
          events: relayers.events.concat(eventsRelayers),
        }
      }

      await this.saveEvents({ storeName: 'register_events', ...relayers })
      allRelayers = allRelayers.concat(relayers.events)
    }

    return allRelayers
  }

  private readonly fetchEvents = async (fromBlock: number, toBlock: number): Promise<EventRelayerList> => {
    if (fromBlock <= toBlock) {
      try {
        const filterRegisteredRelayers = this.relayerRegistry.filters.RelayerRegistered()
        const registeredEventsPart = await this.relayerRegistry.queryFilter(filterRegisteredRelayers, fromBlock, toBlock)

        return registeredEventsPart.map((el) => el.args)
      } catch (error) {
        const midBlock = (fromBlock + toBlock) >> numbers.ONE

        if (midBlock - fromBlock < numbers.TWO) {
          throw new Error(`error fetching events: ${error.message}`)
        }

        const arr1 = await this.fetchEvents(fromBlock, midBlock)
        const arr2 = await this.fetchEvents(midBlock + numbers.ONE, toBlock)
        return [...arr1, ...arr2]
      }
    }
    return []
  }

  private readonly getCachedData = async () => {
    const blockTo = await this.provider.getBlockNumber()
    let blockFrom = REGISTRY_DEPLOYED_BLOCK[ChainId.MAINNET]

    const cachedEvents = await this.$indexedDB.getAll({
      storeName: IndexDBStores.REGISTER_EVENTS,
    })

    const lastBlock: { blockNumber: number } = await this.$indexedDB.getFromIndex({
      indexName: 'name',
      storeName: IndexDBStores.LAST_EVENTS,
      key: IndexDBStores.REGISTER_EVENTS as unknown as IDBKeyRange,
    })

    if (lastBlock) {
      blockFrom = blockTo > lastBlock.blockNumber ? lastBlock.blockNumber + numbers.ONE : blockTo
    }

    return { blockFrom, blockTo, cachedEvents }
  }

  private readonly saveEvents = async ({ events, lastSyncBlock, storeName }: SaveRegisteredEventsParams) => {
    try {
      if (this.$indexedDB.isBlocked) {
        return
      }

      await this.$indexedDB.putItem({
        data: {
          blockNumber: lastSyncBlock,
          name: storeName,
        },
        storeName: IndexDBStores.LAST_EVENTS,
      })

      if (events.length) {
        this.$indexedDB.createMultipleTransactions({ data: events, storeName })
      }
    } catch (err) {
      console.error(`saveEvents has error: ${err.message}`)
    }
  }

  private readonly filterRelayer = (
    acc: ValidRelayers,
    curr: AggregatorRelayer,
    ensSubdomainKey: string,
    relayer: EventRelayer,
  ): ValidRelayers => {
    const subdomainIndex = this.subdomains.indexOf(ensSubdomainKey)

    const [mainnetSubdomain] = curr.records
    const hostname = curr.records[subdomainIndex]
    const isHostWithProtocol = hostname.includes('http')

    const isOwner = relayer.relayerAddress === curr.owner
    const hasMinBalance = BigNumber.from(curr.balance).gte(MIN_STAKE_BALANCE)

    if (hostname && isOwner && mainnetSubdomain && curr.isRegistered && hasMinBalance && !isHostWithProtocol) {
      acc.push({
        relayerAddress: relayer.relayerAddress,
        ensName: `${ensSubdomainKey}.${relayer.ensName}`,
        hostname: `${window.location.protocol}//${hostname}`,
      })
    } else {
      // console.error(`${relayer.ensName} invalid: `, {
      //   isOwner,
      //   hasTXT: Boolean(hostname),
      //   isHasMinBalance: hasMinBalance,
      //   isRegistered: curr.isRegistered,
      //   isHostWithoutProtocol: !isHostWithProtocol,
      //   isMainnetSubdomain: Boolean(mainnetSubdomain),
      // })
    }

    return acc
  }

  private readonly getValidRelayers = async (relayers: EventRelayerList, ensSubdomainKey: string): Promise<ValidRelayers> => {
    const relayerNameHashes = relayers.map((r) => namehash(r.ensName))

    const eventsRelayersData = await this.aggregator.callStatic.relayersData(relayerNameHashes, this.subdomains)
    const relayersData = eventsRelayersData.map((el) => ({
      owner: el.owner,
      balance: el.balance,
      records: el.records,
      isRegistered: el.isRegistered,
    }))

    return relayersData.reduce(
      (acc: ValidRelayers, curr: AggregatorRelayer, index: number) =>
        this.filterRelayer(acc, curr, ensSubdomainKey, relayers[index]),
      [],
    )
  }
}

export const relayerRegister = (provider: ExtendedProvider) => new RelayerRegister(provider)
