const ZERO_ELEMENT = 0

function getBatches(array, batchSize) {
  const batches = []
  while (array.length) {
    batches.push(array.splice(ZERO_ELEMENT, batchSize))
  }
  return batches
}

async function sleep(ms) {
  return await new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = {
  ZERO_ELEMENT,
  getBatches,
  sleep
}