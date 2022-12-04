import { Wallet, ethers } from 'ethers'
import { stripHexPrefix } from 'ethereumjs-util'
import { getEncryptionPublicKey, decrypt } from 'eth-sig-util'

import { privateStorage } from '@/services'
import { SendRequestParams, Params } from '@/services/provider/@types'

import { RPC_LIST } from '@/constants'

import { Options } from './@types'

export const signerMethods = [
  'net_version',
  'eth_chainId',
  'eth_decrypt',
  'eth_accounts',
  'eth_signTypedData',
  'eth_requestAccounts',
  'eth_getTransactionByHash',
  'eth_getBalance',
  'eth_getTransactionReceipt',
  'eth_sendTransaction',
  'eth_getEncryptionPublicKey',
]

export const localConnector = () => {
  const wallet = privateStorage.get('local_provider')

  if (!wallet) {
    throw new Error('Key is not enough')
  }

  // TODO add validation
  const { key, chainId } = wallet.data

  return new LocalProvider({ key, chainId })
}

export class LocalProvider {
  private readonly wallet: Wallet
  private readonly provider: ethers.providers.JsonRpcProvider

  public constructor({ key, chainId }: Options) {
    this.wallet = new Wallet(key)
    this.provider = new ethers.providers.JsonRpcProvider(RPC_LIST[chainId])

    this.wallet = this.wallet.connect(this.provider)
  }

  public async request({ method, params }: SendRequestParams) {
    switch (method) {
      case 'eth_requestAccounts':
        return await this.requestAccounts()
      case 'eth_accounts':
        return await this.accounts()
      case 'eth_chainId':
        return await this.chainId()
      case 'eth_decrypt':
        return this.decrypt(params as string[])
      case 'eth_getEncryptionPublicKey':
        return this.getEncryptionPublicKey()
      case 'eth_getTransactionByHash':
        return await this.getTransactionByHash(params as string[])
      case 'eth_getBalance':
        return await this.getBalance(params as string[])
      case 'eth_getTransactionReceipt':
        return await this.getTransactionReceipt(params as string[])
      case 'net_version':
        return await this.chainId()
      case 'eth_sendTransaction':
        return await this.sendTransaction(params as Params[])
      default:
        throw new Error('unsupported method')
    }
  }

  private decrypt([data]: string[]) {
    try {
      const stripped = stripHexPrefix(data)
      const buff = Buffer.from(stripped, 'hex')
      const msgData = JSON.parse(buff.toString('utf8'))

      const privKey = stripHexPrefix(this.wallet.privateKey)

      return decrypt(msgData, privKey)
    } catch (err) {
      throw new Error(`Provider method decrypt has error: ${err.message}`)
    }
  }

  private getEncryptionPublicKey() {
    try {
      return getEncryptionPublicKey(this.wallet.privateKey)
    } catch (err) {
      throw new Error(`Provider method getEncryptionPublicKey has error: ${err.message}`)
    }
  }

  private async requestAccounts() {
    try {
      const address = await this.wallet.getAddress()
      return [address]
    } catch (err) {
      throw new Error(`Provider method requestAccounts has error: ${err.message}`)
    }
  }

  private async accounts() {
    try {
      const address = await this.wallet.getAddress()
      return [address]
    } catch (err) {
      throw new Error(`Provider method accounts has error: ${err.message}`)
    }
  }

  private async chainId() {
    try {
      const network = await this.provider.getNetwork()
      return network.chainId
    } catch (err) {
      throw new Error(`Provider method chainId has error: ${err.message}`)
    }
  }

  private async getTransactionByHash([txHash]: string[]) {
    try {
      return await this.provider.getTransaction(txHash)
    } catch (err) {
      throw new Error(`Provider method getTransactionByHash has error: ${err.message}`)
    }
  }

  private async getBalance([address]: string[]) {
    try {
      return await this.provider.getBalance(address)
    } catch (err) {
      throw new Error(`Provider method getBalance has error: ${err.message}`)
    }
  }

  private async getTransactionReceipt([txHash]: string[]) {
    try {
      return await this.provider.getTransactionReceipt(txHash)
    } catch (err) {
      throw new Error(`Provider method getTransactionReceipt has error: ${err.message}`)
    }
  }

  private async sendTransaction(params: Params[]) {
    try {
      const nonce = await this.wallet.getTransactionCount()

      const [txParams] = params

      // TODO validate
      const newParams = {
        nonce,
        to: txParams.to,
        from: txParams.from,
        data: txParams.data,
        value: txParams.value,
        gasLimit: txParams.gas,
        // ToDo EIP1559
        gasPrice: txParams.gasPrice,
      }

      const signTx = await this.wallet.signTransaction(newParams)
      const receipt = await this.provider.sendTransaction(signTx)

      const { transactionHash } = await receipt.wait()

      return transactionHash
    } catch (err) {
      throw new Error(`Provider method sendTransaction has error: ${err.message}`)
    }
  }
}
