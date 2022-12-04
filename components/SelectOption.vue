<template>
  <button :class="[$style.item, { [$style.item__selected]: currentValue === selected }]" @click="setSelected(currentValue)">
    {{ renderedValue }}
  </button>
</template>

<script>
import { directive as onClickAway } from 'vue-clickaway'

export default {
  directives: {
    onClickAway: onClickAway,
  },
  props: {
    option: {
      type: [Object, String],
      required: true,
    },
    selected: {
      type: String,
      required: true,
    },
    setSelected: {
      type: Function,
      required: true,
    },
  },
  computed: {
    currentValue() {
      return this.option.value || this.option
    },
    renderedValue() {
      return this.option.label ? `${this.currentValue} ${this.option.label}` : this.currentValue
    },
  },
  methods: {
    getValue(option) {
      return option.value || option
    },
  },
}
</script>

<style lang="scss" module>
.item {
  padding: 1.5rem 2rem 1.4rem;
  width: 100%;
  font-family: $font-family-main;
  font-weight: $font-weight-medium;
  font-size: 1.8rem;
  line-height: 1.2;
  color: $color-grey;
  text-align: left;
  background-color: $color-transparent;
  border: none;
  border-bottom: 0.1rem solid $color-dark;
  box-shadow: 0 0.1rem $color-dark-light;
  transition: color $duration-animation-02s ease, background-color $duration-animation-02s ease;
  cursor: pointer;
  outline: none;
  user-select: none;
  &:first-child {
    padding: 1.8rem 2rem 1.4rem;
  }
  &:last-child {
    border-color: $color-transparent;
    box-shadow: none;
  }
  &:hover:not([disabled]) {
    color: $color-white;
    border-bottom: 0.1rem solid $color-grey-heavy;
    background-color: $color-grey-heavy;
  }
  &:focus-within:not([disabled]),
  &:active:not([disabled]) {
    color: $color-white;
  }
  &__selected {
    color: $color-white;
  }
}
</style>
