import { GasPriceOracle } from 'gas-price-oracle'
import { GasPrice } from 'gas-price-oracle/lib/types'

import { ChainId } from '@/types'
import { numbers, RPC_LIST } from '@/constants'
import { getProvider } from '@/services'
import { gweiToWei, bump } from '@/utilities'

const SECONDS = 3
const TEN_SECOND = SECONDS * numbers?.SECOND

const percentBump = {
  INSTANT: 150,
  FAST: 130,
  STANDARD: 85,
  LOW: 50,
}

const getGasPrice = async (chainId: ChainId): Promise<GasPrice> => {
  if (chainId === ChainId.BSC) {
    return await getGasPriceFromRpc(chainId)
  }

  const instance = new GasPriceOracle({
    chainId,
    timeout: TEN_SECOND,
    defaultRpc: RPC_LIST[chainId],
  })
  const result = await instance.gasPrices()

  if (chainId === ChainId.XDAI || chainId === ChainId.MAINNET) {
    return {
      instant: bump(gweiToWei(result.instant), percentBump.INSTANT),
      fast: bump(gweiToWei(result.instant), percentBump.FAST),
      standard: bump(gweiToWei(result.standard), percentBump.STANDARD),
      low: bump(gweiToWei(result.low), percentBump.LOW),
    }
  }

  return result
}

const getGasPriceFromRpc = async (chainId: ChainId) => {
  try {
    const { provider } = getProvider(chainId)

    const current = await provider.getGasPrice()

    return {
      instant: bump(current, percentBump.INSTANT),
      fast: bump(current, percentBump.FAST),
      standard: bump(current, percentBump.STANDARD),
      low: bump(current, percentBump.LOW),
    }
  } catch (err) {
    throw new Error('getGasPriceFromRpc has error')
  }
}

export { getGasPrice, getGasPriceFromRpc }
