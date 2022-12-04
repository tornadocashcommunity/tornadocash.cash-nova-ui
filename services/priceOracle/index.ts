import { getOffChainOracle } from '@/contracts'

const getRateToEth = async (address: string) => {
  const priceOracle = getOffChainOracle()

  return await priceOracle.callStatic.getRateToEth(address, false)
}

export { getRateToEth }
