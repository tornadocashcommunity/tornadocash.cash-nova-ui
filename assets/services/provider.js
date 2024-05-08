import { ethers } from 'ethers'
import { fetchJson } from 'ethers/lib/utils'
import { numbers } from './constants'

const defaultRetryAttempt = 0

export class ExtendedProvider extends ethers.providers.StaticJsonRpcProvider {
  constructor(url, network, fallbackRpcs) {
    super(url, network)
    this.fallbackRpcs = fallbackRpcs
  }

  async send(method, params, retryAttempt = defaultRetryAttempt) {
    try {
      return await super.send(method, params)
    } catch (err) {
      if (!retryAttempt) {
        const TIME_OUT = 3000

        await this.sleep(TIME_OUT)

        if (this.fallbackRpcs) {
          return await this.fallbackSend(method, params, this.fallbackRpcs)
        }
        return this.send(method, params, ++retryAttempt)
      }
      throw err
    }
  }

  // eslint-disable-next-line
  async fallbackSend(method, params, fallbackRpcs,  retryAttempt = defaultRetryAttempt) {

    function getResult(payload) {
      if (payload.error) {
        const error = new Error(payload.error.message)
        error.code = payload.error.code
        error.data = payload.error.data
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw error
      }
      return payload.result
    }

    try {
      const request = {
        method: method,
        params: params,
        id: this._nextId + numbers.ONE,
        jsonrpc: '2.0',
      }

      const result = fetchJson({ url: fallbackRpcs[retryAttempt] }, JSON.stringify(request), getResult).then(
        (result) => result,
        (error) => {
          throw error
        },
      )

      return await result
    } catch (err) {
      retryAttempt += numbers.ONE
      if (!fallbackRpcs[retryAttempt]) {
        throw err
      } else {
        return await this.fallbackSend(method, params, fallbackRpcs, retryAttempt)
      }
    }
  }

  async sleep(ms) {
    return await new Promise((resolve) => setTimeout(resolve, ms))
  }

  // private checkRpcError(err: { data: string; code: string; message: string }) {
  //   const code = String(err?.code)
  //   const data = err.data?.toLowerCase()
  //   const message = err.message?.toLowerCase()

  //   const ERROR_DATA = 'too many concurrent request'
  //   const ERROR_MESSAGE = 'timeout'
  //   const ERROR_CODE = '-32017'

  //   return (data?.includes(ERROR_DATA) || message?.includes(ERROR_MESSAGE)) && code === ERROR_CODE
  // }
}