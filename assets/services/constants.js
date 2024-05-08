export const BSC_CHAIN_ID = 56
export const XDAI_CHAIN_ID = 100
export const MAINNET_CHAIN_ID = 1

export const ChainId = {
  BSC: BSC_CHAIN_ID,
  XDAI: XDAI_CHAIN_ID,
  MAINNET: MAINNET_CHAIN_ID,
}

export const OFFCHAIN_ORACLE_CONTRACT = '0x07D91f5fb9Bf7798734C3f606dB065549F6893bb'

export const POOL_CONTRACT = {
  [ChainId.XDAI]: '0xD692Fd2D0b2Fbd2e52CFa5B5b9424bC981C30696', // ETH
  // [ChainId.XDAI]: '0x772F007F13604ac286312C85b9Cd9B2D691B353E', // BNB
}
export const REDGISTRY_CONTRACT = {
  [ChainId.MAINNET]: '0x58E8dCC13BE9780fC42E8723D8EaD4CF46943dF2',
}

export const AGGREGATOR_FACTORY = {
  [ChainId.MAINNET]: '0xE8F47A78A6D52D317D0D2FFFac56739fE14D1b49',
}

export const WRAPPED_TOKEN = {
  [ChainId.MAINNET]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH on mainnet
  [ChainId.XDAI]: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1', // WETH on xdai
  [ChainId.BSC]: '0xCa8d20f3e0144a72C6B5d576e9Bd3Fd8557E2B04', // WBNB on xdai
}

export const RPC_LIST = {
  [ChainId.BSC]: 'https://tornadocash-rpc.com/bsc',
  [ChainId.MAINNET]: 'https://tornadocash-rpc.com/mainnet',
  [ChainId.XDAI]: 'https://tornadocash-rpc.com/gnosis',
}

export const FALLBACK_RPC_LIST = {
  [ChainId.BSC]: [
    'https://binance.nodereal.io',
    // 'https://rpc.ankr.com/bsc/dbe08b852ba176a8aeac783cc1fa8becaf4f107235dfdae79241063fbf52ca4a',
  ],
  [ChainId.MAINNET]: [
    'https://rpc.mevblocker.io',
    // 'https://rpc.ankr.com/eth/dbe08b852ba176a8aeac783cc1fa8becaf4f107235dfdae79241063fbf52ca4a',
  ],
  [ChainId.XDAI]: [
    // 'https://rpc.ankr.com/gnosis/dbe08b852ba176a8aeac783cc1fa8becaf4f107235dfdae79241063fbf52ca4a',
    'https://tornadocash-rpc.com/gnosis',
  ],
}

export const RPC_WS_LIST = {
  [ChainId.MAINNET]: 'wss://mainnet.chainnodes.org/d692ae63-0a7e-43e0-9da9-fe4f4cc6c607',
  [ChainId.BSC]: 'wss://bsc-mainnet.chainnodes.org/d692ae63-0a7e-43e0-9da9-fe4f4cc6c607',
  [ChainId.XDAI]: 'wss://gnosis-mainnet.chainnodes.org/d692ae63-0a7e-43e0-9da9-fe4f4cc6c607',
}

export const MULTICALL = {
  [ChainId.BSC]: '0xf072f255A3324198C7F653237B44E1C4e66f8C42',
  [ChainId.XDAI]: '0x8677b93D543d0217B32B8FDc20F2316E138D619B',
  [ChainId.MAINNET]: '0x1F98415757620B543A52E61c46B32eB19261F984',
}

export const BRIDGE_PROXY = {
  [ChainId.BSC]: '0x05185872898b6f94AA600177EF41B9334B1FA48B',
  [ChainId.MAINNET]: '0x4c36d2919e407f0cc2ee3c993ccf8ac26d9ce64e',
}

export const AMB_BRIDGE = {
  [ChainId.XDAI]: '0x75Df5AF045d91108662D8080fD1FEFAd6aA0bb59', // ETH
  // [ChainId.XDAI]: '0x162E898bD0aacB578C8D5F8d6ca588c13d2A383F', // BNB
  [ChainId.MAINNET]: '0x162E898bD0aacB578C8D5F8d6ca588c13d2A383F',
}

export const BRIDGE_HELPER = {
  [ChainId.MAINNET]: '0xCa0840578f57fE71599D29375e16783424023357',
  [ChainId.BSC]: '0x8845F740F8B01bC7D9A4C82a6fD4A60320c07AF1',
}

export const BRIDGE_FEE_MANAGER = {
  [ChainId.XDAI]: '0x5dbC897aEf6B18394D845A922BF107FA98E3AC55',
}

export const FOREIGN_OMNIBRIDGE = {
  [ChainId.MAINNET]: '0x88ad09518695c6c3712AC10a214bE5109a655671',
}

export const OMNIBRIDGE = {
  [ChainId.XDAI]: '0xf6A78083ca3e2a662D6dd1703c939c8aCE2e268d',
}

export const SANCTION_LIST = {
  [ChainId.MAINNET]: '0x40C57923924B5c5c5455c48D93317139ADDaC8fb',
}

export const CHAINS = {
  [ChainId.XDAI]: {
    symbol: 'XDAI',
    name: 'xdai',
    shortName: 'xdai',
    icon: 'ethereum',
    network: 'XDAI',
    blockDuration: 3000, // ms
    deployBlock: 19097755, // ETH
    // deployBlock: 20446605, // BNB
    blockGasLimit: 144000000, // rpc block gas limit
    hexChainId: '0x64',
    isEipSupported: false,
    ensSubdomainKey: 'gnosis-nova',
    blockExplorerUrl: 'https://gnosisscan.io'
  },
  [ChainId.MAINNET]: {
    symbol: 'ETH',
    name: 'ethereum',
    shortName: 'eth',
    icon: 'ethereum',
    network: 'Mainnet',
    deployBlock: 13494216,
    blockDuration: 15000,
    blockGasLimit: 144000000,
    hexChainId: '0x1',
    isEipSupported: true,
    ensSubdomainKey: 'mainnet-tornado',
    blockExplorerUrl: 'https://etherscan.io'
  },
  [ChainId.BSC]: {
    symbol: 'BNB',
    name: 'bsc',
    shortName: 'bsc',
    icon: 'binance',
    network: 'BSC',
    deployBlock: 14931075,
    blockDuration: 3000,
    blockGasLimit: 144000000,
    hexChainId: '0x38',
    isEipSupported: false,
    ensSubdomainKey: 'bsc-tornado',
    blockExplorerUrl: 'https://bscscan.com'
  },
}


export const workerEvents = {
  INIT_WORKER: 'initWorker',
  GET_COMMITMENT_EVENTS: 'get_commitment_events',
  // nullifier
  GET_UNSPENT_EVENTS: 'get_unspent_events',
  GET_NULLIFIER_EVENT: 'get_nullifier_event',
  GET_NULLIFIER_EVENTS_FROM_TX_HASH: 'get_nullifier_events_from_tx_hash',
  UPDATE_NULLIFIER_EVENTS: 'update_nullifier_events',
  // events
  GET_BATCH_EVENTS: 'get_batch_events',
  GET_BATCH_COMMITMENTS_EVENTS: 'get_batch_commitments_events',
  GET_EVENTS_FROM_TX_HASH: 'get_events_from_tx_hash',
  SAVE_EVENTS: 'save_events',
  GET_CACHED_EVENTS: 'get_cached_events',
  GET_CACHED_COMMITMENTS_EVENTS: 'get_cached_commitments_events',
  SAVE_LAST_SYNC_BLOCK: 'save_last_sync_block',
}

export const numbers = {
  ZERO: 0,
  TWO: 2,
  ONE: 1,
  BYTES_31: 31,
  BYTES_62: 62,
  IS_SPENT_INDEX: 1,
  OX_LENGTH: 2,
  RECALL_DELAY: 500,
  NULLIFIER_LENGTH: 66,
  NONCE_BUF_LENGTH: 24,
  COMMITMENTS_CHAIN: 100,
  DEPLOYED_BLOCK: 19097755,
  DECRYPT_WORKERS_COUNT: 8,
  MIN_BLOCKS_INTERVAL_LINE: 200000,
  EPHEM_PUBLIC_KEY_BUF_LENGTH: 56,
}