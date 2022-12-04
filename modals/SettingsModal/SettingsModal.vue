<template>
  <div :class="$style.settingsModal">
    <h2 :class="$style.settingsModal__title">Settings</h2>
    <p :class="$style.settingsModal__text">Choose your preferred {{ type }} method</p>

    <base-switcher :tabs="tabs" :active-tab="activeTab">
      <relayer slot="relayer" :is-custom="isCustom" :method="method" :amount="amount" :on-close="onClose" />
      <wallet
        slot="wallet"
        :is-custom="isCustom"
        :method="method"
        :amount="amount"
        :setup-provider="setupProvider"
        :on-close="onClose"
      />
    </base-switcher>

    <button :class="$style.buttonClose" @click="onClose">
      <base-icon name="cross" size="fill" />
    </button>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'

import Wallet from './Wallet.vue'
import Relayer from './Relayer.vue'

export default {
  name: 'SettingsModal',
  components: {
    Wallet,
    Relayer,
  },
  props: {
    modalName: {
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
    amountGetter: {
      type: Function,
      required: true,
    },
    setupProvider: {
      type: Function,
      required: true,
    },
  },
  data: function () {
    return {
      tabs: [{ name: 'relayer' }, { name: 'wallet' }],
      amount: '0',
    }
  },
  computed: {
    ...mapGetters('account', ['isRelayer']),
    ...mapGetters('application', ['l1Fee']),
    activeTab() {
      return this.isRelayer ? 'relayer' : 'wallet'
    },
    type() {
      const types = {
        transfer: 'transfer',
        withdraw: 'withdrawal',
      }

      return types[this.$route.name]
    },
  },
  watch: {
    l1Fee() {
      this.amount = this.amountGetter()
    },
  },
  created() {
    this.amount = this.amountGetter()
  },
  methods: {
    onClose() {
      this.$modal.hide(this.modalName)
    },
  },
}
</script>

<style lang="scss" module>
.settingsModal {
  margin: 0 auto;
  padding: 2.4rem 0;
  display: flex;
  flex-direction: column;
  @include media('sm') {
    padding: 4.2rem 0 2.4rem;
  }
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
    padding: 0 1.6rem;
    font-weight: $font-weight-medium;
    font-size: 1.4rem;
    line-height: 1.2;
    color: $color-white;
    @include media('sm') {
      margin: 0 0 2.4rem;
      padding: 0 2rem;
    }
  }
}

.buttonClose {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.2rem;
  display: flex;
  width: 2.8rem;
  height: 2.8rem;
  color: $color-grey;
  background-color: $color-transparent;
  border: none;
  border-radius: 0.6rem;
  transition: color $duration-animation-02s ease-in, background-color $duration-animation-02s ease-in;
  cursor: pointer;
  &:hover:not([disabled]),
  &:focus-within:not([disabled]),
  &:active:not([disabled]) {
    color: $color-white;
  }
  @include media('md') {
    top: 1.4rem;
    right: 1.4rem;
  }
}
</style>
