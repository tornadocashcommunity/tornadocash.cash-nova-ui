<template>
  <div :class="$style.confirm">
    <span :class="$style.confirm__icon">
      <base-icon name="tick" />
    </span>
    <h3 :class="$style.confirm__title">{{ title }} has been sent</h3>
    <p :class="$style.confirm__text">Check your account transaction history</p>
    <button :class="$style.buttonClose" @click="onClose">
      <base-icon name="cross" size="fill" />
    </button>
  </div>
</template>

<script>
import { numbers } from '@/constants'

export default {
  name: 'SuccessModal',
  props: {
    modalName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
  },
  mounted() {
    this.closeTimer = setTimeout(() => {
      this.onClose()
    }, numbers.CONFIRM_MODAL_CLOSE_TIME)
  },
  beforeDestroy() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer)
    }
  },
  methods: {
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
  &__icon {
    margin: 5rem auto 2.2rem;
    width: 6rem;
    height: 6rem;
    display: flex;
    justify-content: center;
    align-items: center;
    color: $color-success;
    border: 0.2rem solid $color-success;
    border-radius: 50%;
  }
  &__title {
    margin: 0;
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
    margin: 0 0 4rem;
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
