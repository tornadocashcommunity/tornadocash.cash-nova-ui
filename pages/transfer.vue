<template>
  <pull-operation-wrapper slot-name="transfer" type="transfer" :amount="amount" :checker="checkIsBalanceEnough">
    <template slot="body">
      <div :class="$style.transfer__inputWrap">
        <base-input
          input-mode="numeric"
          button-text="max"
          :ticker="chainConfig.symbol"
          label="Token amount"
          :model-value="amount"
          :button-click="onSetMax"
          :icon="chainConfig.icon"
          :disabled="isInputDisabled"
          :info="accountPoolBalance"
          :error="hasError"
          :error-message="errorMessage"
          @update:modelValue="onChangeAmount"
        />
      </div>

      <base-input
        type="text"
        :loading="isAddressChecking"
        :error="isRecipientAddressError"
        label="Recipient address"
        :disabled="isInputDisabled"
        :model-value="recipientAddress"
        :error-message="recipientAddressError"
        :error-link="recipientAddressErrorLink"
        placeholder-text="Place recipient address here"
        @update:modelValue="onChangeRecipientAddress"
      />
    </template>

    <template slot="actions">
      <action-button
        :amount="amount"
        :recipient-address="recipientAddress"
        :is-enough-balance="isEnoughBalance"
        :is-disabled="isActionButtonError"
        :is-loading="isActionButtonLoading"
        type="transfer"
        action-text="Transfer"
        fee-info-text="Transfer method"
        :on-action="onTransferAction"
        :on-reset-error="resetError"
      />
    </template>
  </pull-operation-wrapper>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex'

import { ApplicationMutation } from '@/types'
import { PullOperationWrapper } from '@/containers'
import { debounce, toDecimalsPlaces, fromWei, isAmount } from '@/utilities'
import { numbers, errors, transactionMethods, registerGuideUrl, BG_ZERO } from '@/constants'

export default {
  components: {
    PullOperationWrapper,
  },
  data: function () {
    return {
      amount: '',
      isENS: false,
      ensAddress: '',
      hasError: false,
      isLoading: false,
      errorMessage: '',
      recipientAddress: '',
      isEnoughBalance: true,
      isInvalidAddress: false,
      isAddressChecking: false,
      isRecipientRegistered: true,
    }
  },
  computed: {
    ...mapGetters('wallet', ['chainConfig']),
    ...mapGetters('application', ['getMaxAmount', 'getIsBalanceEnough']),
    ...mapGetters('account', ['accountBalance', 'isNotRegisteredInPool']),
    isRecipientAddressError() {
      const isError = this.isInvalidAddress || !this.isRecipientRegistered

      return isError && !this.isAddressChecking && Boolean(this.recipientAddress)
    },
    isActionButtonError() {
      return this.isRecipientAddressError || this.hasError
    },
    isActionButtonLoading() {
      return this.isLoading || this.isAddressChecking
    },
    isFilledInputs() {
      return Boolean(Number(this.amount)) && Boolean(this.recipientAddress)
    },
    isInputDisabled() {
      return this.isLoading
    },
    accountPoolBalance() {
      const formattedPoolBalance = toDecimalsPlaces(fromWei(this.accountBalance))

      return 'Shielded balance: ' + formattedPoolBalance
    },
    recipientAddressError() {
      if (this.isInvalidAddress) {
        return errors.validation.INVALID_ADDRESS
      }

      return errors.validation.NOT_REGISTERED_IN_POOL
    },
    recipientAddressErrorLink() {
      if (!this.isRecipientRegistered && !this.isInvalidAddress) {
        return registerGuideUrl
      }
      return null
    },
  },
  methods: {
    ...mapMutations('application', [ApplicationMutation.SET_PROCESSING_MODAL]),
    ...mapActions('application', ['checkRecipientAddress', 'createPullOperation']),
    resetError() {
      this.hasError = false
      this.errorMessage = ''
    },
    checkIsBalanceEnough() {
      if (this.isNotRegisteredInPool || !isAmount(this.amount)) {
        this.isEnoughBalance = true
        return
      }

      this.isEnoughBalance = this.getIsBalanceEnough(this.amount, 'transfer')

      this.hasError = !this.isEnoughBalance
      this.errorMessage = !this.isEnoughBalance ? errors.validation.INSUFFICIENT_FUNDS : ''
    },
    async onTransferAction() {
      try {
        this.isLoading = true
        this.resetError()

        this.checkIsBalanceEnough()

        if (this.isEnoughBalance) {
          const address = this.isENS ? this.ensAddress : this.recipientAddress

          await this.createPullOperation({
            address,
            title: 'Transfer',
            amount: this.amount,
            type: transactionMethods.TRANSFER,
          })
        }
      } catch (err) {
        console.error('onTransferAction error:', err.message)
      } finally {
        if (!this.hasError) {
          this.amount = ''
          this.isENS = false
          this.ensAddress = ''
          this.recipientAddress = ''
        }
        this.isLoading = false
      }
    },
    onChangeAmount(value) {
      this.resetError()

      this.amount = value
    },
    onSetMax() {
      this.resetError()

      const maxAmount = this.getMaxAmount('transfer')
      this.amount = maxAmount.gt(BG_ZERO) ? fromWei(maxAmount) : '0'
    },
    onChangeRecipientAddress(value) {
      this.recipientAddress = value
      this.isAddressChecking = true
      this.checkAddressDebouncer()
    },
    // TODO create custom component with this logic
    checkAddressDebouncer: debounce(async function () {
      this.isAddressChecking = true
      this.isRecipientRegistered = false

      const validationState = await this.checkRecipientAddress(this.recipientAddress)
      if (validationState) {
        this.isENS = validationState.isENS
        this.ensAddress = validationState.ensAddress
        this.isInvalidAddress = validationState.isInvalidAddress
        this.isRecipientRegistered = validationState.isRegistered
      }

      this.isAddressChecking = false
    }, numbers.CHECK_ADDRESS_DELAY),
  },
}
</script>

<style lang="scss" module>
.transfer {
  &__inputWrap {
    margin: 0 0 2.4rem;
  }
}
</style>
