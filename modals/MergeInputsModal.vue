<template>
  <div :class="$style.confirm">
    <h3 :class="$style.confirm__title">Insufficient spendable balance</h3>
    <p :class="$style.confirm__text">Please make a merge transaction to increase your spendable balance.</p>

    <div :class="$style.confirm__links">
      <div :class="$style.confirm__linksItem">
        <span :class="$style.confirm__linksItemTitle">
          Current spendable balance: <strong>{{ formatCurrentAmount }} ETH</strong>
        </span>
      </div>

      <div :class="$style.confirm__linksItem">
        <span :class="$style.confirm__linksItemTitle">
          Available balance after merge: <strong>{{ formatAvailableAmount }} ETH</strong>
        </span>
      </div>
    </div>
    <div :class="$style.connect__login">
      <base-button full-width :loading="isLoading" @click="mergeInputs">Merge</base-button>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

import { toDecimalsPlaces } from '@/utilities'

export default {
  name: 'MergeInputsModal',
  props: {
    modalName: {
      type: String,
      required: true,
    },
    availableAmount: {
      type: String,
      required: true,
    },
    currentAmount: {
      type: String,
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
    formatAvailableAmount() {
      return toDecimalsPlaces(this.availableAmount)
    },
    formatCurrentAmount() {
      return toDecimalsPlaces(this.currentAmount)
    },
  },
  created() {
    this.$modal.hide('ConfirmationModal')
  },
  methods: {
    ...mapActions('application', ['errorHandler']),
    ...mapActions('account', {
      mergeInputsWallet: 'mergeInputs',
    }),
    ...mapActions('relayer', {
      mergeInputsRelayer: 'mergeInputs',
    }),
    async mergeInputs() {
      try {
        this.isLoading = true
        if (this.isRelayer) {
          await this.mergeInputsRelayer()
        } else {
          await this.mergeInputsWallet()
        }
        this.onClose()
      } catch (err) {
        this.errorHandler({ errorMessage: err.message, title: `Merge inputs` })
      } finally {
        this.isLoading = false
      }
    },
    onClose() {
      this.$modal.hide(this.modalName)
    },
  },
}
</script>

<style lang="scss" module>
.confirm {
  margin: 0 auto;
  padding: 2.4rem 0;
  display: flex;
  flex-direction: column;
  &__title {
    margin: 1rem;
    padding: 0 1.6rem;
    font-weight: $font-weight-semiBold;
    font-size: 1.8rem;
    line-height: 1.44;
    color: $color-white;
    text-align: center;
    @include media('sm') {
      padding: 0 2rem;
    }
  }
  &__text {
    margin: 0 0 2rem;
    padding: 0 2rem 2rem;
    font-weight: $font-weight-regular;
    font-size: 1.6rem;
    line-height: 1.5;
    color: $color-white-08;
    text-align: center;
    border-bottom: 0.1rem solid $color-dark;
    box-shadow: 0 0.1rem $color-dark-light;
  }
  &__links {
    padding: 0 2rem 2rem;
    margin: 0 0 2rem;
    border-bottom: 0.1rem solid $color-dark;
    box-shadow: 0 0.1rem $color-dark-light;
  }
  &__linksItem {
    margin: 0 0 0.8rem;
    display: flex;
    text-align: center;
    justify-content: center;
    align-items: center;
    &:last-child {
      margin: 0;
    }
  }
  &__linksItemTitle {
    font-size: 1.4rem;
    line-height: 1.2;
  }
}

.connect {
  margin: 0 auto;
  padding: 2.4rem 0;
  display: flex;
  flex-direction: column;
  @include media('sm') {
    padding: 4.2rem 0 2.4rem;
  }
  &__login {
    margin: 0;
    padding: 0 1.6rem;
    display: grid;
    gap: 1.6rem;
    @include media('sm') {
      padding: 0 2rem;
    }
  }
}
</style>
