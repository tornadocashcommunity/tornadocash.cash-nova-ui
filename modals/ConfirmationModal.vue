<template>
  <div :class="$style.confirm">
    <div>
      <h2 :class="$style.confirm__title">{{ processing.modal.title }}</h2>
      <p :class="$style.confirm__text">Processing...</p>

      <ul :class="$style.confirm__list">
        <li
          v-for="{ name, text, progress } in stepsData"
          :key="name"
          :class="[$style.confirm__listItem, $style[processingStatuses[name]]]"
        >
          <span :class="$style.confirm__listItemStatus">
            <base-icon v-if="processingStatuses[name] === 'success'" name="tick" size="medium" />
            <base-icon v-if="processingStatuses[name] === 'fail'" name="cross" size="medium" />
            <span v-if="processingStatuses[name] === 'loading'" :class="$style.confirm__listItemLoading" />
          </span>
          <span :class="$style.confirm__listItemText">
            {{ text }}
            <strong v-if="progress">{{ progress }}</strong>
          </span>
        </li>
      </ul>

      <div :class="$style.confirm__links">
        <div :class="$style.confirm__linksItem">
          <span v-if="transactionOptions.from" :class="$style.confirm__linksItemTitle">
            {{ transactionOptions.from }} transaction:&nbsp;
          </span>
          <a
            v-if="!!txHash"
            :class="$style.confirm__linksItemValue"
            :href="explorerLink"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ shortenLink }}
          </a>
          <span v-else :class="$style.confirm__linksItemValue_none">—</span>
        </div>

        <div v-if="transactionOptions.to" :class="$style.confirm__linksItem">
          <span :class="$style.confirm__linksItemTitle"> {{ transactionOptions.to }} transaction:&nbsp; </span>
          <a v-if="!!txHash" :class="$style.confirm__linksItemValue" :href="l2Link" target="_blank" rel="noopener noreferrer">
            {{ shortenLink }}
          </a>
          <span v-else :class="$style.confirm__linksItemValue_none">—</span>
        </div>
      </div>

      <div :class="$style.closeButtonWrapper">
        <base-button full-width @click="onClose">{{ closeButtonText }}</base-button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapState } from 'vuex'

import { ApplicationMutation } from '@/types'
import { SuccessModal } from '@/modals'
import { createModalArgs, getEtherscanLink } from '@/utilities'
import { numbers, confirmationStatus, confirmationStep, transactionMethods, CHAINS } from '@/constants'

export default {
  name: 'ConfirmationModal',
  props: {
    modalName: {
      type: String,
      required: true,
    },
  },
  data: function () {
    return {
      title: '',
      txHash: '',
      isActive: false,
    }
  },
  computed: {
    ...mapGetters('wallet', ['chainConfig']),
    ...mapState('application', ['processing']),
    ...mapGetters('transaction', ['currentTransaction']),
    ...mapGetters('application', [
      'processingTxHash',
      'isProcessingError',
      'isProcessingStarted',
      'processingStatuses',
      'isProcessingComplete',
    ]),
    closeButtonText() {
      return this.isProcessingError ? 'Close' : 'Hide'
    },
    modal() {
      return this.processing.modal
    },
    stepsData() {
      try {
        switch (this.modal.type) {
          case transactionMethods.TRANSFER:
            return [
              { name: 'generate', text: 'Generating proof', progress: '' },
              { name: 'transact', text: 'Sending transaction', progress: '' },
              {
                name: 'wait',
                text: 'Waiting for transaction confirmation',
                progress: `${this.confirmations} / ${numbers.MIN_TRANSFER_CONFIRMATION}`,
              },
            ]
          case transactionMethods.FUND:
          case transactionMethods.WITHDRAW:
            return [
              { name: 'generate', text: 'Generating proof', progress: '' },
              { name: 'transact', text: 'Sending transaction', progress: '' },
              {
                name: 'wait',
                text: 'Waiting for transaction confirmation',
                progress: `${this.confirmations} / ${numbers.MIN_BRIDGE_CONFIRMATION}`,
              },
              { name: 'bridge', text: 'Waiting for OmniBridge transaction', progress: '' },
            ]
          default:
            return []
        }
      } catch (err) {
        return []
      }
    },
    confirmations() {
      try {
        const confirmations = this.currentTransaction(this.txHash)?.confirmations || numbers.ZERO
        return Math.min(confirmations, this.transactionOptions.maxConfirmations)
      } catch (err) {
        return numbers.ZERO
      }
    },
    l2Link() {
      return getEtherscanLink(this.modal.chainId, this.txHash, 'transaction')
    },
    explorerLink() {
      return getEtherscanLink(this.modal.chainId, this.txHash, 'transaction')
    },
    shortenLink() {
      return `${this.txHash.substring(numbers.ZERO, Number('8') + numbers.OX_LENGTH)}...${this.txHash.substring(
        Number('60') - Number('8'),
      )}`
    },
    symbol() {
      return this.chainConfig.symbol
    },
    transactionOptions() {
      switch (this.modal.type) {
        case transactionMethods.FUND:
          return { from: this.symbol, to: 'L2', maxConfirmations: numbers.MIN_BRIDGE_CONFIRMATION }
        case transactionMethods.TRANSFER:
          return { from: 'L2', to: '', maxConfirmations: numbers.MIN_TRANSFER_CONFIRMATION }
        case transactionMethods.WITHDRAW:
          return { from: 'L2', to: this.symbol, maxConfirmations: numbers.MIN_BRIDGE_CONFIRMATION }
        default:
          return {}
      }
    },
  },
  watch: {
    processingTxHash(newTxHash) {
      if (newTxHash && !this.txHash) {
        this.txHash = newTxHash
      }
    },
    isProcessingComplete(isComplete) {
      if (isComplete) {
        this.$modal.show(...createModalArgs(SuccessModal, { title: this.processing.modal.title }))
        this.onClose()
      }
    },
  },
  beforeDestroy() {
    this[ApplicationMutation.SET_PROCESSING_MODAL]({ isShow: false })

    const isFinished = this.isProcessingComplete || this.isProcessingError

    if (isFinished) {
      this[ApplicationMutation.CLEAR_PROCESSING]()
    }

    if (this.closeTimer) {
      clearTimeout(this.closeTimer)
    }
  },
  mounted() {
    if (!this.isProcessingStarted) {
      this[ApplicationMutation.SET_PROCESSING_STATUS]({ step: confirmationStep.GENERATE, status: confirmationStatus.LOADING })
    }

    this.txHash = this.processingTxHash
  },
  created() {
    this[ApplicationMutation.SET_PROCESSING_MODAL]({ isShow: true })
  },
  methods: {
    ...mapMutations('application', [
      ApplicationMutation.CLEAR_PROCESSING,
      ApplicationMutation.SET_PROCESSING_MODAL,
      ApplicationMutation.SET_PROCESSING_STATUS,
    ]),
    onClose() {
      this.$modal.hide(this.modalName)
    },
  },
}
</script>

<style lang="scss" module>
@include animation-full-rotate;

.confirm {
  margin: 0 auto;
  padding: 2.4rem 0;
  display: flex;
  flex-direction: column;
  &__title {
    margin: 0 0 1rem;
    padding: 0 1.6rem;
    font-weight: $font-weight-bold;
    font-size: 2rem;
    line-height: 1;
    color: $color-white;
    @include media('sm') {
      margin: 0 0 1.2rem;
      padding: 0 2rem;
      font-size: 2.4rem;
    }
  }
  &__text {
    margin: 0 0 1.6rem;
    padding: 0 1.6rem 1.6rem;
    font-weight: $font-weight-medium;
    font-size: 1.4rem;
    line-height: 1.2;
    color: $color-white;
    border-bottom: 0.1rem solid $color-dark;
    box-shadow: 0 0.1rem $color-dark-light;
    @include media('sm') {
      margin: 0 0 2.4rem;
      padding: 0 2rem 1.6rem;
    }
  }
  &__list {
    margin: 0 0 2.2rem;
    padding: 0 1.6rem 1.6rem;
    list-style: none;
    font-size: 1.4rem;
    line-height: 1.2;
    border-bottom: 0.1rem solid $color-dark;
    box-shadow: 0 0.1rem $color-dark-light;
    @include media('sm') {
      padding: 0 2rem 1.6rem;
    }
  }
  &__listItem {
    position: relative;
    margin: 0 0 1.6rem;
    display: flex;
    align-items: center;
    &:last-child {
      margin: 0;
    }
  }
  &__listItemStatus {
    position: absolute;
    left: 0;
  }
  &__listItemText {
    padding: 0 0 0 3rem;
    color: inherit;
  }
  &__listItemLoading {
    position: relative;
    width: 1.6rem;
    height: 1.6rem;
    display: inline-flex;
    &::after {
      content: '';
      margin: auto;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      position: absolute;
      display: block;
      width: 1.6rem;
      height: 1.6rem;
      background-color: $color-transparent;
      background-image: none;
      border: 0.2rem solid $color-white;
      border-color: $color-default $color-default $color-default $color-white;
      border-radius: 50%;
      animation: animation-full-rotate $duration-animation-1200ms linear infinite;
      opacity: $opacity-default;
    }
  }
  &__links {
    padding: 0 1.6rem;
    @include media('sm') {
      padding: 0 2rem;
    }
  }
  &__linksItem {
    margin: 0 0 0.8rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    &:last-child {
      margin: 0;
    }
  }
  &__linksItemTitle {
    font-size: 1.4rem;
    line-height: 1.2;
  }
  &__linksItemValue {
    font-size: 1.4rem;
    line-height: 1.2;
    color: $color-primary;
  }
  &__successLink {
    color: $color-primary;
    text-decoration: underline;
  }
}

.success {
  color: $color-success;
}
.fail {
  color: $color-danger;
}

.closeButtonWrapper {
  display: flex;
  margin: 2.2rem auto 0;
  padding: 2.4rem 2rem 0;
  border-top: 0.1rem solid #1d1e23;
  box-shadow: 0px -0.1rem #3f4047;
}
</style>
