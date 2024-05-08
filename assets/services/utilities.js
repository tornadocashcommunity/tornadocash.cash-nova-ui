export const ZERO_ELEMENT = 0

export function getBatches(array, batchSize) {
  const batches = []
  while (array.length) {
    batches.push(array.splice(ZERO_ELEMENT, batchSize))
  }
  return batches
}

export async function sleep(ms) {
  return await new Promise((resolve) => setTimeout(resolve, ms))
}