import { unzipAsync } from "./zip"

export async function downloadEvents(fileName, deployedBlock) {
  fileName = fileName.toLowerCase()

  // @ts-ignore
  const prefix = __webpack_public_path__.slice(0, -7)

  try {
    const resp = await fetch(`${prefix}/${fileName}.zip`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    })
  
    const arrayBuffer = await resp.arrayBuffer()
  
    const { [fileName]: content } = await unzipAsync(new Uint8Array(arrayBuffer))
  
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