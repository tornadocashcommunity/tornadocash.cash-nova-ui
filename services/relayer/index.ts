import axios from 'axios'

import { BigNumber } from 'ethers'
import { AsyncValidateFunction } from 'ajv'

import { numbers } from '@/constants'
import { ChainId, Relayer } from '@/types'
import { ajv, getProvider } from '@/services'
import { integerMultiplier, toWei, fromWei } from '@/utilities'

import { CreateTransactParams, GetStatusParams, GetOperationFeeParams } from './@types'

import { relayerRegister } from './register'

async function createJob({ params, url }: CreateTransactParams) {
  try {
    const response = await axios.post<string>(`${url}/transaction`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    return {
      id: response.data,
      jobUrl: `${url}/job/${response.data}`,
    }
  } catch (err) {
    throw new Error(err.message)
  }
}

async function makeRequest<T>(path: string): Promise<T> {
  try {
    const controller = new AbortController()

    setTimeout(() => controller.abort(), numbers.REQUEST_TIMEOUT)

    const response = await axios.get<T>(path, { signal: controller.signal })

    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

async function getStatus({ ensName, url }: GetStatusParams) {
  let response = null

  try {
    if (!url) {
      throw new Error('invalid url')
    }

    response = await makeRequest<Relayer>(`${url}/status`)
  } catch {
    const fallbackUrl = await getRelayerUrlFromENS(ensName)

    if (fallbackUrl) {
      response = await makeRequest<Relayer>(`${fallbackUrl}/status`)
      url = fallbackUrl
    }
  }

  if (!response) {
    throw new Error('no response')
  }

  const validate = ajv.getSchema('relayer') as AsyncValidateFunction
  const isValid = await validate(response)

  // TODO during build check actual version in relayer soft repo and set to UI ENV
  const [release] = response.version.split('.').slice(-numbers.ONE)
  const isUpToDate = Number(release) > numbers.THREE

  if (isValid && isUpToDate) {
    return { ...response, ensName, url }
  }

  throw new Error('is not valid relayer')
}

async function getRelayerUrlFromENS(ensName: string) {
  try {
    if (!ensName.includes('.eth')) {
      return undefined
    }

    const { provider } = getProvider(ChainId.MAINNET)

    const resolver = await provider.getResolver(ensName)
    const url = await resolver.getText('url')

    return `${window.location.protocol}//${url}`
  } catch (err) {
    return undefined
  }
}

function getRandomRelayer(relayers: Relayer[], type: 'transfer' | 'withdrawal') {
  const minRelayerFee = {
    transfer: 0.00000001, // from wei
    withdrawal: 0.01, // %
  }

  let sum = 0

  const weights = relayers.map(({ serviceFee }) => {
    const fee = type === 'transfer' ? fromWei(serviceFee[type]) : serviceFee[type]
    const maxFee = Math.max(Number(fee), minRelayerFee[type])

    sum += numbers.ONE / maxFee
    return sum
  })

  const randomFee = Math.random() * sum
  const randomItemIndex = weights.findIndex((el) => el > randomFee)
  return relayers[randomItemIndex]
}

function getOperationFee({ serviceFee, amount, networkFee, method }: GetOperationFeeParams) {
  if (method === 'transfer') {
    return BigNumber.from(networkFee).add(serviceFee.transfer)
  }

  const oneEther = integerMultiplier()
  const share = serviceFee.withdrawal / numbers.ONE_HUNDRED
  const relayerFee = amount.mul(toWei(String(share))).div(oneEther)

  // console.log({})
  return BigNumber.from(networkFee).add(relayerFee)
}

export const relayerService = {
  getStatus,
  createJob,
  relayerRegister,
  getOperationFee,
  getRandomRelayer,
}
