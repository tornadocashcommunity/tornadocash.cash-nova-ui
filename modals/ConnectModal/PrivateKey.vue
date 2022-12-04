<template>
  <div>
    <div :class="$style.wrapLogin">
      <base-input
        type="text"
        :error="isError"
        label="Shielded key"
        :error-message="errorMessage"
        :model-value="privateKey"
        placeholder-text="Paste your key here"
        @update:modelValue="onInputChangeKey"
      />
    </div>
    <div :class="$style.login">
      <base-button :loading="isLoading" full-width @click="connect">Log in</base-button>
      <base-button :disabled="isLoading" type="primary" full-width @click="closePrivateKeyBlock">Back</base-button>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

import { errors, SESSION_STORAGE_KEY } from '@/constants'
import { privateStorage } from '@/services'

export default {
  inject: ['modalName'],
  props: {
    closePrivateKeyBlock: {
      type: Function,
      required: true,
    },
  },
  data: function () {
    return {
      isError: false,
      privateKey: '',
      errorMessage: '',
      isLoading: false,
    }
  },
  computed: {
    ...mapGetters('account', ['accountAddress', 'isRegisteredInPool']),
  },
  methods: {
    ...mapActions('account', ['checkSession', 'setBackupedAddressFromPublicKey']),
    async connect() {
      // TODO: validate
      try {
        this.isError = false
        this.errorMessage = ''

        this.isLoading = true
        await this.setBackupedAddressFromPublicKey({ privateKey: this.privateKey })

        privateStorage.set(`tornado_key`, this.privateKey)

        await this.checkSession()
        if (this.isRegisteredInPool) {
          this.$modal.hide(this.modalName)
        } else {
          let errorText = errors.validation.INVALID_PRIVATE_KEY
          if (!this.accountAddress) {
            errorText = errors.validation.ACCOUNT_NOT_FOUND
          }
          throw new Error(errorText)
        }
      } catch (err) {
        this.isError = true
        this.errorMessage = err.message
        privateStorage.remove(SESSION_STORAGE_KEY)
      } finally {
        this.isLoading = false
      }
    },
    onInputChangeKey(value) {
      this.privateKey = value
    },
  },
}
</script>

<style lang="scss" module>
@include animation-full-rotate;
.wrapLogin {
  margin: 0 0 2.4rem;
  padding: 0 1.6rem 3.6rem;
  border-bottom: 0.1rem solid $color-dark;
  box-shadow: 0 0.1rem $color-dark-light;
  @include media('sm') {
    padding: 0 2rem 4rem;
  }
}
.login {
  margin: 0;
  padding: 0 1.6rem;
  display: grid;
  gap: 1.6rem;
  @include media('sm') {
    padding: 0 2rem;
  }
}
</style>
