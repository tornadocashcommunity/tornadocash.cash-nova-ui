import { Plugin } from '@nuxt/types'
import { StoreNames } from 'idb/build/esm/entry'

import { IndexDBStores, KeyPaths } from '@/services/idb/@types'

import { IndexedDB } from '@/services'
import { L1_CHAIN_ID } from '@/constants'

type Store = {
  keyPath: KeyPaths
  name: StoreNames<unknown>
}

type IDBOptions = {
  dbName: string
  stores: Store[]
}

type DBSchema = {
  [key in string]: {
    key: KeyPaths
    value: never
    indexes?: { [key in string]: KeyPaths }
  }
}

const stores = [
  {
    keyPath: KeyPaths.KEY,
    name: `${IndexDBStores.ACCOUNT_EVENTS}_${L1_CHAIN_ID}`,
    indexes: [
      { name: 'key', unique: true },
      { name: 'owner', unique: false },
    ],
  },
  {
    name: IndexDBStores.REGISTER_EVENTS,
    keyPath: KeyPaths.INDEX,
  },
  {
    name: IndexDBStores.LAST_EVENTS,
    keyPath: KeyPaths.NAME,
    indexes: [{ name: 'name', unique: false }],
  },
]

const idbPlugin: Plugin = async (ctx, inject) => {
  const options: IDBOptions = {
    stores,
    dbName: 'tornado_pool_account',
  }

  const instance = new IndexedDB<DBSchema>(options)

  await instance.initDB()

  inject('indexedDB', instance)
}

export default idbPlugin
