import { SUPPORTED_WALLETS } from '@/constants'

import { AbstractProvider } from '@/services'

export function getWalletProvider(key: string) {
  const wallet = SUPPORTED_WALLETS[String(key).toUpperCase()]

  const provider = wallet.connector()

  return new AbstractProvider({ provider })
}
