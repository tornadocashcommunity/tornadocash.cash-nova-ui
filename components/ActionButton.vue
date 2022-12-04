<template>
  <div :class="$style.actionWrapper">
    <base-fee-info :amount="amount" :is-custom="isCustom" :error="isBaseFeeInfoError" :text="feeInfoText" :method="type" />

    <base-button v-if="shouldChangeChain" full-width @click="onChainChange">Change network</base-button>
    <base-button v-else-if="shouldWalletConnect" full-width @click="connectModal">Connect wallet</base-button>

    <span v-else v-tooltip="actionButtonTooltip" :class="$style.actionWrapper__actionButton">
      <base-button full-width :loading="isActionButtonLoading" :disabled="isActionButtonDisabled" @click="onAction">
        {{ actionButtonText(actionText, tokensToSend(amount, type, isRelayer)) }}
      </base-button>
    </span>
  </div>
</template>
<script>
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

import { AccountMutation } from '@/types'
import { getWalletProvider } from '@/services'

export default {
  inject: ['setupProvider'],
  props: {
    amount: {
      type: String,
      required: true,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    recipientAddress: {
      type: String,
      required: true,
    },
    isEnoughBalance: {
      type: Boolean,
      required: true,
    },
    isDisabled: {
      type: Boolean,
      required: true,
    },
    isLoading: {
      type: Boolean,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    actionText: {
      type: String,
      required: true,
    },
    feeInfoText: {
      type: String,
      required: true,
    },
    onAction: {
      type: Function,
      required: true,
    },
    onResetError: {
      type: Function,
      required: true,
    },
  },
  data: function () {
    return {
      isActionLoader: false,
      isNetworkChecking: false,
    }
  },
  computed: {
    ...mapGetters('transaction', ['isPendingTxs']),
    ...mapState('account', ['accountAddress']),
    ...mapGetters('account', ['isRelayer', 'isNotRegisteredInPool', 'accountAddress']),
    ...mapGetters('relayer', ['currentRelayer', 'isRelayersFetching']),
    ...mapGetters('application', ['tokensToSend', 'actionButtonText', 'isProcessingStarted']),
    ...mapGetters('wallet', ['chainId', 'l2ChainId', 'isL1Chain', 'mismatchNetwork', 'isConnected', 'nameProvider']),
    isBaseFeeInfoError() {
      return !this.isEnoughBalance && Boolean(this.amount)
    },
    shouldChangeChain() {
      return this.isConnected && (this.isL1Chain || this.isMismatchNetwork) && !this.isRelayer
    },
    shouldWalletConnect() {
      return !this.isConnected && !this.isRelayer && this.accountAddress
    },
    actionButtonTooltip() {
      if (this.isMismatchNetwork) {
        return 'Mismatch network, please switch to Relayer method'
      }

      if (this.isNotRegisteredInPool) {
        return 'Setup account first'
      }

      if (this.isPendingTxs) {
        return 'Has pending transactions'
      }

      return null
    },
    isActionButtonLoading() {
      return this.isLoading || this.isRelayersFetching || this.isActionLoader || this.isNetworkChecking
    },
    isActionButtonDisabled() {
      const isInvalidRelayer = this.isRelayer && !this.currentRelayer?.url
      const isFilledInputs = Boolean(Number(this.amount)) && Boolean(this.recipientAddress)
      const isActionDisabled = this.isNotRegisteredInPool || !isFilledInputs || this.isDisabled || this.isMismatchNetwork
      const isLoading = this.isActionButtonLoading || this.isPendingTxs || this.isProcessingStarted

      return isActionDisabled || isLoading || !this.isEnoughBalance || isInvalidRelayer
    },
    isInputDisabled() {
      return this.isLoading
    },
    isMismatchNetwork() {
      if (this.isRelayer) {
        return false
      }
      return this.mismatchNetwork
    },
  },
  async created() {
    if (this.accountAddress && !this.isRelayer) {
      await this.checkNetwork()
    }
  },
  methods: {
    ...mapMutations('account', [AccountMutation.CLEAR_ACCOUNT]),
    ...mapActions('wallet', ['changeChain', 'checkNetwork', 'checkAppNetwork']),
    ...mapActions('application', ['errorHandler']),
    async getProvider() {
      const provider = getWalletProvider(this.nameProvider || 'METAMASK')
      const network = await provider.checkNetworkVersion()
      return network
    },
    async checkNetwork() {
      try {
        this.isNetworkChecking = true
        const network = await this.getProvider()
        await this.checkAppNetwork(network)
      } catch (err) {
        console.error('Method CheckNetwork has error:', err.message)
      } finally {
        this.isNetworkChecking = false
      }
    },
    async onChainChange() {
      try {
        this.isActionLoader = true
        this.onResetError()

        await this.changeChain(this.isRelayer ? this.l1ChainId : this.l2ChainId)
      } catch (err) {
        await this.errorHandler({ errorMessage: err.message, title: 'Change network error' })
      } finally {
        this.isActionLoader = false
      }
    },
    async connectModal() {
      try {
        this.isActionLoader = true
        await this.setupProvider('METAMASK')
      } catch (err) {
      } finally {
        this.isActionLoader = false
      }
    },
  },
}
</script>

<style lang="scss" module scoped>
.actionWrapper {
  width: 100%;
  position: relative;
  &__actionButton {
    width: 100%;
    display: block;
  }
}
</style>
