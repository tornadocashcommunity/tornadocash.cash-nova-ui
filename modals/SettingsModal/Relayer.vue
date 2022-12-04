<template>
  <div :class="$style.relayer">
    <div :class="$style.relayer__bodyWrapper">
      <base-select
        :tabindex="0"
        label="Relayer"
        :disabled="isSelectDisabled"
        :options="options"
        :default="selected"
        :update="update"
        @input="onSelect"
      />

      <div v-if="isCustomRelayer" :class="$style.relayer__inputWrap">
        <base-input
          type="text"
          :model-value="customRelayerUrl"
          label="Custom relayer"
          :error="!!errorMessage"
          :error-message="errorMessage"
          placeholder-text="Paste Relayer URL here"
          @update:modelValue="onInputChangeRelayerUrl"
        />
      </div>
    </div>

    <div :class="$style.relayer__actionWrapper">
      <div :class="$style.relayer__info">
        <div :class="$style.relayer__method">
          <h5 :class="$style.relayer__methodTitle">{{ methodLabel }} summary</h5>
        </div>

        <div v-if="isWithdraw" :class="$style.relayer__item">
          <span :class="$style.relayer__itemTitle">Relayer fee</span>
          <span v-if="percent" :class="$style.relayer__itemValue">{{ percent }}%</span>
          <span v-else :class="$style.relayer__itemValue">-</span>
        </div>

        <div v-if="l1FeeAmount" :class="$style.relayer__item">
          <span :class="$style.relayer__itemTitle">L1 network fee</span>
          <span v-if="l1FeeAmount" :class="$style.relayer__itemValue">{{ l1FeeAmount }} {{ chainConfig.symbol }}</span>
          <span v-else :class="$style.relayer__itemValue">-</span>
        </div>

        <div :class="$style.relayer__item">
          <span :class="$style.relayer__itemTitle">Total fee</span>
          <span v-if="fee" :class="$style.relayer__itemValue">{{ fee }} {{ chainConfig.symbol }}</span>
          <span v-else :class="$style.relayer__itemValue">-</span>
        </div>

        <div v-if="isWithdraw" :class="[$style.relayer__item, $style.relayer__item_last]">
          <span :class="$style.relayer__itemTitle">To receive</span>
          <span v-if="toReceive" :class="$style.relayer__itemValue">{{ toReceive }} {{ chainConfig.symbol }}</span>
          <span v-else :class="$style.relayer__itemValue">-</span>
        </div>

        <div :class="$style.relayer__result">
          <span :class="$style.relayer__resultTitle">{{ methodLabel }} amount</span>
          <span v-if="amounts.toSend" :class="$style.relayer__resultValue">{{ amounts.toSend }} {{ chainConfig.symbol }}</span>
          <span v-else :class="$style.feeInfo__itemValue">-</span>
        </div>
      </div>

      <base-button :loading="isActionLoading" :disabled="isActionButtonDisabled" @click="onSave">Save changes</base-button>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex'

import { AccountMutation, RelayerMutation } from '@/types'

import { relayerService } from '@/services'
import { toDecimalsPlaces, toWei, fromWei, debounce, isAmount } from '@/utilities'
import { numbers, transferMethods, errors, relayersTypes, BG_ZERO } from '@/constants'

const CUSTOM_RELAYER_LABEL = 'Custom'

export default {
  props: {
    amount: {
      type: String,
      default: '0',
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
  },
  data: function () {
    return {
      selected: '',
      update: null,
      errorMessage: '',
      customRelayerUrl: '',
      checkingRelayer: false,
      isValidRelayer: false,
      selectedRelayer: null,
    }
  },
  computed: {
    ...mapGetters('account', ['isRelayer']),
    ...mapGetters('wallet', ['chainConfig']),
    ...mapGetters('application', ['l2EthNetworkFee', 'l1Fee', 'amountsToView']),
    ...mapGetters('relayer', ['relayersList', 'customRelayer', 'currentRelayer', 'isRelayersFetching']),
    isSelectDisabled() {
      const regularRelayers = this.relayersList.filter((relayer) => relayer.type === relayersTypes.REGULAR)
      return regularRelayers.length === numbers.ZERO
    },
    isCustomEmpty() {
      return this.isCustomRelayer && !this.customRelayerUrl
    },
    isActionLoading() {
      return this.isRelayersFetching || this.checkingRelayer
    },
    isActionButtonDisabled() {
      return (
        this.isActionLoading || Boolean(this.errorMessage) || this.isCustomEmpty || !this.isValidRelayer || !this.selectedRelayer
      )
    },
    isCustomRelayer() {
      return this.selected === CUSTOM_RELAYER_LABEL
    },
    options() {
      const list = this.relayersList
        .reduce((acc, { ensName, type, serviceFee }) => {
          if (acc.includes(CUSTOM_RELAYER_LABEL)) {
            return acc
          }
          if (type === relayersTypes.CUSTOM) {
            acc.push(CUSTOM_RELAYER_LABEL)
            return acc
          }

          const postfix = this.isWithdraw ? `- ${serviceFee.withdrawal}%` : numbers.ZERO

          acc.push({ value: ensName, label: postfix })
          return acc
        }, [])
        .sort((el) => Boolean(el.label))

      if (!this.customRelayer && !list.includes(CUSTOM_RELAYER_LABEL)) {
        list.push(CUSTOM_RELAYER_LABEL)
      }
      return list
    },
    isWithdraw() {
      return this.method === 'withdraw'
    },
    methodLabel() {
      const labels = {
        withdraw: 'Withdrawal',
        transfer: 'Transfer',
      }
      return labels[this.method]
    },
    percent() {
      return this.isWithdraw && this.selectedRelayer?.serviceFee?.withdrawal
    },

    operationFee() {
      if (!this.selectedRelayer || !isAmount(this.amount)) {
        return BG_ZERO
      }
      const amountInWei = toWei(this.amount)
      const params = {
        method: this.method,
        amount: amountInWei,
        serviceFee: this.selectedRelayer.serviceFee,
        networkFee: this.l2EthNetworkFee(this.method),
      }

      if (this.isWithdraw) {
        params.amount = amountInWei.add(this.l1Fee)
        return relayerService.getOperationFee(params).add(this.l1Fee)
      }
      return relayerService.getOperationFee(params)
    },

    amounts() {
      return this.amountsToView({
        amount: this.amount,
        method: this.method,
        isRelayer: this.isRelayer,
        withRelayer: true,
        isCustom: this.isCustom,
      })
    },
    toReceive() {
      if (!this.isWithdraw) {
        return null
      }
      return this.amounts.toReceive
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

    fee() {
      if (!this.amount) {
        return
      }

      return toDecimalsPlaces(fromWei(this.operationFee), numbers.FEE_PRECISION)
    },
  },
  watch: {
    isRelayersFetching(newValue) {
      if (!newValue) {
        this.setSelected()
      }
    },
  },
  created() {
    this.setSelected()
  },
  methods: {
    ...mapActions('relayer', ['getRelayer']),
    ...mapMutations('account', [AccountMutation.SET_TRANSFER_METHOD]),
    ...mapMutations('relayer', [RelayerMutation.SET_ACTIVE_RELAYER, RelayerMutation.EDIT_RELAYERS_LIST]),
    setSelected() {
      if (this.currentRelayer) {
        this.selected = this.currentRelayer.type === relayersTypes.REGULAR ? this.currentRelayer?.ensName : CUSTOM_RELAYER_LABEL
        this.update = this.selected
        this.onSelect(this.selected)
      }

      if (this.customRelayer) {
        this.customRelayerUrl = this.customRelayer.url
      }
    },
    onSelect(value) {
      this.selected = value

      const selectedRelayer = this.relayersList.find(({ ensName, url, type }) => {
        return ensName === value || url === value || type === value.toLowerCase()
      })

      if (selectedRelayer) {
        this.checkRelayerDebouncer(selectedRelayer.url, selectedRelayer.ensName)

        if (this.customRelayer) {
          this.customRelayerUrl = selectedRelayer.url
          this.selectedRelayer = selectedRelayer
        } else {
          this.customRelayerUrl = ''
        }
      }
    },
    onInputChangeRelayerUrl(url) {
      const isEns = url.indexOf('.eth')

      if (isEns > numbers.ZERO) {
        this.checkRelayerDebouncer(undefined, url)
      } else {
        this.checkRelayerDebouncer(url)
      }

      this.customRelayerUrl = url
    },
    checkRelayerDebouncer: debounce(async function (url, ensName = '') {
      try {
        this.errorMessage = ''
        this.checkingRelayer = true
        this.isValidRelayer = false
        this.selectedRelayer = null

        const trimmedUrl = url ? url.toLowerCase().trim() : ''
        const relayer = await this.getRelayer({ url: trimmedUrl, ensName })

        this.isValidRelayer = Boolean(relayer)

        if (!this.isValidRelayer) {
          throw new Error('invalid relayer')
        }

        this.selectedRelayer = { ...relayer, type: this.isCustomRelayer ? relayersTypes.CUSTOM : relayersTypes.REGULAR }
      } catch {
        this.errorMessage = errors.validation.INVALID_RELAYER
      } finally {
        setTimeout(() => {
          this.checkingRelayer = false
        }, numbers.LOADER_DELAY)
      }
    }, numbers.CHECK_URL_DELAY),
    onSave() {
      try {
        if (this.isCustomRelayer) {
          this[RelayerMutation.EDIT_RELAYERS_LIST]({ ...this.selectedRelayer, type: relayersTypes.CUSTOM })
        }

        const activeRelayer = this.isCustomRelayer
          ? this.selectedRelayer
          : this.relayersList.find(({ ensName, url }) => ensName === this.selected || url === this.selected)

        this[AccountMutation.SET_TRANSFER_METHOD](transferMethods.RELAYER)
        this[RelayerMutation.SET_ACTIVE_RELAYER](activeRelayer)

        this.onClose()
      } catch (err) {
        this.errorMessage = 'err'
      }
    },
  },
}
</script>

<style lang="scss" module>
.relayer {
  width: 100%;
  display: flex;
  position: relative;
  align-items: center;
  flex-direction: column;
  &__bodyWrapper {
    padding: 2.4rem 2rem 4rem;
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
}
</style>
