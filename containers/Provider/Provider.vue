<template>
  <div :class="$style.container">
    <slot />
  </div>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex'

import { ChangeAccountModal } from '@/modals'
import { WalletMutation, AccountMutation } from '@/types'
import { getWalletProvider, privateStorage } from '@/services'
import { createModalArgs, hexToNumber, toChecksumAddress } from '@/utilities'

export default {
  provide() {
    return {
      setupProvider: this.setupProvider,
    }
  },
  data() {
    return {
      provider: null,
    }
  },
  computed: {
    ...mapGetters('account', ['accountAddress', 'isRelayer']),
    ...mapGetters('wallet', ['isConnected', 'nameProvider', 'walletAddress', 'mismatchNetwork', 'l1ChainId', 'l2ChainId']),
  },
  async created() {
    if (this.isConnected) {
      try {
        await this.setupProvider(this.nameProvider)
      } catch {
        this[WalletMutation.CLEAR_PROVIDER]()
      }
    }
    this.ethRateWatcher()
    this.gasPriceWatcher()
    this.estimateGasWatcher()
  },
  mounted() {
    if (this.isConnected && this.nameProvider) {
      this.checkNetwork()
    }
  },
  methods: {
    ...mapMutations('account', [AccountMutation.CLEAR_ACCOUNT, AccountMutation.SET_IS_BALANCE_FETCHING]),
    ...mapMutations('wallet', [WalletMutation.CLEAR_PROVIDER, WalletMutation.SET_PROVIDER_CONNECTION]),
    ...mapActions('relayer', ['ethRateWatcher']),
    ...mapActions('application', ['errorHandler']),
    ...mapActions('gasPrice', ['gasPriceWatcher', 'estimateGasWatcher']),
    ...mapActions('account', ['checkSession', 'setAccountParams', 'accountBalanceWatcher']),
    ...mapActions('wallet', [
      'setProvider',
      'changeChain',
      'checkNetwork',
      'setWalletParams',
      'getWalletBalance',
    ]),
    openChangeAccountModal(address) {
      this.$modal.hide('ChangeAccountModal')

      const dataModal = createModalArgs(ChangeAccountModal, { address }, { clickToClose: false })

      this.$modal.show(...dataModal)
    },

    async setAccountData(address) {
      if (!this.accountAddress || address === this.accountAddress) {
        this.$modal.hide('ChangeAccountModal')
        await this.setWalletParams(address)
        await this.setAccountParams(address)
      } else if (this.walletAddress !== address) {
        this.openChangeAccountModal(address)
      }
    },

    async onChainChange() {
      try {
        await this.changeChain(this.isRelayer ? this.l1ChainId : this.l2ChainId)
      } catch (err) {
        await this.errorHandler({ errorMessage: err.message, title: 'Change network error' })
      }
    },

    async setupProvider(key = 'metamask') {
      try {
        this[WalletMutation.SET_PROVIDER_CONNECTION](false)

        const provider = getWalletProvider(key)
        const address = await provider.setupProvider()
        const network = await provider.checkNetworkVersion()

        await this.setProvider({ network, name: key })
        await this.setAccountData(address)

        this[WalletMutation.SET_PROVIDER_CONNECTION](true)

        if (this.mismatchNetwork) {
          await this.onChainChange()
        }

        provider.on({
          method: 'chainChanged',
          callback: async (network) => {
            try {
              await this.setProvider({ network: hexToNumber(network), name: this.nameProvider })
              await this.getWalletBalance()
            } catch (err) {
              console.log('Provider listener chainChanged has error:', err.message)
            }
          },
        })

        provider.on({
          method: 'accountsChanged',
          callback: async ([address]) => {
            try {
              // if user click disconnect in the metamask address = null and trigger accountsChanged event
              // https://github.com/MetaMask/metamask-extension/issues/10125
              if (address) {
                const checksumAddress = toChecksumAddress(address)

                if (!this.isConnected) {
                  return
                }

                await this.setAccountData(checksumAddress)
              } else {
                this[WalletMutation.CLEAR_PROVIDER]()
                this[AccountMutation.CLEAR_ACCOUNT]()
                privateStorage.clear()
                this.$modal.hide('ChangeAccountModal')
              }
            } catch (err) {
              await this.errorHandler({ errorMessage: err.message, title: 'Switch wallet error' })
              console.error('onAccountsChanged has error:', err.message)
            }
          },
        })
      } catch (err) {
        const errorMessage = await this.errorHandler({ errorMessage: err.message, title: `Connecting ${key}` })
        throw new Error(errorMessage)
      }
    },
  },
}
</script>

<style lang="scss" module>
.container {
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
