export type WalletAccount = {
  address: string
  ensName: string
  balance: number
}

export type Provider = {
  name: string
  network: number
  l1ChainId: number
  l2ChainId: number
  isConnected: boolean
  mismatchNetwork: boolean
}
