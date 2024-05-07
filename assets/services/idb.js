const { deleteDB, openDB } = require('idb')

const VERSION_ERROR = 'less than the existing version'
const INDEX_DB_ERROR = 'A mutation operation was attempted on a database that did not allow mutations.'

const IDB_VERSION = 9

// TODO method for migration, remove indexed
class IndexedDB {
  constructor({ stores, dbName }) {
    this.dbExists = false
    this.isBlocked = false

    this.options = {
      upgrade(db) {
        Object.values(db.objectStoreNames).forEach((value) => {
          db.deleteObjectStore(value)
        })

        stores.forEach(({ name, keyPath, indexes }) => {
          const store = db.createObjectStore(name, {
            keyPath,
            autoIncrement: true,
          })

          if (Array.isArray(indexes)) {
            indexes.forEach(({ name, unique = false }) => {
              store.createIndex(name, String(name), { unique })
            })
          }
        })
      },
    }

    this.dbName = dbName
  }

  async initDB() {
    try {
      if (this.dbExists) {
        return
      }

      this.db = await openDB(this.dbName, IDB_VERSION, this.options) // version (optional): Schema version, or undefined to open the current version.
      this.onEventHandler()

      this.dbExists = true
    } catch (err) {
      // need for private mode firefox browser
      if (err.message.includes(INDEX_DB_ERROR)) {
        this.isBlocked = true
        return
      }

      if (err.message.includes(VERSION_ERROR)) {
        await this.removeExist()
      }

      console.error(`initDB has error: ${err.message}`)
    }
  }

  async createTransactions({ storeName, data, mode = 'readwrite' }) {
    try {
      const tx = this.db.transaction(storeName, mode)
      const storedItem = tx.objectStore(storeName)

      if (storedItem.add) {
        await storedItem.add(data)
        await tx.done
      }
    } catch (err) {
      throw new Error(`Method createTransactions has error: ${err.message}`)
    }
  }

  createMultipleTransactions({
    storeName,
    data,
    index,
    mode = 'readwrite',
  }) {
    try {
      const tx = this.db.transaction(storeName, mode)

      data.forEach((item) => {
        if (item && tx.store && tx.store.put) {
          tx.store.put({ ...item, ...index })
        }
      })
    } catch (err) {
      throw new Error(`Method createMultipleTransactions has error: ${err.message}`)
    }
  }

  async getFromIndex(params) {
    if (this.isBlocked) {
      return
    }

    try {
      const item = await this.getFromIndexHandler(params)
      return item
    } catch (err) {
      return undefined
    }
  }

  async getItem({ storeName, key }) {
    try {
      if (this.isBlocked) {
        return
      }

      const store = this.db.transaction(storeName).objectStore(storeName)

      const value = await store.get(key)
      return value
    } catch (err) {
      throw new Error(`Method getItem has error: ${err.message}`)
    }
  }

  async addItem({ storeName, data, key }) {
    try {
      const tx = this.db.transaction(storeName, 'readwrite')
      const isExist = await tx.objectStore(storeName).get(key)

      if (!isExist) {
        await tx.objectStore(storeName).add(data)
      }
    } catch (err) {
      throw new Error(`Method addItem has error: ${err.message}`)
    }
  }

  async putItem({ storeName, data }) {
    try {
      if (this.isBlocked) {
        return
      }

      const tx = this.db.transaction(storeName, 'readwrite')
      await tx.objectStore(storeName).put(data)
    } catch (err) {
      throw new Error(`Method putItem has error: ${err.message}`)
    }
  }

  async getAll({ storeName }) {
    try {
      if (this.isBlocked || !this.dbExists) {
        return []
      }

      const tx = this.db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const data = await store.getAll()
      return data
    } catch (err) {
      throw new Error(`Method getAll has error: ${err.message}`)
    }
  }

  async clearStore({ storeName, mode = 'readwrite' }) {
    try {
      const tx = this.db.transaction(storeName, mode)
      const storedItem = tx.objectStore(storeName)

      if (storedItem.clear) {
        await storedItem.clear()
      }
    } catch (err) {
      throw new Error(`Method clearStore has error: ${err.message}`)
    }
  }

  async getAllFromIndex(params) {
    if (this.isBlocked) {
      return []
    }

    try {
      const items = await this.getAllFromIndexHandler(params)
      return items
    } catch (err) {
      return []
    }
  }

  onEventHandler() {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.db.addEventListener('onupgradeneeded', async () => {
      await this.removeExist()
    })
  }

  async removeExist() {
    await deleteDB(this.dbName)
    this.dbExists = false

    await this.initDB()
  }

  async getFromIndexHandler({ storeName, indexName, key }) {
    try {
      const value = await this.db.getFromIndex(storeName, indexName, key)
      return value
    } catch (err) {
      throw new Error(`Method getFromIndexHandler has error: ${err.message}`)
    }
  }

  async getAllFromIndexHandler({ storeName, indexName, key, count }) {
    try {
      const value = await this.db.getAllFromIndex(storeName, indexName, key, count)
      return value
    } catch (err) {
      throw new Error(`Method getAllFromIndex has error: ${err.message}`)
    }
  }
}

module.exports = { IndexedDB }
