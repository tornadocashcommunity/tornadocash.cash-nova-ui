// debug
// date +%s > dist/index.html & node ipfsUpload.js

import dotenv from 'dotenv'

import fs from 'fs'
import axios from 'axios'
import { resolve } from 'path'
import FormData from 'form-data'

dotenv.config()

// it's dangerous to set MAX_PINS to 1
const MAX_PINS = 5

const numbers = {
  ONE: 1,
  TWO: 2,
}
const baseUrl = `https://api.pinata.cloud`
const src = process.argv[numbers.TWO] || './dist'
const headers = {
  pinata_api_key: String(process.env.PINATA_API_KEY),
  pinata_secret_api_key: String(process.env.PINATA_SECRET_API_KEY),
}

async function removeOldPins() {
  const maxPins = MAX_PINS - numbers.ONE

  const res = await axios.get(`${baseUrl}/data/pinList?pageOffset=${maxPins}&status=pinned`, {
    headers,
  })

  const { count, rows } = res.data

  if (count && count > maxPins) {
    for (const { ipfs_pin_hash: ipfsPinHash } of rows) {
      await axios.delete(`${baseUrl}/pinning/unpin/${ipfsPinHash}`, {
        headers,
      })
      console.log(`Successfully removed pin: ${ipfsPinHash}`)
    }
  }
}

async function pinBuild() {
  console.log('Make sure you have latest build. Run `yarn generate` if necessary.')
  const files = await readDir(src)

  const data = new FormData()
  for await (const file of files) {
    // for each file stream, we need to include the correct relative file path
    data.append(`file`, fs.createReadStream(file), {
      filepath: basePathConverter(src, file),
    })
  }

  const res = await axios.post(`${baseUrl}/pinning/pinFileToIPFS`, data, {
    maxBodyLength: Infinity, // this is needed to prevent axios from erroring out with large directories
    headers: {
      'Content-Type': `multipart/form-data; boundary=${data.getBoundary()}`,
      ...headers,
    },
  })

  const ipfsHash = res.data.IpfsHash

  console.log(`Your site is ready! IPFS hash: ${ipfsHash}`)
  console.log(`output for github-actions:`)
  console.log(`::set-output name=ipfs_hash::${ipfsHash}`)
  console.log(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`)
}

async function main() {
  await removeOldPins()
  await pinBuild()
}

async function* readDir(dir: string): AsyncGenerator<string> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const res = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      yield* readDir(res)
    } else {
      yield res
    }
  }
}

function basePathConverter(sourcePath: string, filePath: string): string {
  const newString = sourcePath.startsWith('./') ? sourcePath.substring(numbers.TWO) : sourcePath
  const lastIndex = filePath.lastIndexOf(newString)
  if (lastIndex === -numbers.ONE) {
    return filePath
  }
  return filePath.slice(filePath.lastIndexOf(newString))
}

main().catch((e) => {
  console.log(e)
  process.exit(numbers.ONE)
})
