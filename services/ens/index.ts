import { ChainId } from '@/types'
import { getProvider } from '@/services'

async function getAddress(ensName: string, chainId: ChainId) {
  try {
    const { provider } = getProvider(chainId)
    const address = await provider.resolveName(ensName)

    return address
  } catch (err) {
    return undefined
  }
}

async function getEnsName(address: string, chainId: ChainId) {
  try {
    const { provider } = getProvider(chainId)
    const ensName = await provider.lookupAddress(address)

    return ensName
  } catch (err) {
    return undefined
  }
}

export const ens = {
  getAddress,
  getEnsName,
}
