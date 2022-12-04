<template>
  <header :class="$style.header">
    <div :class="$style.header__container">
      <notify />

      <nuxt-link to="/" class="logoAnimation" :class="$style.logoLink" aria-label="Home">
        <span role="none" :class="$style.logoText">Tornado.Cash Nova</span>
        <base-icon name="tornado" size="auto" />
        <base-icon name="logonova" size="auto" />
      </nuxt-link>

      <div :class="$style.header__features">
        <connection />
      </div>
    </div>
    <base-snackbar
      v-if="isEthLink && shouldShowEthLinkAlert"
      :is-open="shouldShowEthLinkAlert"
      icon="warning"
      :on-close="handleEthLinkNotifyClose"
    >
      Due to the
      <a :class="$style.link__text" href="https://discuss.ens.domains/t/eth-link-expiry/13899" target="_blank" rel="noreferrer"
        >issue</a
      >
      with eth.link domain, we highly recommend avoiding using this gateway. Consider
      <a :class="$style.link__text" :href="TORNADO_CASH_LANDING">alternative</a> gateways.
    </base-snackbar>
    <base-snackbar v-else :is-open="shouldShowRiskAlert" icon="warning" :on-close="handleNotifyClose">
      Tornado.cash Nova is an experimental version of
      <a :class="$style.link__text" :href="TORNADO_CASH_LANDING" target="_blank" rel="noreferrer">Tornado.cash</a>. Please use it
      at your own risk.
    </base-snackbar>
  </header>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

import { CHAINS, TORNADO_CASH_LANDING } from '@/constants'
import { AccountMutation } from '@/types'

import { Notify } from '../Notify'
import { Connection } from './components'

export default {
  components: {
    Notify,
    Connection,
  },
  data: function () {
    return {
      TORNADO_CASH_LANDING,
    }
  },
  computed: {
    ...mapGetters('wallet', ['chainId']),
    ...mapGetters('account', ['shouldShowRiskAlert', 'shouldShowEthLinkAlert']),
    chainName() {
      return CHAINS[this.chainId].network
    },
    isEthLink() {
      return window.location.host === 'localhost:3000'
    },
  },
  methods: {
    ...mapMutations('account', [AccountMutation.SET_SHOULD_SHOW_RISK_ALERT, AccountMutation.SET_SHOULD_SHOW_ETH_LINK_ALERT]),
    handleNotifyClose() {
      this[AccountMutation.SET_SHOULD_SHOW_RISK_ALERT](false)
    },
    handleEthLinkNotifyClose() {
      this[AccountMutation.SET_SHOULD_SHOW_ETH_LINK_ALERT](false)
    },
  },
}
</script>

<style lang="scss" module>
.header {
  width: 100%;
  flex-shrink: 0;
  position: relative;
  background-color: $color-transparent;
  &__container {
    position: relative;
    margin: 0 auto 2rem;
    padding: 1.4rem 2rem;
    max-width: 136rem;
    display: flex;
    justify-content: center;
    align-items: center;
    @include media('md') {
      padding: 1.4rem 1.8rem;
      justify-content: space-between;
    }
    @include media('xl') {
      padding: 2.4rem 0;
    }
    @include media('xxl') {
      padding: 1.8rem 3.4rem;
    }
  }
  &__features {
    position: fixed;
    bottom: 0;
    left: 0;
    margin: 0;
    padding: 1.2rem 1.6rem;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: $color-bg;
    border: 0.1rem solid $color-bg-primary;
    border-bottom: none;
    border-radius: 1.2rem 1.2rem 0 0;
    z-index: $zIndex-5;
    @include media('md') {
      position: static;
      padding: 0;
      width: auto;
      background-color: $color-transparent;
      border: none;
      border-radius: 0;
      z-index: $zIndex-1;
    }
  }
}

.logoLink {
  width: 18.2rem;
  color: $color-white;
  cursor: pointer;
}

.logoText {
  display: none;
}

.warning {
  height: auto;
  min-height: 4.5rem;
  &__message {
    padding: 1.6rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background-color: $color-danger;
    @include media('sm') {
      padding: 0.6rem 1.6rem;
      flex-direction: row;
    }
  }
  &__text {
    margin: 0 0 1rem;
    font-weight: $font-weight-bold;
    font-size: 1.6rem;
    line-height: 1.33;
    @include media('sm') {
      margin: 0 2rem 0 0;
    }
  }
}

.link {
  margin: 0;
  &__text {
    color: white;
    text-decoration: underline;
  }
}
</style>

<style lang="scss"></style>
