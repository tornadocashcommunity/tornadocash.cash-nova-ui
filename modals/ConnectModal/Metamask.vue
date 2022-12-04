<template>
  <div :class="$style.metamask">
    <div :class="$style.metamask__wrapStatus">
      <div :class="[$style.metamask__status, { [$style.error]: isError }]">
        <div v-show="isLoading" :class="$style.metamask__loading">
          <span :class="$style.metamask__loadingTitle">Connecting...</span>
          <base-icon name="loader" size="large" />
        </div>
        <div v-show="isError" :class="$style.metamask__error">
          <h4 :class="$style.metamask__errorTitle">Connection error</h4>
          <base-button type="primary" size="small" @click="initWallet(processedWallet)">Try again</base-button>
        </div>
      </div>
    </div>

    <div :class="$style.metamask__back">
      <base-button :disabled="isLoading" type="primary" full-width @click="resetProcessedWallet">Back</base-button>
    </div>
  </div>
</template>

<script>
export default {
  inject: ['setupProvider', 'modalName'],
  props: {
    processedWallet: {
      type: String,
      required: true,
    },
    setProcessedWallet: {
      type: Function,
      required: true,
    },
  },
  data: function () {
    return {
      isLoading: false,
      isError: false,
    }
  },
  mounted() {
    this.initWallet(this.processedWallet)
  },
  methods: {
    async initWallet(wallet) {
      try {
        this.isError = false

        this.isLoading = true
        this.setProcessedWallet(wallet)

        await this.setupProvider(wallet)
        this.$modal.hide(this.modalName)
      } catch (err) {
        this.isError = true
      } finally {
        this.isLoading = false
      }
    },
    resetProcessedWallet() {
      this.setProcessedWallet(null)
    },
  },
}
</script>

<style lang="scss" module>
@include animation-full-rotate;

.metamask {
  &__wrapStatus {
    margin: 0 0 2.4rem;
    padding: 0 0 3.6rem;
    border-bottom: 0.1rem solid $color-dark;
    box-shadow: 0 0.1rem $color-dark-light;
    @include media('sm') {
      padding: 0 0 7rem;
    }
  }
  &__status {
    margin: 0 1.6rem;
    padding: 1.2rem 1.6rem;
    min-height: 6.2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border: 0.1rem solid $color-grey;
    border-radius: 0.6rem;
    @include media('sm') {
      margin: 0 2rem;
    }
  }
  &__loading {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__loadingTitle {
    margin: 0;
    font-weight: $font-weight-medium;
    font-size: 1.6rem;
    line-height: 1.44;
    color: $color-white;
  }
  &__error {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &__errorTitle {
    margin: 0;
    font-weight: $font-weight-medium;
    font-size: 1.6rem;
    line-height: 1.44;
    color: $color-danger;
  }
  &__back {
    padding: 0 1.6rem;
    @include media('sm') {
      padding: 0 2rem;
    }
  }
}

.error {
  border-color: $color-danger;
}
</style>
