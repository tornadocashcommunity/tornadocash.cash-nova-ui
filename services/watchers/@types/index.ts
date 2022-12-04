import { Event } from 'effector'

export type JobWatcherParams = {
  url: string
  abort: Event<void>
  start: Event<void>
}

export type WatcherParams = {
  url: string
  id: string
  callback?: CallableFunction
}

export type JobResponse = {
  status: string
  txHash?: string
  failedReason: string
}
