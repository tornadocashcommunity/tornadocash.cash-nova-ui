<template>
  <pull-operation-wrapper slot-name="withdraw" type="withdrawal" :amount="amount" :checker="onCheckAmounts">
    <template slot="body">
      <div :class="$style.withdraw__inputWrap">
        <div :class="$style.info">
          <span :class="$style.info__text">ETH to withdraw</span>
        </div>
        <div :class="$style.withdraw__inputWrapSwitcher">
          <div
            :class="[
              $style.withdraw__amountSwitcher,
              {
                [$style.withdraw__amountSwitcher_error]: hasError,
              },
            ]"
          >
            <base-switch-button
              v-for="defaultValue of defaultValues"
              :key="defaultValue"
              :value="defaultValue"
              sub-value="ETH"
              :selected="toSend"
              :has-error="hasError"
              :on-switch="onSwitchButton"
              :is-enough-balance="isEnoughBalance"
            />
          </div>
        </div>

        <base-input
          input-mode="numeric"
          button-text="max"
          label="ETH to receive"
          :error="hasError"
          :model-value="amount"
          :icon="chainConfig.icon"
          :disabled="isInputDisabled"
          :error-message="errorMessage"
          :ticker="chainConfig.symbol"
          :info="accountPoolBalance"
          :button-click="onSetMax"
          @update:modelValue="onChangeAmount"
        />
        <div v-if="shouldShowPrivacyNotice" :class="$style.customAmountInfo">
          <p :class="$style.warningInfo__text">
            Using a custom amount may compromise your privacy.
            <base-button free-size type="link" :class="$style.warningInfo__link" @click="onShowElementChooserModal">
              Why?
            </base-button>
          </p>
          <div :class="$style.warningInfo__checkbox">
            <base-checkbox
              :id="alertPrivacyCheckBoxId"
              v-model="shouldNotShowingTransfer"
              label="base-checkbox"
              @click="handlePrivacyNotificationToggle"
            />

            <label :for="alertPrivacyCheckBoxId" :class="$style.warningInfo__checkboxLabel">
              I understand, don't show this notice again
            </label>
          </div>
        </div>
      </div>

      <div :class="$style.addressContainer">
        <base-input
          type="text"
          :error="isRecipientAddressError"
          label="Recipient address"
          :disabled="isInputDisabled"
          :loading="isAddressChecking"
          :model-value="recipientAddress"
          error-message="Recipient address is invalid"
          placeholder-text="Place recipient address here"
          @update:modelValue="onChangeRecipientAddress"
        />
      </div>

      <div v-if="shouldShowNotice" :class="$style.warningInfo">
        <p :class="$style.warningInfo__text">
          The address you provided is&nbsp;already registered. Would you like to&nbsp;make a
          <nuxt-link to="transfer" :class="$style.warningInfo__link">shielded transfer</nuxt-link>&nbsp;instead?
        </p>

        <div :class="$style.warningInfo__checkbox">
          <base-checkbox
            :id="alertCheckBoxId"
            v-model="shouldNotShowingTransfer"
            label="base-checkbox"
            @click="handleNotificationToggle"
          />

          <label :for="alertCheckBoxId" :class="$style.warningInfo__checkboxLabel">
            I understand, don't show this notice again
          </label>
        </div>
      </div>
    </template>

    <template slot="actions">
      <action-button
        :amount="amount"
        :recipient-address="recipientAddress"
        :is-enough-balance="isEnoughBalance"
        :is-disabled="isActionButtonError"
        :is-loading="isActionButtonLoading"
        type="withdraw"
        :is-custom="isCustomAmount"
        action-text="Withdraw"
        fee-info-text="Withdrawal method"
        :on-action="onWithdrawalAction"
        :on-reset-error="resetError"
      />
    </template>
  </pull-operation-wrapper>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex'

import { BigNumber } from 'ethers'

import { AccountMutation } from '@/types'
import { ElementChooserModal } from '@/modals'
import { PullOperationWrapper } from '@/containers'
import { numbers, BG_ZERO, errors, transactionMethods } from '@/constants'
import { isAmount, createModalArgs, debounce, toDecimalsPlaces, fromWei, toChecksumAddress, toWei } from '@/utilities'

import ActionButton from '@/components/ActionButton.vue'

// ничего не надо выбирать
export default {
  components: {
    PullOperationWrapper,
    ActionButton,
  },
  data: function () {
    return {
      amount: '',
      toSend: '',
      isENS: false,
      ensAddress: '',
      hasError: false,
      isLoading: false,
      errorMessage: '',
      isMaxPressed: false,
      recipientAddress: '',
      isCustomAmount: false,
      isEnoughBalance: true,
      isInvalidAddress: false,
      isAddressChecking: false,
      isRecipientRegistered: false,
      shouldNotShowingPrivacy: false,
      shouldNotShowingTransfer: false,
      defaultValues: ['0.1', '0.3', '0.5', '1'],
      alertCheckBoxId: 'securedInternalTransfer',
      alertPrivacyCheckBoxId: 'privacyInternalTransfer',
    }
  },
  computed: {
    ...mapGetters('wallet', ['chainConfig']),
    ...mapGetters('application', [
      'l1Fee',
      'tokensToSend',
      'operationAmounts',
      'minimalWithdrawal',
      'maximumWithdrawal',
      'omnibridgeDailyLimit',
      'getIsBalanceEnough',
    ]),
    ...mapGetters('account', [
      'isRelayer',
      'accountBalance',
      'accountAddress',
      'isNotRegisteredInPool',
      'shouldShowPrivacyAlert',
      'shouldShowPoolTransferAlert',
    ]),
    shouldShowNotice() {
      const isSelfWithdraw =
        toChecksumAddress(this.accountAddress) === toChecksumAddress(this.recipientAddress) ||
        toChecksumAddress(this.accountAddress) === toChecksumAddress(this.ensAddress)
      const isCorrectAddressForShow = this.recipientAddress && !isSelfWithdraw && !this.isInvalidAddress

      return this.isRecipientRegistered && isCorrectAddressForShow && this.shouldShowPoolTransferAlert
    },
    shouldShowPrivacyNotice() {
      return this.isCustomAmount && this.shouldShowPrivacyAlert
    },
    isRecipientAddressError() {
      return this.isInvalidAddress && !this.isAddressChecking && Boolean(this.recipientAddress)
    },
    isActionButtonError() {
      return this.isInvalidAddress || this.hasError
    },
    isActionButtonLoading() {
      return this.isLoading || this.isAddressChecking
    },
    isInputDisabled() {
      return this.isLoading
    },
    accountPoolBalance() {
      const formattedPoolBalance = toDecimalsPlaces(fromWei(this.accountBalance))

      return 'Shielded balance: ' + formattedPoolBalance
    },
  },
  watch: {
    l1Fee() {
      if (this.isMaxPressed) {
        this.onSetMax()
        return
      }
      if (this.isCustomAmount) {
        this.onGetToSend()
      } else if (isAmount(this.toSend)) {
        this.onSetToSend(this.toSend)
      }
    },
  },
  created() {
    if (!this.isEnoughBalance) {
      this.resetError()
      this.amount = ''
      this.toSend = ''
      this.isCustomAmount = false
    }
    this.checkDayLimit()
  },
  methods: {
    ...mapMutations('account', [AccountMutation.SET_SHOULD_SHOW_POOL_TRANSFER_ALERT, AccountMutation.SET_SHOULD_PRIVACY_ALERT]),
    ...mapActions('application', ['createPullOperation', 'checkRecipientAddress', 'getDayLimit']),
    resetError() {
      this.hasError = false
      this.errorMessage = ''
    },
    onCheckAmounts() {
      this.checkIsBalanceEnough()
      this.checkAmountDebouncer()
    },
    checkIsBalanceEnough() {
      if (this.isNotRegisteredInPool || !isAmount(this.toSend)) {
        this.isEnoughBalance = true
        return
      }

      this.isEnoughBalance = this.getIsBalanceEnough(this.toSend, 'withdraw')

      this.hasError = !this.isEnoughBalance
      this.errorMessage = !this.isEnoughBalance ? errors.validation.INSUFFICIENT_FUNDS : ''
    },
    handleNotificationToggle() {
      this[AccountMutation.SET_SHOULD_SHOW_POOL_TRANSFER_ALERT](!this.shouldShowPoolTransferAlert)
    },
    handlePrivacyNotificationToggle() {
      this[AccountMutation.SET_SHOULD_PRIVACY_ALERT](!this.shouldShowPrivacyAlert)
    },
    onGetToSend() {
      this.resetError()

      const toSend = this.tokensToSend(this.amount, 'withdraw', this.isRelayer)

      this.toSend = isAmount(toSend) && BigNumber.from(toWei(toSend)).gt(BG_ZERO) ? toSend : ''
      this.onCheckAmounts()
    },
    onSetToSend(toSend) {
      this.resetError()

      const { toReceive } = this.operationAmounts(toSend, 'withdraw', this.isRelayer)

      const reduceAmount = isAmount(toReceive) && BigNumber.from(toWei(toReceive)).gt(BG_ZERO) ? toReceive : '0'

      this.toSend = toSend
      this.onChangeAmount(reduceAmount, toSend)
    },
    onSwitchButton(toSend) {
      this.isMaxPressed = false
      this.onSetToSend(toSend)
    },
    onChangeAmount(amount, toSend) {
      this.resetError()

      this.amount = String(amount)

      if (!toSend) {
        this.isMaxPressed = false
        this.toSend = this.tokensToSend(this.amount, 'withdraw', this.isRelayer)
      }

      if (isAmount(this.toSend)) {
        this.isCustomAmount = !this.defaultValues.includes(this.toSend)
        this.onCheckAmounts()
      } else {
        this.isCustomAmount = false
      }
    },
    onChangeRecipientAddress(value) {
      this.recipientAddress = value
      this.isInvalidAddress = false
      this.isAddressChecking = true
      this.checkAddressDebouncer()
    },
    onSetMax() {
      this.isMaxPressed = true
      this.onSetToSend(fromWei(this.accountBalance))
    },
    async checkDayLimit() {
      await this.getDayLimit()
    },
    checkAmountDebouncer: debounce(function () {
      this.checkAmount()
    }, numbers.CHECK_AMOUNT_DELAY),
    checkAmount() {
      const isGreaterThanZero = Number(this.amount) > numbers.ZERO

      if (!isGreaterThanZero || this.hasError) {
        return
      }

      const isLessThanMin = Number(this.amount) < Number(this.minimalWithdrawal)

      if (isLessThanMin) {
        this.errorMessage = `${errors.validation.MIN_WITHDRAW_AMOUNT} ${this.minimalWithdrawal}`
        this.hasError = true
      }

      const isGreaterThanMax = Number(this.amount) > Number(this.maximumWithdrawal)

      if (isGreaterThanMax && !this.hasError) {
        this.errorMessage = errors.errorsGetter([this.maximumWithdrawal]).MAX_WITHDRAW_AMOUNT
        this.hasError = true
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

    async onWithdrawalAction() {
      try {
        this.isLoading = true
        this.resetError()

        await this.checkDayLimit()

        this.checkAmount()
        if (this.hasError) {
          return
        }

        this.checkIsBalanceEnough()
        if (this.isEnoughBalance) {
          const address = this.isENS ? this.ensAddress : this.recipientAddress

          await this.createPullOperation({
            address,
            title: 'Withdrawal',
            amount: this.amount,
            type: transactionMethods.WITHDRAW,
          })

          this.onSetToSend(this.defaultValues[numbers.ZERO])
          this.onChangeAmount('')
        }
      } catch (err) {
        console.error('onWithdrawalAction error:', err.message)
      } finally {
        this.isLoading = false
      }
    },
    onShowElementChooserModal() {
      const dataModal = createModalArgs(ElementChooserModal, {}, { classes: 'modal_black' })
      return this.$modal.show(...dataModal)
    },
  },
}
</script>

<style lang="scss" module scoped>
.errorMessage {
  position: absolute;
  left: 0;
  top: calc(100% + 0.6rem);
  display: inline-block;
  font-family: $font-family-main;
  font-weight: $font-weight-regular;
  font-size: 1.2rem;
  line-height: 1.3;
  color: $color-danger;
}
.withdraw {
  &__inputWrap {
    margin: 0 0 2.4rem;
  }
  &__inputWrapSwitcher {
    position: relative;
    display: flex;
    align-items: center;
  }
  &__amountSwitcherLabel {
    margin: 0;
    padding: 0;
    display: inline-block;
    font-weight: $font-weight-semiBold;
    font-size: 1.4rem;
    line-height: 1.2;
    color: $color-grey;
    background-color: $color-transparent;
  }
  &__amountSwitcher {
    margin: 0 0 1rem;
    width: 100%;
    display: flex;
    justify-content: space-between;
    z-index: $zIndex-2;
    &_error {
      border-color: $color-danger;
    }
  }
  &__typeSwitchButton {
    padding: 0;
    min-width: auto;
    height: 2rem;
    margin-top: 2.5rem;
  }
}
.iconTicker {
  position: relative;
  padding: 0.8rem;
  height: 100%;
  display: inline-flex;
  grid-area: 2 / 2 / 3 / 3;
  align-items: center;
  gap: 0 0.4rem;
  flex: 0 0 auto;
  color: $color-white;
  background-color: $color-input-bg;
  border-radius: 0 0.4rem 0.4rem 0;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -0.6rem;
    width: 0.6rem;
    height: 100%;
    background-color: $color-input-bg;
  }
  &__value {
    font-weight: $font-weight-semiBold;
    font-size: 1.8rem;
    line-height: 1.2;
    text-transform: uppercase;
  }
}
.customAmountInfo,
.warningInfo {
  top: 2.5rem;
  margin-bottom: 1rem;
  position: relative;
  padding: 1.2rem 1.8rem;
  border: 0.1rem solid $color-warning;
  border-radius: 0.4rem;
  &__text {
    font-weight: $font-weight-medium;
    font-size: 1.4rem;
    line-height: 1.2;
    color: $color-white;
    margin: 0;
    &:not(:last-child) {
      margin: 0 0 1.2rem;
    }
  }
  &__checkbox {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: 0.8rem;
  }
  &__checkboxLabel {
    font-weight: $font-weight-medium;
    font-size: 1.2rem;
    line-height: 1;
    color: $color-white;
    cursor: pointer;
    user-select: none;
  }
  &__link {
    color: $color-warning;
    font-size: 1.4rem;
    text-decoration: none;
    &:hover:not([disabled]) {
      text-decoration: underline;
      color: $color-warning;
    }
  }
}
.customAmountInfo {
  margin: 3rem 0 1rem;
  top: 1rem;
  button {
    padding: 0;
    margin: 0;
    width: max-content;
    min-width: max-content;
    display: inline-flex;
    line-height: 1.1;
    height: unset;
  }
}
.addressContainer {
  position: relative;
}
.chainSwitcher {
  position: absolute;
  right: 0;
  top: 0.4rem;
  display: flex;
  align-items: center;
  z-index: $zIndex-2;
  &__checkboxLabel {
    font-weight: $font-weight-medium;
    font-size: 1.2rem;
    line-height: 1;
    color: $color-white;
    cursor: pointer;
    user-select: none;
    margin-left: 0.5rem;
  }
}
.info {
  margin: 0 0 0.7rem;
  display: inline-flex;
  justify-content: space-between;
  font-weight: $font-weight-medium;
  font-size: 1.4rem;
  line-height: 1.2;
  color: $color-input-placeholder;
  white-space: nowrap;
  overflow: hidden;
  user-select: none;
  position: relative;
  width: 100%;
  &__text {
    display: none;
    font-weight: $font-weight-semiBold;
    @include media('sm') {
      display: inline-block;
    }
  }
  &__button {
    margin: 0;
    text-decoration: unset;
    height: unset;
    font-size: 1.2rem;
    @include media('sm') {
      margin: 0 0 0 0.5rem;
    }
    &:hover {
      color: unset;
    }
  }
  &__buttonDescription {
    color: $color-success;
    transition: all $duration-animation-02s ease-in;
    margin-left: 0.5rem;
    &:first-letter {
      text-transform: uppercase;
    }
  }
}
</style>
