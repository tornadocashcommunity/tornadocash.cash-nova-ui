<template>
  <ProviderContainer>
    <HeaderContainer />

    <main :class="$style.main">
      <Nuxt />
    </main>

    <FooterContainer />
  </ProviderContainer>
</template>

<script>
import { mapActions } from 'vuex'

import { numbers } from '@/constants'
import { ProviderContainer, HeaderContainer, FooterContainer } from '@/containers'

import 'sanitize.css'

export default {
  components: {
    FooterContainer,
    HeaderContainer,
    ProviderContainer,
  },
  created() {
    try {
      this.checkSession()
    } catch (err) {
      console.warn('Check session error')
    }
  },
  mounted() {
    this.$preventMultitabs()
    this.getContractConstants()
    this.setupWorker()
    this.checkProcessing()

    // the app should fetch all data
    // ToDo fix it
    setTimeout(() => {
      this.accountBalanceWatcher()
    }, numbers.START_BALANCE_WATCHER_DEBOUNCE)
  },
  methods: {
    ...mapActions('application', ['setupWorker', 'checkProcessing', 'getContractConstants']),
    ...mapActions('account', ['accountBalanceWatcher', 'checkSession']),
  },
}
</script>

<style lang="scss">
html,
body,
#root {
  font-family: $font-family-main;
}
html {
  box-sizing: border-box;
  height: auto;
  font-size: 62.5%;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  font-size: 1.6rem;
  line-height: 1.5;
  color: $color-white;
  background-color: $color-bg;
  background-image: $color-gradient-black;
  background-repeat: no-repeat;
}
#__layout {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
b {
  font-weight: $font-weight-bold;
}
small {
  font-size: 1.4rem;
}
a {
  text-decoration: none;
  transition: all $duration-animation-02s ease-in;
  -webkit-text-decoration-skip: objects;
}
*,
*::before,
*::after {
  box-sizing: inherit;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-font-feature-settings: 'kern', 'liga', 'clig', 'calt';
  -ms-font-feature-settings: 'kern', 'liga', 'clig', 'calt';
  -webkit-font-feature-settings: 'kern', 'liga', 'clig', 'calt';
  font-feature-settings: 'kern', 'liga', 'clig', 'calt';
  text-rendering: optimizeLegibility;
}
img {
  border-style: none;
}
video {
  width: 100%;
}
</style>

<style lang="scss">
@include animation-full-rotate-negative;
@include animation-from-invisible;
@include animation-transform-line;

.logoAnimation {
  display: inline-grid;
  grid-template-columns: 4.6rem 1fr;
  gap: 0 1.2rem;
  &:hover,
  &:focus {
    .logoShuriken {
      animation: animation-full-rotate-negative $duration-animation-1s ease-in-out;
      transform-origin: center;
    }
    .logoLine {
      animation: animation-from-invisible $duration-animation-2000ms ease-in-out;
    }
    .logoStar {
      animation: animation-transform-line $duration-animation-06s ease-in-out;
    }
  }
}
</style>

<style lang="scss" module>
.main {
  margin: 0 auto;
  padding: 1rem 0 3rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  flex: 1 0 auto;
  width: 100%;
  @include media('xxl') {
    max-width: 325.4rem;
  }
}
</style>
