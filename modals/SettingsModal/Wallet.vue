<template>
  <div :class="$style.wallet">
    <div :class="$style.wallet__bodyWrapper">
      <div :class="$style.wallet__warningMessage">
        <!-- TODO: check text content -->
        <h5 :class="$style.wallet__warningMessageTitle">Attention</h5>
        <p :class="$style.wallet__warningMessageText">
          Make sure that {{ l2Symbol }} used to pay for the gas fee is not Linkable to ANY of your addresses. Otherwise, the
          anonymity of the {{ type }} will be compromised. It's recommended to use a relayer.
        </p>
      </div>
    </div>

    <div :class="$style.wallet__actionWrapper">
      <div :class="$style.wallet__info">
        <div :class="$style.wallet__method">
          <h5 :class="$style.wallet__methodTitle">{{ methodLabel }} summary</h5>
        </div>

        <div v-if="l1FeeAmount" :class="$style.wallet__item">
          <span :class="$style.wallet__itemTitle">L1 network fee</span>
          <span v-if="l1FeeAmount" :class="$style.wallet__itemValue">{{ l1FeeAmount }} {{ chainConfig.symbol }}</span>
          <span v-else :class="$style.wallet__itemValue">-</span>
        </div>

        <div v-if="isWithdraw" :class="[$style.wallet__item, $style.wallet__item_last]">
          <span :class="$style.wallet__resultTitle">To receive</span>
          <span v-if="toReceive" :class="$style.wallet__resultValue">{{ toReceive }} {{ chainConfig.symbol }}</span>
          <span v-else :class="$style.wallet__itemValue">-</span>
        </div>

        <div :class="$style.wallet__result">
          <span :class="$style.wallet__resultTitle">{{ methodLabel }} amount</span>
          <span v-if="amounts.toSend" :class="$style.wallet__resultValue">{{ amounts.toSend }} {{ chainConfig.symbol }}</span>
          <span v-else :class="$style.feeInfo__itemValue">-</span>
        </div>
      </div>

      <base-button v-if="isConnected" full-width @click="onSave">Save change</base-button>
      <base-button v-else full-width :loading="isLoading" @click="connectModal">Connect wallet</base-button>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

import { AccountMutation } from '@/types'
import { fromWei, toDecimalsPlaces } from '@/utilities'
import { transferMethods, CHAINS, numbers } from '@/constants'

export default {
  props: {
    amount: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    isCustom: {
      type: Boolean,
      required: true,
    },
    onClose: {
      required: true,
      type: Function,
    },
    setupProvider: {
      type: Function,
      required: true,
    },
  },
  data: function () {
    return {
      isLoading: false,
    }
  },
  computed: {
    ...mapGetters('account', ['isRelayer']),
    ...mapGetters('wallet', ['chainConfig', 'isConnected', 'l2ChainId']),
    ...mapGetters('application', ['l1Fee', 'amountsToView']),
    type() {
      const types = {
        transfer: 'transfer',
        withdraw: 'withdrawal',
      }

      return types[this.$route.name]
    },
    methodLabel() {
      const labels = {
        withdraw: 'Withdrawal',
        transfer: 'Transfer',
      }
      return labels[this.method]
    },
    l2Symbol() {
      return CHAINS[this.l2ChainId].symbol
    },
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
    amounts() {
      return this.amountsToView({
        amount: this.amount,
        method: this.method,
        isRelayer: this.isRelayer,
        withRelayer: false,
        isCustom: this.isCustom,
      })
    },
    toReceive() {
      if (!this.isWithdraw) {
        return null
      }
      return this.amounts.toReceive
    },
  },
  methods: {
    ...mapMutations('account', [AccountMutation.SET_TRANSFER_METHOD]),
    onSave() {
      this[AccountMutation.SET_TRANSFER_METHOD](transferMethods.WALLET)
      this.onClose()
    },
    async connectModal() {
      try {
        this.isLoading = true
        await this.setupProvider('METAMASK')
      } catch (err) {
        console.info('Change wallet error:', err.message)
      } finally {
        this.isLoading = false
      }
    },
  },
}
</script>

<style lang="scss" module>
.wallet {
  width: 100%;
  display: flex;
  position: relative;
  align-items: center;
  flex-direction: column;
  &__bodyWrapper {
    padding: 2.4rem 2rem 2rem;
    width: 100%;
    border-bottom: 0.1rem solid $color-dark;
    box-shadow: 0 0.1rem $color-dark-light;
  }
  &__inputWrap {
    margin: 2.4rem 0 0;
  }
  &__actionWrapper {
    width: 100%;
    padding: 2.4rem 2rem 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  &__info {
    margin: 0 0 2.4rem;
    padding: 1.8rem 0;
    width: 100%;
    background-color: $color-white-003;
    border-radius: 0.4rem;
  }
  &__method {
    margin: 0 0 0.8rem;
    padding: 0 1.2rem 0 2rem;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  &__methodTitle {
    margin: 0 0 1.6rem;
    font-weight: $font-weight-semiBold;
    font-size: 1.4rem;
    line-height: 1;
    color: $color-white;
  }
  &__item {
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
  &__warningMessage {
    margin: 0;
    padding: 2rem;
    border: 0.1rem solid $color-warning;
    border-radius: 0.4rem;
  }
  &__warningMessageTitle {
    margin: 0 0 0.6rem;
    font-weight: $font-weight-semiBold;
    font-size: 1.6rem;
    line-height: 1.3;
  }
  &__warningMessageText {
    margin: 0;
    font-weight: $font-weight-medium;
    font-size: 1.4rem;
    line-height: 1.4;
  }
}
</style>
