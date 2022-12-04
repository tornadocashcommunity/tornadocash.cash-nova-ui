import { omit } from 'lodash'

import { soliditySha3 } from 'web3-utils'

import { getIsWhitelistedDomain } from '@/utilities'

let isSessionStorageEnabled: boolean | null = null

try {
  window.sessionStorage.setItem('test', 'test')
  window.sessionStorage.removeItem('test')
  isSessionStorageEnabled = true
} catch {
  isSessionStorageEnabled = false
}

const getItem = (value: string) => {
  try {
    return JSON.parse(String(value))
  } catch {
    return value
  }
}

interface Storage {
  set: (key: string, value: string | object) => void
  get: (key: string) => string | object | undefined
  remove: (key: string) => void
  clear: () => void
}

class PrivateStorage implements Storage {
  private storage: Record<string, string>

  public constructor() {
    this.storage = {}
  }

  public set(key: string, value: string | object) {
    const storageKey = soliditySha3(key)

    if (!storageKey) {
      return
    }

    const storageItem = JSON.stringify({
      data: value,
      timeStamp: Date.now(),
    })

    this.storage[storageKey] = storageItem

    if (isSessionStorageEnabled && getIsWhitelistedDomain()) {
      window.sessionStorage.setItem(storageKey, storageItem)
    }
  }

  public get(key: string) {
    const storageKey = soliditySha3(key)

    if (!storageKey) {
      return
    }

    if (isSessionStorageEnabled) {
      const value = window.sessionStorage.getItem(storageKey)
      if (value) {
        return getItem(value)
      }
    }

    const storageValue = this.storage[storageKey]
    if (storageValue) {
      return getItem(this.storage[storageKey])
    }

    return undefined
  }

  public remove(key: string) {
    const storageKey = soliditySha3(key)
    if (!storageKey) {
      return
    }

    this.storage = omit(this.storage, storageKey)

    if (isSessionStorageEnabled) {
      window.sessionStorage.removeItem(storageKey)
    }
  }

  public clear() {
    this.storage = {}

    if (isSessionStorageEnabled) {
      window.sessionStorage.clear()
    }
  }
}

export const privateStorage = new PrivateStorage()
