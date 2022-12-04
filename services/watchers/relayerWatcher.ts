import axios from 'axios'
import { createEffect, createEvent, guard, forward, createStore } from 'effector'

import { JobInfo } from '@/types/store/relayer'
import { numbers, jobStatuses } from '@/constants'

import { JobWatcherParams, WatcherParams, JobResponse } from './@types'

async function getJobData(url: string): Promise<JobInfo> {
  try {
    const { data } = await axios.get(url)
    return data
  } catch (err) {
    return {
      status: 'pending',
      confirmations: 0,
    }
  }
}

async function wait(ms: number) {
  return await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function createJobWatcher(id: string, { start, abort, url }: JobWatcherParams) {
  try {
    const $working = createStore(true, { name: `${id}Working` })
    const tick = createEvent<JobResponse>(`${id}Tick`)
    const timerFx = createEffect(`${id}Timer`).use(async () => {
      try {
        const result = await getJobData(url)

        await wait(numbers.SECOND)

        return result
      } catch (err) {
        return ''
      }
    })

    $working.on(abort, () => false).on(start, () => true)

    guard({
      source: start,
      filter: timerFx.pending.map((is) => !is),
      // @ts-expect-error TODO typing
      target: tick,
    })

    forward({
      from: tick,
      to: timerFx,
    })

    const willTick = guard({
      source: timerFx.done.map((params) => {
        return params.result
      }),
      filter: () => true,
    })

    guard({
      source: willTick,
      filter: $working,
      target: tick,
    })

    return { tick }
  } catch (err) {
    throw new Error(err.message)
  }
}

async function startWatcher({ url, id, callback }: WatcherParams) {
  return await new Promise((resolve, reject) => {
    const start = createEvent()
    const abort = createEvent()

    const jobWatcher = createJobWatcher(id, { start, abort, url })

    jobWatcher.tick.watch((data) => {
      if (callback && typeof callback === 'function' && data) {
        callback({
          id,
          status: data.status,
          txHash: data.txHash,
          error: data.failedReason,
        })
      }

      switch (data?.status) {
        case jobStatuses.CONFIRMED:
          abort()
          resolve(data.txHash)
          break
        case jobStatuses.MINED:
          abort()
          resolve(data.txHash)
          break
        case jobStatuses.FAILED:
          abort()
          reject(new Error(data.failedReason))
          break
      }
    })

    start()
  })
}

export const relayerWatcher = { createJobWatcher, getJobData, startWatcher }
