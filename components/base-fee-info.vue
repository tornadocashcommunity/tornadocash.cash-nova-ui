<template>
  <div :class="$style.feeInfo">
    <div :class="$style.feeInfo__method">
      <h5 :class="$style.feeInfo__methodTitle">{{ text }}</h5>
      <div :class="$style.feeInfo__settings">
        <span :class="$style.feeInfo__itemTitle">{{ transferMethod }}</span>
        <base-button type="link" size="symbol" @click="openSettingsModal">
          <base-icon name="settings" size="small" />
        </base-button>
      </div>
    </div>

    <div v-if="withdrawalRelayerFee" :class="$style.feeInfo__item">
      <span :class="$style.feeInfo__itemTitle">Relayer fee</span>
      <span v-if="withdrawalRelayerFee" :class="$style.feeInfo__itemValue">{{ withdrawalRelayerFee }} %</span>
      <span v-else :class="$style.feeInfo__itemValue">-</span>
    </div>

    <div v-if="l1FeeAmount" :class="$style.feeInfo__item">
      <span :class="$style.feeInfo__itemTitle">L1 network fee</span>
      <span v-if="l1FeeAmount" :class="$style.feeInfo__itemValue">{{ l1FeeAmount }} {{ chainSymbol }}</span>
      <span v-else :class="$style.feeInfo__itemValue">-</span>
    </div>

    <div v-if="isRelayer" :class="$style.feeInfo__item">
      <span :class="$style.feeInfo__itemTitle">{{ transferRelayerFee ? 'Relayer fee' : 'Total fee' }}</span>
      <span v-if="fee" :class="$style.feeInfo__itemValue">{{ fee }} {{ chainSymbol }}</span>
      <span v-else :class="$style.feeInfo__itemValue">-</span>
    </div>
    <div v-if="isWithdraw" :class="[$style.feeInfo__item, $style.feeInfo__item_last, { [$style.feeInfo__error]: error }]">
      <span :class="$style.feeInfo__resultTitle">To receive</span>
      <span v-if="toReceive" :class="$style.feeInfo__resultValue"> {{ toReceive }} {{ chainSymbol }} </span>
      <span v-else :class="$style.feeInfo__itemValue">-</span>
    </div>
    <div :class="[$style.feeInfo__result, { [$style.feeInfo__error]: error }]">
      <span :class="$style.feeInfo__resultTitle">Total</span>
      <span v-if="amounts.toSend" :class="$style.feeInfo__resultValue"> {{ amounts.toSend }} {{ chainSymbol }} </span>
      <span v-else :class="$style.feeInfo__itemValue">-</span>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { SettingsModal } from '@/modals'
import { CHAINS, numbers } from '@/constants'
import { createModalArgs, toDecimalsPlaces, toWei, fromWei, isAmount } from '@/utilities'

export default {
  inject: ['setupProvider'],
  props: {
    amount: {
      type: String,
      required: true,
    },
    isCustom: {
      type: Boolean,
      default: true,
    },
    method: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    error: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapGetters('wallet', ['l1ChainId', 'l2ChainId']),
    ...mapGetters('relayer', ['ethRate', 'currentRelayer']),
    ...mapGetters('account', ['isRelayer', 'transferMethod']),
    ...mapGetters('application', ['l1Fee', 'networkFee', 'operationFee', 'amountsToView', 'operationAmounts']),
    isWithdraw() {
      return this.method === 'withdraw'
    },
    l1FeeAmount() {
      if (!this.isWithdraw) {
        return null
      }

      if (!this.l1Fee) {
        return null
      }

      return toDecimalsPlaces(fromWei(this.l1Fee), numbers.FEE_PRECISION)
    },
    transferRelayerFee() {
      if (!this.isRelayer || !this.currentRelayer) {
        return null
      }

      if (this.isWithdraw) {
        return null
      }
      const { serviceFee } = this.currentRelayer

      const relayerFee = fromWei(serviceFee.transfer)
      return toDecimalsPlaces(relayerFee, numbers.FEE_PRECISION)
    },
    withdrawalRelayerFee() {
      if (!this.isRelayer) {
        return null
      }

      if (this.isWithdraw) {
        const { serviceFee } = this.currentRelayer

        return serviceFee.withdrawal
      }
      return null
    },
    amounts() {
      return this.amountsToView({
        amount: this.amount,
        method: this.method,
        isRelayer: this.isRelayer,
        withRelayer: this.isRelayer,
        isCustom: this.isCustom,
      })
    },
    toReceive() {
      if (!this.isWithdraw || !isAmount(this.amounts.toReceive)) {
        return null
      }
      return this.amounts.toReceive
    },
    fee() {
      if (!isAmount(this.amount)) {
        return
      }

      let amountInWei = toWei(this.amount)
      let operationFee = this.operationFee(amountInWei, this.method)

      if (this.isWithdraw) {
        amountInWei = amountInWei.add(this.l1Fee)
        operationFee = this.operationFee(amountInWei, this.method).add(this.l1Fee)
      }

      return toDecimalsPlaces(fromWei(operationFee), numbers.FEE_PRECISION)
    },
    chainSymbol() {
      return CHAINS[this.l1ChainId].symbol
    },
  },
  methods: {
    amountGetter() {
      return this.amount
    },
    openSettingsModal() {
      const dataModal = createModalArgs(SettingsModal, {
        method: this.method,
        isCustom: this.isCustom,
        amountGetter: this.amountGetter,
        setupProvider: this.setupProvider,
      })
      this.$modal.show(...dataModal)
    },
  },
}
</script>

<style lang="scss" module>
.feeInfo {
  margin: 0 0 2.4rem;
  padding: 1.1rem 0 1.8rem;
  width: 100%;
  background-color: $color-white-003;
  border-radius: 0.4rem;
  &__method {
    margin: 0 0 0.8rem;
    padding: 0 1.2rem 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &__methodTitle {
    margin: 0;
    font-weight: $font-weight-semiBold;
    font-size: 1.4rem;
    line-height: 1;
    color: $color-white;
  }
  &__settings {
    display: flex;
    align-items: center;
  }
  &__item {
    margin: 0;
    padding: 0 2rem 1.6rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: $font-weight-regular;
    &_last {
      margin: 0 0 1.6rem;
      border-bottom: 0.1rem solid $color-dark;
      box-shadow: 0 0.1rem $color-dark-light;
    }
  }
  &__itemTitle {
    margin: 0;
    font-weight: inherit;
    font-size: 1.4rem;
    line-height: 1;
    color: $color-white;
    &:first-letter {
      text-transform: uppercase;
    }
  }
  &__itemValue {
    margin: 0;
    font-weight: inherit;
    font-size: 1.4rem;
    line-height: 1;
    color: $color-white;
  }
  &__result {
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: $font-weight-semiBold;
  }
  &__resultTitle {
    margin: 0;
    font-weight: inherit;
    font-size: 1.4rem;
    line-height: 1;
    color: $color-white;
  }
  &__resultValue {
    margin: 0;
    font-weight: inherit;
    font-size: 1.4rem;
    line-height: 1;
    color: $color-white;
  }

  &__error {
    .feeInfo__itemTitle,
    .feeInfo__itemValue,
    .feeInfo__resultValue,
    .feeInfo__resultTitle {
      color: $color-danger;
    }
  }
}
</style>
