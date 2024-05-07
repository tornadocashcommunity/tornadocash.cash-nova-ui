import { Provider, Contract, EventLog } from "ethers";
import { sleep, getBatches } from "@/utilities";

export interface BatchEventServiceConstructor {
  provider: Provider;
  contract: Contract;
  concurrencySize?: number;
  blocksPerRequest?: number;
  shouldRetry?: boolean;
  retryMax?: number;
  retryOn?: number;
}

export type EventInput = {
  fromBlock: number;
  toBlock: number;
  type: string;
};

export class BatchEventsService {
  provider: Provider;
  contract: Contract;
  concurrencySize: number;
  blocksPerRequest: number;
  shouldRetry: boolean;
  retryMax: number;
  retryOn: number;
  constructor({
    provider,
    contract,
    concurrencySize = 10,
    blocksPerRequest = 2000,
    shouldRetry = true,
    retryMax = 5,
    retryOn = 500,
  }: BatchEventServiceConstructor) {
    this.provider = provider;
    this.contract = contract;
    this.concurrencySize = concurrencySize;
    this.blocksPerRequest = blocksPerRequest;
    this.shouldRetry = shouldRetry;
    this.retryMax = retryMax;
    this.retryOn = retryOn;
  }

  async getPastEvents({ fromBlock, toBlock, type }: EventInput): Promise<EventLog[]> {
    let err;
    let retries = 0;

    // eslint-disable-next-line no-unmodified-loop-condition
    while ((!this.shouldRetry && retries === 0) || (this.shouldRetry && retries < this.retryMax)) {
      try {
        return (await this.contract.queryFilter(type, fromBlock, toBlock)) as EventLog[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        err = e;
        retries++;

        // If provider.getBlockNumber returned last block that isn't accepted (happened on Avalanche/Gnosis),
        // get events to last accepted block
        if (e.message.includes('after last accepted block')) {
          const acceptedBlock = parseInt(e.message.split('after last accepted block ')[1]);
          toBlock = acceptedBlock;
        }

        // retry on 0.5 seconds
        await sleep(this.retryOn);
      }
    }

    throw err;
  }

  createBatchRequest(batchArray: EventInput[]): Promise<EventLog[]>[] {
    return batchArray.map(async (event: EventInput, index: number) => {
      await sleep(20 * index);

      return this.getPastEvents(event);
    });
  }

  async getBatchEvents({ fromBlock, toBlock, type = '*' }: EventInput): Promise<EventLog[]> {
    if (!toBlock) {
      toBlock = await this.provider.getBlockNumber();
    }

    const eventsToSync: EventInput[] = [];

    for (let i = fromBlock; i < toBlock; i += this.blocksPerRequest) {
      const j = i + this.blocksPerRequest - 1 > toBlock ? toBlock : i + this.blocksPerRequest - 1;

      eventsToSync.push({ fromBlock: i, toBlock: j, type } as EventInput);
    }

    const events = [];
    const eventChunk = getBatches<EventInput>(eventsToSync, this.concurrencySize);

    let chunkCount = 0;

    for (const chunk of eventChunk) {
      chunkCount++;

      const fetchedEvents = (await Promise.all(this.createBatchRequest(chunk))).flat();
      events.push(...fetchedEvents);
    }

    return events;
  }
}
