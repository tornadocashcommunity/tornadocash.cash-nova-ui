import { EIPGasParams, GasPrices, BaseFee } from './entities'

export type GasPriceState = {
  prices: GasPrices
  baseFee: BaseFee
  params: EIPGasParams
}
