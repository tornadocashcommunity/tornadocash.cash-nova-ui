import { ChainId, NetworkConfig, MetamaskList } from '@/types'

const L1_CHAIN_ID = ChainId.MAINNET

const CHAINS: NetworkConfig = {
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
  },
}

const METAMASK_LIST: MetamaskList = {
  [ChainId.BSC]: {
    chainId: '0x38',
    chainName: 'Binance Smart Chain Mainnet',
    rpcUrls: ['https://bsc-dataseed1.binance.org'],
    nativeCurrency: {
      name: 'Binance Chain Native Token',
      symbol: 'BNB',
      decimals: 18,
    },
    blockExplorerUrls: ['https://bscscan.com'],
  },
  [ChainId.XDAI]: {
    chainId: '0x64',
    chainName: 'Gnosis',
    rpcUrls: ['https://rpc.gnosischain.com'],
    nativeCurrency: {
      name: 'xDAI',
      symbol: 'xDAI',
      decimals: 18,
    },
    blockExplorerUrls: ['https://blockscout.com/xdai/mainnet'],
  },
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const txStatuses = {
  FAIL: '0x00',
  SUCCESS: '0x01',
  PENDING: '0x02',
}

export { CHAINS, ZERO_ADDRESS, txStatuses, METAMASK_LIST, L1_CHAIN_ID }
