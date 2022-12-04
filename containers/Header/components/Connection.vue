<template>
  <div :class="$style.container">
    <span v-if="isPending" :class="$style.loaderWrap">
      <base-icon name="loader" size="fill" />
    </span>

    <div :class="$style.connection">
      <div :class="$style.connection__account">
        <div
          :class="[$style.connection__balance, { [$style.connection__activeElement]: isProcessingStarted }]"
          @click="openConfirmModal"
        >
          <span :class="$style.connection__balanceTitle">Your shielded balance</span>
          <span
            v-if="isProcessingStarted"
            :class="[$style.connection__infoProcessing, { [$style.connection__infoProcessing_error]: isProcessingError }]"
          >
            {{ processingText }}
          </span>
          <span v-else :class="$style.connection__balanceInfo"> {{ formattedBalance }} {{ chainSymbol }} </span>
        </div>

        <base-button v-if="shouldLoginInPool" size="small" @click="openConnectionModal"> Log in </base-button>
        <base-button v-else-if="shouldChangeChain" :loading="isChainChanging" size="small" @click="onChainChange">
          Change network
        </base-button>
        <base-button v-else-if="isNotRegistered" :loading="isSetupLoading" size="small" @click="onSetup">
          Set up account
        </base-button>
        <base-button v-else :class="$style.connection__address" type="primary" size="small" @click="openAccountModal">
          {{ shortAddress }}
        </base-button>
      </div>
    </div>

    <base-button v-if="isExistAvailable" type="link" size="mini" :class="$style.buttonExit" @click="onDisconnect">
      <base-icon name="exit" size="symbol" />
    </base-button>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

import { privateStorage } from '@/services'
import { CHAINS, registerStatuses } from '@/constants'
import { ConnectModal, AccountModal, ConfirmationModal } from '@/modals'
import { ApplicationMutation, WalletMutation, AccountMutation } from '@/types'
import { shortenAddress, createModalArgs, toDecimalsPlaces, fromWei } from '@/utilities'

export default {
  name: 'Connection',
  inject: ['setupProvider'],
  data: function () {
    return {
      isChainChanging: false,
    }
  },
  computed: {
    ...mapState('account', ['isBalanceFetching']),
    ...mapGetters('account', [
      'accountEnsName',
      'accountAddress',
      'accountBalance',
      'isRegisterProcessing',
      'isNotRegisteredInPool',
      'isRegisteredInPoolNotChecked',
    ]),
    ...mapGetters('relayer', ['activeJob']),
    ...mapState('application', ['processing']),
    ...mapGetters('wallet', ['l1ChainId', 'isL2Chain', 'mismatchNetwork', 'isConnected']),
    ...mapGetters('transaction', ['pendingTxs', 'isPendingTxs']),
    ...mapGetters('application', ['isProcessingError', 'isProcessingStarted', 'shouldProcessingWatch', 'isShowProcessingModal']),
    processingText() {
      return this.isProcessingError ? 'Transaction failed' : 'Pending...'
    },
    chainSymbol() {
      return CHAINS[this.l1ChainId].symbol
    },
    isSetupLoading() {
      return this.isRegisteredInPoolNotChecked || this.isRegisterProcessing
    },
    shouldLoginInPool() {
      return !this.isConnected && !this.accountAddress
    },
    shouldChangeChain() {
      return this.isNotRegistered && (this.isL2Chain || this.mismatchNetwork)
    },
    isExistAvailable() {
      return this.isConnected || this.accountAddress
    },
    formattedBalance() {
      return toDecimalsPlaces(fromWei(this.accountBalance))
    },
    isPending() {
      return ((this.isConnected || this.accountAddress) && this.isPendingTxs) || this.isBalanceFetching
    },
    shortAddress() {
      try {
        if (!this.accountAddress) {
          return
        }
        return this.accountEnsName || shortenAddress(this.accountAddress)
      } catch {
        return ''
      }
    },
    isNotRegistered() {
      return this.isNotRegisteredInPool && this.isConnected
    },
  },
  watch: {
    isProcessingError() {
      if (this.isProcessingError && !this.isShowProcessingModal) {
        this[ApplicationMutation.CLEAR_PROCESSING]()
      }
    },
  },
  mounted() {
    this.checkPendingTx()
    this.checkActiveJob()

    if (!this.shouldProcessingWatch) {
      this[ApplicationMutation.CLEAR_PROCESSING]()
    }
  },
  methods: {
    ...mapMutations('wallet', [WalletMutation.CLEAR_PROVIDER]),
    ...mapMutations('account', [AccountMutation.CLEAR_ACCOUNT, AccountMutation.SET_REGISTERED_IN_POOL_STATUS]),
    ...mapMutations('application', [ApplicationMutation.CLEAR_PROCESSING]),
    ...mapActions('account', ['setupAccount', 'checkRegisterInPool']),
    ...mapActions('relayer', ['checkActiveJob']),
    ...mapActions('application', ['errorHandler']),
    ...mapActions('transaction', ['checkPendingTx']),
    ...mapActions('wallet', ['changeChain']),
    async onSetup() {
      try {
        this[AccountMutation.SET_REGISTERED_IN_POOL_STATUS](registerStatuses.PROCESSING)
        await this.setupAccount()
      } catch (err) {
        this.checkRegisterInPool(this.accountAddress)
        await this.errorHandler({ errorMessage: err.message, title: 'Setup account' })
      }
    },
    openConfirmModal() {
      if (this.isProcessingStarted) {
        this.$modal.show(...createModalArgs(ConfirmationModal, {}, { clickToClose: false }))
      }
    },
    async onChainChange() {
      try {
        this.isChainChanging = true

        await this.changeChain(this.l1ChainId)
      } catch (err) {
        await this.errorHandler({ errorMessage: err.message, title: 'Change network error' })
      } finally {
        this.isChainChanging = false
      }
    },
    openConnectionModal() {
      const dataModal = createModalArgs(ConnectModal, { setupProvider: this.setupProvider })
      this.$modal.show(...dataModal)
    },
    onDisconnect() {
      this[WalletMutation.CLEAR_PROVIDER]()
      this[AccountMutation.CLEAR_ACCOUNT]()
      privateStorage.clear()
      this.$modal.hide(this.modalName)
    },
    openAccountModal() {
      const dataModal = createModalArgs(AccountModal, {}, { shiftY: 0, classes: 'modal_top' })
      this.$modal.show(...dataModal)
    },
  },
}
</script>

<style lang="scss" module scoped>
.container {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.connection {
  width: 100%;
  min-width: 30rem;
  display: flex;
  align-items: center;
  justify-content: center;
  &__activeElement {
    cursor: pointer;
  }
  &__account {
    margin: 0;
    padding: 0;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: $color-white;
    background-color: $color-transparent;
    @include media('md') {
      padding: 1.1rem 2rem;
      border: 0.1rem solid $color-bg-primary;
      border-radius: 0.6rem;
    }
  }
  &__balance {
    margin: 0 2rem 0 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    @include media('md') {
      margin: 0 4rem 0 0;
    }
  }

  &__address {
    max-width: 20rem;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: block;
  }
  &__balanceTitle {
    margin: 0 0 0.4rem;
    font-weight: $font-weight-medium;
    font-size: 1.2rem;
    line-height: 1;
    color: $color-grey;
  }
  &__infoProcessing {
    margin: 0;
    padding: 0.4rem 1rem;
    font-weight: $font-weight-medium;
    font-size: 1.4rem;
    line-height: 1;
    color: $color-white;
    border: 0.1rem solid $color-default;
    border-radius: 0.4rem;
    &_error {
      color: $color-danger;
      border-color: $color-danger;
    }
  }
  &__balanceInfo {
    margin: 0;
    font-weight: $font-weight-bold;
    font-size: 2rem;
    line-height: 1.2;
    color: $color-white;
    &_notConnected {
      color: $color-grey;
    }
  }
}

.loaderWrap {
  margin: 0 2rem 0 0;
  display: flex;
  width: 3.6rem;
  height: 3.6rem;
  @include media('md') {
    width: 6rem;
    height: 6rem;
  }
}

.buttonExit {
  margin: 0 0 0 1rem;
  flex: 0 0 auto;
  @include media('md') {
    margin: 0 0 0 1.6rem;
  }
}
</style>

<style lang="scss">
@include animation-full-rotate;
@include animation-full-rotate-negative;

.loader {
  margin: 0;
  &__circle {
    transform-origin: center center;
    animation: animation-full-rotate $duration-animation-1200ms linear infinite;
    &_mini {
      transform-origin: center center;
      animation: animation-full-rotate-negative $duration-animation-1200ms linear infinite;
    }
  }
}
</style>
