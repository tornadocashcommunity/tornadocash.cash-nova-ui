import { estimateFees as estimate } from '@mycrypto/gas-estimation'

import { BigNumber, BigNumberish } from 'ethers'

import { ChainId } from '@/types'
import { numbers, RPC_LIST } from '@/constants'
import { numberToHex } from '@/utilities/crypto'

export async function getCurrentFees() {
  const { maxFeePerGas, maxPriorityFeePerGas, baseFee = numbers.ZERO } = await estimate(RPC_LIST[ChainId.MAINNET])

  return {
    baseFee: numberToHex(baseFee),
    maxFeePerGas: numberToHex(maxFeePerGas),
    maxPriorityFeePerGas: numberToHex(maxPriorityFeePerGas),
  }
}

const DEFAULT_BLOCKS = 2

export function getCompoundBaseFee(baseFee: BigNumberish, blocks: number = DEFAULT_BLOCKS) {
  const divider = BigNumber.from('1000').pow(blocks)
  const multiplier = BigNumber.from('1125').pow(blocks)

  return BigNumber.from(baseFee).mul(multiplier).div(divider)
}

export const estimateFees = {
  getCurrentFees,
  getCompoundBaseFee,
}
