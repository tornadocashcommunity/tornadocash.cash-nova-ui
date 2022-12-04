<template>
  <div :class="$style.customSum">
    <h2 :class="$style.customSum__title">Custom withdrawal amount</h2>
    <p :class="$style.customSum__text">
      We strongly advise you to choose one of the 4 predetermined amounts, which will allow your withdrawal to blend in the crowd
      and remain anonymous.
    </p>
    <p :class="$style.customSum__text">
      Choosing a custom amount for your withdrawal might put your privacy at risk. You should be aware that withdrawing custom
      amounts can make it easy to link your initial transaction with your withdrawal. You should only use this custom option with
      full knowledge of this fact and in complete confidence in your actions.
    </p>
    <button :class="$style.buttonClose" @click="onClose">
      <base-icon name="cross" size="fill" />
    </button>
  </div>
</template>

<script>
export default {
  name: 'ElementChooserModal',
  props: {
    modalName: {
      type: String,
      required: true,
    },
  },
  methods: {
    onClose() {
      this.$modal.hide(this.modalName)
    },
  },
}
</script>

<style lang="scss" module>
.customSum {
  margin: 0 auto;
  padding: 2.4rem 0 0;
  display: flex;
  flex-direction: column;
  &__title {
    margin: 0 0 1.6rem;
    padding: 0 1.6rem;
    font-weight: $font-weight-semiBold;
    font-size: 1.6rem;
    line-height: 1.2;
    color: $color-white;
    @include media('sm') {
      padding: 0 2rem;
      font-size: 1.8rem;
    }
  }
  &__text {
    margin: 0 0 2.4rem;
    padding: 0 1.6rem;
    font-weight: $font-weight-medium;
    font-size: 1.4rem;
    line-height: 1.2;
    color: $color-white;
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
