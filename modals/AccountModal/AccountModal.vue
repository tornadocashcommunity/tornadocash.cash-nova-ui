<template>
  <div :class="$style.accountModal">
    <h2 :class="$style.accountModal__title">Account data</h2>
    <p :class="$style.accountModal__text">You can check your account details and transactions details here.</p>
    <base-switcher :tabs="tabs">
      <div slot="profile" :class="$style.accountModal__content">
        <div :class="$style.accountModal__bodyWrapper">
          <template v-if="isConnected">
            <div :class="$style.accountModal__info">
              <h5 :class="$style.accountModal__infoTitle">Wallet address</h5>
              <span :class="$style.accountModal__infoValue">
                <base-button type="link" size="medium" free-size @click="onWalletAddressCopy">
                  {{ walletAddress }}
                  <base-icon :name="copyAddressIcon" size="small" :class="$style.accountModal__copyButton" />
                </base-button>
              </span>
            </div>
            <div :class="$style.accountModal__info">
              <h5 :class="$style.accountModal__infoTitle">Wallet balance</h5>
              <span v-if="!mismatchNetwork && walletChainConfig" :class="$style.accountModal__infoValue">
                {{ formattedWalletBalance }} {{ walletChainConfig.symbol }}
              </span>
              <span v-else :class="$style.accountModal__infoValue"> - </span>
            </div>
          </template>
          <div :class="$style.accountModal__info">
            <h5 :class="$style.accountModal__infoTitle">Shielded address</h5>
            <span :class="$style.accountModal__infoValue">
              <base-button type="link" size="medium" free-size @click="onAccountAddressCopy">
                {{ accountAddress }}
                <base-icon :name="copySignAddressIcon" size="small" :class="$style.accountModal__copyButton" />
              </base-button>
            </span>
          </div>
          <div :class="$style.accountModal__info">
            <h5 :class="$style.accountModal__infoTitle">Shielded balance</h5>
            <span :class="$style.accountModal__infoValue">{{ formattedAccountBalance }} {{ chainConfig.symbol }}</span>
          </div>
        </div>

        <div :class="$style.accountModal__actionWrapper">
          <div :class="$style.accountModal__warningMessage">
            <p :class="$style.accountModal__warningMessageText">
              You can save the shielded key to your secured device in order to use the transfer or withdrawal function later by
              logging in with the shielded key in another browser.
            </p>
          </div>

          <div :class="$style.accountModal__action">
            <h5 :class="$style.accountModal__actionTitle">Shielded key</h5>
            <span :class="$style.accountModal__actionButtons">
              <base-button type="primary" size="medium" @click="onKeyDownload">Download</base-button>
              <base-button type="link" size="medium" free-size @click="onKeyCopy">
                Copy
                <base-icon v-if="showKeyIcon" name="tick" size="small" :class="$style.accountModal__copyButton" />
              </base-button>
            </span>
          </div>
        </div>
      </div>

      <div slot="transactions" :class="$style.accountModal__content">
        <div :class="[$style.accountModal__bodyWrapper, $style.accountModal__bodyWrapper_noBorder]">
          <TransactionHistory />
        </div>
      </div>
    </base-switcher>

    <button :class="$style.buttonClose" @click="$modal.hide('AccountModal')">
      <base-icon name="cross" size="fill" />
    </button>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

import { CHAINS, numbers } from '@/constants'
import { copyToClipboard, fromWei, saveAsFile } from '@/utilities'

import TransactionHistory from './TransactionHistory.vue'

export default {
  name: 'AccountModal',
  components: {
    TransactionHistory,
  },
  props: {
    modalName: {
      type: String,
      required: true,
    },
  },
  data: function () {
    return {
      privateKey: '',
      showKeyIcon: false,
      copyAddressIcon: 'copy',
      copySignAddressIcon: 'copy',
      tabs: [{ name: 'profile' }, { name: 'transactions', tooltip: 'Transaction history' }],
    }
  },
  computed: {
    ...mapGetters('wallet', ['walletAddress', 'walletBalance', 'chainId', 'chainConfig', 'isConnected', 'mismatchNetwork']),
    ...mapGetters('account', ['accountAddress', 'accountBalance']),
    walletChainConfig() {
      return CHAINS[this.chainId]
    },
    formattedWalletBalance() {
      return fromWei(this.walletBalance)
    },

    formattedAccountBalance() {
      return fromWei(this.accountBalance)
    },
  },
  async mounted() {
    const keyPair = await this.getAccountKeypair()
    if (keyPair) {
      this.privateKey = keyPair.privkey
    }
  },
  methods: {
    ...mapActions('account', ['getAccountKeypair']),
    onWalletAddressCopy() {
      copyToClipboard(this.walletAddress)
      this.onIconChange('copyAddressIcon')
    },
    onAccountAddressCopy() {
      copyToClipboard(this.accountAddress)
      this.onIconChange('copySignAddressIcon')
    },
    onIconChange(iconName) {
      this[iconName] = 'tick'
      setTimeout(() => {
        this[iconName] = 'copy'
      }, numbers.SECOND * numbers.TWO)
    },
    onKeyDownload() {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      saveAsFile(`Shielded private key \n${this.privateKey}`, `TornadoCash-Nova-key-${this.accountAddress.slice(0, 8)}`)
    },
    onKeyCopy() {
      copyToClipboard(this.privateKey)
      this.showKeyIcon = true
      setTimeout(() => {
        this.showKeyIcon = false
      }, numbers.SECOND * numbers.TWO)
    },
  },
}
</script>

<style lang="scss" module scoped>
@include animation-full-rotate;

.accountModal {
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
    margin: 0 0 3rem;
    padding: 0 1.6rem;
    font-weight: $font-weight-medium;
    font-size: 1.4rem;
    line-height: 1.2;
    color: $color-white;
    @include media('sm') {
      margin: 0 0 4rem;
      padding: 0 2rem;
    }
  }
  &__content {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  &__bodyWrapper {
    padding: 2.4rem 2rem 4rem;
    width: 100%;
    border-bottom: 0.1rem solid $color-dark;
    box-shadow: 0 0.1rem $color-dark-light;
    &_noBorder {
      padding: 2.4rem 2rem 0;
      display: grid;
      border-bottom: none;
      box-shadow: none;
      overflow-x: auto;
      overflow-y: hidden;
    }
  }
  &__info {
    margin: 0 0 2.6rem;
    display: flex;
    flex-direction: column;
    row-gap: 1rem;
    width: 100%;
    &:last-child {
      margin: 0;
    }
    @include media('sm') {
      display: grid;
      grid-template-columns: 30% 1fr;
      row-gap: 0;
      align-items: center;
    }
  }
  &__infoTitle {
    margin: 0;
    font-weight: $font-weight-semiBold;
    font-size: 1.6rem;
    line-height: 1.3;
    color: $color-white;
  }
  &__infoValue {
    margin: 0;
    font-weight: $font-weight-medium;
    font-size: 1.6rem;
    line-height: 1.3;
    color: $color-white;
  }
  &__copyButton {
    margin: 0 0 0 0.8rem;
  }
  &__warningMessage {
    margin: 0;
    padding-bottom: 2.4rem;
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
  &__actionWrapper {
    width: 100%;
    padding: 2.4rem 2rem 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  &__action {
    margin: 0 0 4rem;
    display: flex;
    flex-direction: column;
    row-gap: 2rem;
    width: 100%;
    &:last-child {
      margin: 0;
    }
    @include media('sm') {
      display: grid;
      grid-template-columns: 30% 1fr;
      row-gap: 0;
      align-items: center;
    }
  }
  &__actionTitle {
    margin: 0;
    font-weight: $font-weight-semiBold;
    font-size: 1.6rem;
    line-height: 1.3;
    color: $color-white;
  }
  &__actionButtons {
    display: flex;
    column-gap: 4rem;
    align-items: center;
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
