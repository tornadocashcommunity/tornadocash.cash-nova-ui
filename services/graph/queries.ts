export const _META = `
  query getMeta {
    _meta {
      block {
        number
      }
    }
  }
`

export const GET_ACCOUNTS = `
  query getAccounts($first: Int, $fromBlock: Int) {
    accounts(first: $first, orderBy: blockNumber, orderDirection: asc, where: {
      blockNumber_gte: $fromBlock
    }) {
      id
      key
      owner
      blockNumber
    }
  }
`

export const GET_REGISTERED = `
  query getRegistered($first: Int, $fromBlock: Int) {
      relayers(first: $first, where: {
        blockRegistration_gte: $fromBlock
      }) {
       address
       ensName
       ensHash
       blockRegistration
    }
  }
`

export const GET_COMMITMENT = `
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

export const GET_NULLIFIER = `
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