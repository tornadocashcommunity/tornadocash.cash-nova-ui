<template>
  <div :class="$style.connect">
    <h2 :class="$style.connect__title">Connect to application</h2>

    <chooser
      v-if="!processedWallet && !isPrivateKeyChoose"
      :set-processed-wallet="setProcessedWallet"
      :open-private-key-block="openPrivateKeyBlock"
    />

    <metamask
      v-if="processedWallet && !isPrivateKeyChoose"
      :processed-wallet="processedWallet"
      :set-processed-wallet="setProcessedWallet"
    />

    <private-key v-if="isPrivateKeyChoose" :close-private-key-block="closePrivateKeyBlock" />

    <button :class="$style.buttonClose" @click="$modal.hide('ConnectModal')">
      <base-icon name="cross" size="fill" />
    </button>
  </div>
</template>
<script>
import Chooser from './Chooser'
import Metamask from './Metamask'
import PrivateKey from './PrivateKey'

export default {
  name: 'ConnectModal',
  components: { PrivateKey, Metamask, Chooser },
  provide() {
    return {
      modalName: this.modalName,
      setupProvider: this.setupProvider,
    }
  },
  props: {
    modalName: {
      type: String,
      required: true,
    },
    setupProvider: {
      type: Function,
      required: true,
    },
  },
  data: function () {
    return {
      processedWallet: null,
      isPrivateKeyChoose: false,
    }
  },
  methods: {
    setProcessedWallet(wallet) {
      this.processedWallet = wallet
    },
    openPrivateKeyBlock() {
      this.isPrivateKeyChoose = true
    },
    closePrivateKeyBlock() {
      this.isPrivateKeyChoose = false
    },
  },
}
</script>

<style lang="scss" module>
@include animation-full-rotate;

.connect {
  margin: 0 auto;
  padding: 2.4rem 0;
  display: flex;
  flex-direction: column;
  @include media('sm') {
    padding: 4.2rem 0 2.4rem;
  }
  &__title {
    margin: 0 0 1.6rem;
    padding: 0 1.6rem;
    font-weight: $font-weight-bold;
    font-size: 2rem;
    line-height: 1;
    color: $color-white;
    @include media('sm') {
      margin: 0 0 3.2rem;
      padding: 0 2rem;
      font-size: 2.4rem;
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
