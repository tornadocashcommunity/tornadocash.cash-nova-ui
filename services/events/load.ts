import { unzip } from 'fflate'

export function unzipAsync(data: Uint8Array) {
  return new Promise((res, rej) => {
    unzip(data, {}, (err, data) => {
      if (err) {
        rej(err);
        return;
      }
      res(data);
    });
  });
}

export async function downloadEvents(fileName: string, deployedBlock: number) {
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
  
    const { [fileName]: content } = (await unzipAsync(new Uint8Array(arrayBuffer))) as any
  
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