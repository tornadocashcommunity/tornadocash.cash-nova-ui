<template>
  <div :class="$style.continue">
    <h3 :class="$style.continue__title">{{ method }} confirmation</h3>
    <p :class="$style.continue__text">
      Your zk-Snark proof has been successfully generated! Please click <strong>Confirm</strong> to initiate the {{ method }}
    </p>
    <div :class="$style.continue__checkbox">
      <base-checkbox :id="checkBoxId" v-model="shouldShow" label="base-checkbox" />

      <label :for="checkBoxId" :class="$style.continue__checkboxLabel">Don't show again</label>
    </div>
    <base-button @click="onConfirm">Confirm</base-button>
    <button :class="$style.buttonClose" @click="onClose">
      <base-icon name="cross" size="fill" />
    </button>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

import { errors } from '@/constants'
import { AccountMutation } from '@/types'

export default {
  name: 'ContinueModal',
  props: {
    modalName: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    callback: {
      type: Function,
      required: true,
    },
    rejectCallback: {
      type: Function,
      required: true,
    },
  },
  data: function () {
    return {
      checkBoxId: 'dontShowAgain',
      shouldShow: false,
    }
  },
  computed: {
    ...mapGetters('account', ['shouldShowConfirmModal']),
  },
  methods: {
    ...mapMutations('account', [AccountMutation.SET_SHOULD_SHOW_CONFIRM_MODAL]),
    onClose() {
      this.rejectCallback(errors.processing.DECLINE_OPERATION)
      this.$modal.hide(this.modalName)
    },
    onConfirm() {
      this.callback()
      this.$modal.hide(this.modalName)
      this[AccountMutation.SET_SHOULD_SHOW_CONFIRM_MODAL](!this.shouldShow)
    },
  },
}
</script>

<style lang="scss" module>
.continue {
  margin: 0 auto;
  padding: 2.4rem 2rem;
  display: flex;
  flex-direction: column;
  &__title {
    margin: 0;
    padding: 0 1.6rem;
    font-weight: $font-weight-semiBold;
    font-size: 1.8rem;
    line-height: 1.44;
    margin-bottom: 1rem;
    color: $color-white;
    text-align: center;
    @include media('sm') {
      padding: 0 2rem;
    }
  }
  &__text {
    margin: 0;
    padding: 0 1.6rem;
    font-weight: $font-weight-regular;
    font-size: 1.6rem;
    line-height: 1.5;
    color: $color-white-08;
    text-align: center;
    @include media('sm') {
      padding: 0 2rem;
    }
  }
  &__checkbox {
    padding: 1.2rem 1.6rem 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    column-gap: 0.8rem;
    @include media('sm') {
      padding: 1.2rem 2rem 1.6rem;
    }
  }
  &__checkboxLabel {
    font-weight: $font-weight-medium;
    font-size: 1.2rem;
    line-height: 1;
    color: $color-white;
    cursor: pointer;
    user-select: none;
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
