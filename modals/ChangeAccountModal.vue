<template>
  <div :class="$style.changeAccount">
    <div :class="$style.changeAccount__info">
      <h2 :class="$style.changeAccount__title">
        You changed the <span>{{ walletName }}</span> account
      </h2>

      <p v-if="isNotRegisteredInPool" :class="$style.changeAccount__subtitle">
        <!--eslint-disable-next-line-->
        Your current TornadoCash Nova session is associated with the previously linked Web3 account
        (<strong>{{ prevAddress }}</strong>). If you would like to switch to the newly detected Web3 account
        (<strong>{{ newAddress }}</strong>) for your TornadoCash Nova session, please proceed by clicking the
        <strong>Switch</strong> button.
      </p>
      <p v-else :class="$style.changeAccount__subtitle">
        If you switch to the <strong>{{ newAddress }}</strong> it will be a completely separate TornadoCash Nova account.
        <br />
        Proceeding with an active TornadoCash Nova account <strong>{{ prevAddress }}</strong> will allow you to fund it using
        <strong>{{ newAddress }}</strong> or transfer/withdraw ETH using the wallet.
      </p>
    </div>

    <div :class="$style.changeAccount__buttons">
      <base-button full-width :disabled="isLoading" @click="onSwitchAccount">Switch</base-button>

      <base-button v-if="!isNotRegisteredInPool" type="primary" full-width :disabled="isLoading" @click="continueWithActive">
        Continue with active
      </base-button>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

import { privateStorage } from '@/services'
import { shortenAddress } from '@/utilities'

export default {
  name: 'ChangeAccountModal',
  props: {
    modalName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
  },
  data: function () {
    return {
      isActionLoading: false,
    }
  },
  computed: {
    ...mapGetters('wallet', ['nameProvider']),
    ...mapGetters('account', ['accountAddress', 'isNotRegisteredInPool']),
    newAddress() {
      return shortenAddress(this.address)
    },
    prevAddress() {
      return shortenAddress(this.accountAddress)
    },
    isLoading() {
      return this.isActionLoading
    },
    walletName() {
      return this.nameProvider ? this.nameProvider.toLowerCase() : ''
    },
  },
  methods: {
    ...mapActions('wallet', ['setWalletParams']),
    ...mapActions('application', ['errorHandler']),
    ...mapActions('account', ['setAccountParams']),
    async actionHandler(callBack) {
      try {
        this.isActionLoading = true

        await callBack()

        this.$modal.hide(this.modalName)
      } catch (err) {
        await this.errorHandler({
          title: 'Switch wallet error',
          errorMessage: err.message,
        })
        console.error('Switch wallet error:', err.message)
      } finally {
        this.isActionLoading = false
      }
    },
    onSwitchAccount() {
      this.actionHandler(async () => {
        privateStorage.clear()
        await this.setWalletParams(this.address)
        await this.setAccountParams(this.address)
      })
    },
    continueWithActive() {
      this.actionHandler(async () => {
        await this.setWalletParams(this.address)
      })
    },
    onDecline() {
      this.$modal.hide(this.modalName)
    },
  },
}
</script>

<style lang="scss" module>
@include animation-full-rotate;

.changeAccount {
  margin: 0;
  &__info {
    margin: 0 auto 2.4rem;
    padding: 2.4rem 0;
    display: flex;
    flex-direction: column;
    border-bottom: 0.1rem solid $color-dark;
    box-shadow: 0 0.1rem $color-dark-light;
    @include media('sm') {
      padding: 4.2rem auto 2.4rem;
    }
  }
  &__title {
    margin: 0 0 1.6rem;
    padding: 0 1.6rem;
    font-weight: $font-weight-semiBold;
    font-size: 2rem;
    line-height: 1.2;
    color: $color-white;
    @include media('sm') {
      margin: 0 0 3.2rem;
      padding: 0 2rem;
      font-size: 2rem;
    }

    span {
      text-transform: capitalize;
    }
  }
  &__loading {
    margin: 0 1.6rem;
    padding: 1.2rem 1.6rem;
    min-height: 6rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 0.1rem solid $color-grey;
    border-radius: 0.6rem;
    @include media('sm') {
      padding: 0 2rem;
    }
  }
  &__loadingLoader {
    margin: 0;
    width: 2rem;
    height: 2rem;
    display: inline-block;
    border-style: solid;
    border-width: 0.2rem;
    border-color: $color-primary $color-transparent $color-primary $color-transparent;
    border-radius: 50%;
    animation: animation-full-rotate $duration-animation-1200ms linear infinite;
  }
  &__loadingTitle {
    margin: 0;
    font-weight: $font-weight-medium;
    font-size: 1.6rem;
    line-height: 1.44;
    color: $color-white;
  }
  &__subtitle {
    margin: 0;
    padding: 0 1.6rem;
    min-height: 6rem;
    font-weight: $font-weight-medium;
    font-size: 1.4rem;
    line-height: 1.5;
    color: $color-white;
    @include media('sm') {
      padding: 0 2rem;
    }
  }
  &__buttons {
    margin: 0;
    padding: 0 1.6rem 2.4rem;
    display: grid;
    gap: 1.6rem;
    @include media('sm') {
      padding: 0 2rem 2.4rem;
    }
  }
}
</style>
