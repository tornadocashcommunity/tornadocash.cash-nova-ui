import { WalletState, AccountState, RelayerState, GasPriceState, ApplicationState, TransactionState } from '@/types'

export interface RootState {
  root: boolean
  version: string
  wallet: WalletState
  account: AccountState
  relayer: RelayerState
  gasPrice: GasPriceState
  application: ApplicationState
  transaction: TransactionState
}
