const GET_COMMITMENT = `
  query getCommitment($first: Int, $fromBlock: Int) {
    commitments(first: $first, orderBy: blockNumber, orderDirection: asc, where: {
      blockNumber_gte: $fromBlock
    }) {
      index
      commitment
      blockNumber
      encryptedOutput
      transactionHash
    }
    _meta {
      block {
        number
      }
      hasIndexingErrors
    }
  }
`

const GET_NULLIFIER = `
  query getNullifier($first: Int, $fromBlock: Int) {
    nullifiers(first: $first, orderBy: blockNumber, orderDirection: asc, where: {
      blockNumber_gte: $fromBlock
    }) {
      nullifier
      blockNumber
      transactionHash
    }
    _meta {
      block {
        number
      }
      hasIndexingErrors
    }
  }
`

module.exports = { GET_COMMITMENT, GET_NULLIFIER }