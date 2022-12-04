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
