<template>
  <styled-switcher slot-name="fund">
    <template slot="body">
      <div :class="$style.fund__inputWrap">
        <base-input
          :ticker="chainConfig.symbol"
          button-text="max"
          input-mode="numeric"
          label="Token amount"
          :model-value="amount"
          :error="hasError"
          :button-click="onSetMax"
          :icon="chainConfig.icon"
          :disabled="isInputDisabled"
          :info="balance"
          :error-message="errorMessage"
          @update:modelValue="onInputChangeAmount"
        />
      </div>

      <base-input
        type="text"
        label="Recipient address"
        :error="isRecipientAddressError"
        :loading="isAddressChecking"
        :disabled="isInputDisabled"
        :model-value="recipientAddress"
        :error-message="recipientAddressError"
        :error-link="recipientAddressErrorLink"
        placeholder-text="Place recipient address here"
        @update:modelValue="onChangeRecipientAddress"
      />
    </template>

    <template slot="actions">
      <base-button v-if="shouldChangeChain" full-width @click="onChainChange">Change network</base-button>

      <span v-else-if="isConnected" v-tooltip="actionButtonTooltip" :class="$style.fund__actionWrapper">
        <base-button full-width :loading="isLoading" :disabled="isActionButtonDisabled" @click="onFundAction">
          {{ actionButtonText('Fund', amount) }}
        </base-button>
      </span>

      <base-button v-else full-width :loading="isLoading" @click="connectModal">Connect wallet</base-button>
    </template>
  </styled-switcher>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex'

import { ApplicationMutation, AccountMutation } from '@/types'

import { ConfirmationModal } from '@/modals'
import { StyledSwitcher } from '@/containers'
import { debounce, createModalArgs, toDecimalsPlaces, fromWei } from '@/utilities'
import { errors, BG_ZERO, numbers, registerGuideUrl, transactionMethods, registerStatuses } from '@/constants'

export default {
  components: {
    StyledSwitcher,
  },
  inject: ['setupProvider'],
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
      isRecipientRegistered: false,
    }
  },
  computed: {
    ...mapGetters('transaction', ['isPendingTxs']),
    ...mapGetters('account', ['accountAddress', 'isRegisteredInPool', 'isRegisteredInPoolNotChecked', 'isRegisterProcessing']),
    ...mapGetters('wallet', [
      'isL2Chain',
      'l1ChainId',
      'isConnected',
      'chainConfig',
      'walletBalance',
      'walletAddress',
      'mismatchNetwork',
    ]),
    ...mapGetters('application', [
      'maximumDeposit',
      'getMaxAmountFund',
      'actionButtonText',
      'isProcessingStarted',
      'getIsBalanceEnoughFund',
    ]),
    isFundForSelf() {
      return this.recipientAddress === this.accountAddress || this.accountAddress === this.ensAddress
    },
    isExternalAddressNotRegistered() {
      const isAddress = !this.isInvalidAddress && Boolean(this.recipientAddress.length)
      const isValidRecipient = !this.isRecipientRegistered && !this.isFundForSelf

      return !this.isAddressChecking && isAddress && isValidRecipient
    },
    actionButtonTooltip() {
      if (this.isPendingTxs) {
        return 'Has pending transactions'
      }

      if (this.isRegisteredInPoolNotChecked) {
        return 'Checking registration'
      }

      if (this.isRegisterProcessing) {
        return 'Waiting for registration'
      }

      return null
    },
    shouldChangeChain() {
      return this.isConnected && (this.isL2Chain || this.mismatchNetwork)
    },
    isRecipientAddressError() {
      const isLoading = this.isAddressChecking || this.isLoading
      const isError = this.isInvalidAddress || this.isExternalAddressNotRegistered

      return isError && !isLoading && !!this.recipientAddress
    },
    isActionButtonDisabled() {
      const isAddressError = !this.recipientAddress || this.isRecipientAddressError
      const isLoading = this.isPendingTxs || this.isLoading || this.isAddressChecking || this.isProcessingStarted
      const isFundDisabled =
        this.isConnected && (isAddressError || !Number(this.amount) || !this.isEnoughBalance || this.hasError)

      return isFundDisabled || isLoading || this.isRegisteredInPoolNotChecked || this.isRegisterProcessing
    },
    isInputDisabled() {
      return this.isLoading || !this.isConnected
    },
    balance() {
      let formattedBalance = '0'

      if (this.isConnected) {
        formattedBalance = toDecimalsPlaces(fromWei(this.walletBalance))
      }

      return 'Wallet balance: ' + formattedBalance
    },
    recipientAddressError() {
      if (this.isInvalidAddress) {
        return errors.validation.INVALID_ADDRESS
      }

      if (this.isExternalAddressNotRegistered) {
        return errors.validation.NOT_REGISTERED_IN_POOL
      }

      return ''
    },
    recipientAddressErrorLink() {
      if (this.isExternalAddressNotRegistered && !this.isInvalidAddress) {
        return registerGuideUrl
      }
      return null
    },
  },
  watch: {
    accountAddress(newAddress) {
      this.recipientAddress = newAddress
    },
    balance() {
      this.checkIsBalanceEnough()
    },
    isConnected(newValue) {
      if (!newValue) {
        this.resetError()
        this.amount = ''
        this.isENS = false
        this.ensAddress = ''
        this.recipientAddress = ''
      }
    },
    amount() {
      this.checkIsBalanceEnough()
      this.checkAmountDebouncer()
    },
    isRegisteredInPool(newValue) {
      if (this.isFundForSelf) {
        this.isRecipientRegistered = newValue
      }
    },
  },
  created() {
    this.isENS = false
    this.ensAddress = ''
    this.recipientAddress = this.accountAddress
    this.isRecipientRegistered = this.isRegisteredInPool
  },
  methods: {
    ...mapMutations('application', [ApplicationMutation.SET_PROCESSING_MODAL]),
    ...mapMutations('account', [AccountMutation.SET_REGISTERED_IN_POOL_STATUS]),
    ...mapActions('account', ['checkRegisterInPool']),
    ...mapActions('wallet', ['changeChain', 'getWalletBalance']),
    ...mapActions('application', ['errorHandler', 'validateAddress', 'checkRecipientAddress', 'createDepositWithStatus']),
    resetError() {
      this.hasError = false
      this.errorMessage = ''
    },
    async onChainChange() {
      try {
        this.isLoading = true
        this.resetError()

        await this.changeChain(this.l1ChainId)

        this.checkIsBalanceEnough()
        this.checkAmountDebouncer()
      } catch (err) {
        await this.errorHandler({ errorMessage: err.message, title: 'Change network error' })
      } finally {
        this.isLoading = false
      }
    },
    async onFundAction() {
      try {
        this.isLoading = true
        this.resetError()

        await this.getWalletBalance()

        this.checkIsBalanceEnough()

        if (!this.isEnoughBalance) {
          return
        }

        const maximumDeposit = Number(this.maximumDeposit)

        if (Number(this.amount) > maximumDeposit) {
          this.errorMessage = `${errors.validation.MAX_DEPOSIT_AMOUNT} ${maximumDeposit} ETH`
          this.hasError = true
          return
        }

        this[ApplicationMutation.SET_PROCESSING_MODAL]({
          title: 'Deposit',
          chainId: this.l1ChainId,
          type: transactionMethods.FUND,
        })

        this.$modal.show(...createModalArgs(ConfirmationModal, {}, { clickToClose: false }))

        if (this.isRecipientRegistered) {
          const address = this.isENS ? this.ensAddress : this.recipientAddress
          await this.createDepositWithStatus({ amount: this.amount, address })
          return
        }

        if (this.isFundForSelf) {
          this[AccountMutation.SET_REGISTERED_IN_POOL_STATUS](registerStatuses.PROCESSING)
          await this.createDepositWithStatus({ amount: this.amount, withRegister: true, address: this.walletAddress })
        }
      } catch {
        if (this.isFundForSelf && !this.isRecipientRegistered) {
          this.checkRegisterInPool(this.walletAddress)
        }
      } finally {
        if (!this.hasError) {
          this.amount = ''
          this.getWalletBalance()
        }
        this.isLoading = false
      }
    },
    checkIsBalanceEnough() {
      if (!Number(this.amount)) {
        this.isEnoughBalance = true
        return
      }

      this.isEnoughBalance = this.getIsBalanceEnoughFund(this.amount)

      this.hasError = !this.isEnoughBalance
      this.errorMessage = !this.isEnoughBalance ? errors.validation.INSUFFICIENT_FUNDS : ''
    },
    checkAmountDebouncer: debounce(function () {
      const maximumDeposit = Number(this.maximumDeposit)
      const isLessThanMax = Number(this.amount) > maximumDeposit

      if (isLessThanMax && !this.hasError) {
        this.errorMessage = `${errors.validation.MAX_DEPOSIT_AMOUNT} ${maximumDeposit} ETH`
        this.hasError = true
      }
    }, numbers.CHECK_AMOUNT_DELAY),
    onInputChangeAmount(value) {
      this.resetError()

      this.amount = value
    },
    onSetMax() {
      this.resetError()

      const maxAmount = this.getMaxAmountFund()
      this.amount = maxAmount.gt(BG_ZERO) ? fromWei(maxAmount) : '0'
      this.checkAmountDebouncer()
    },
    onChangeRecipientAddress(value) {
      this.recipientAddress = value
      this.isAddressChecking = true
      this.checkAddressDebouncer()
    },
    async connectModal() {
      try {
        this.isLoading = true
        await this.setupProvider('METAMASK')
      } catch (err) {
      } finally {
        this.isLoading = false
      }
    },
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
.fund {
  &__inputWrap {
    margin: 0 0 2.4rem;
  }
  &__actionWrapper {
    width: 100%;
  }
}
</style>
