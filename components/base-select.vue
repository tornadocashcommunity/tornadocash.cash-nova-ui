<template>
  <div v-on-clickAway="clickOutside" :class="$style.select">
    <button
      :disabled="disabled"
      :tabindex="tabindex"
      :class="[$style.select__selected, $style[type], $style[size], { [$style.select__selected_open]: open }]"
      @click="onSelectToggle"
    >
      {{ selected }}
    </button>

    <label v-if="label" :class="$style.select__label">
      {{ label }}
    </label>

    <div :class="[$style.select__items, { [$style.select__items_hide]: !open }]">
      <select-option
        v-for="option of options"
        :key="option.value || option"
        :set-selected="setSelected"
        :option="option"
        :selected="selected"
      />
    </div>
  </div>
</template>

<script>
import { directive as onClickAway } from 'vue-clickaway'
import { numbers } from '@/constants'
import SelectOption from './SelectOption'

export default {
  components: { SelectOption },
  directives: {
    onClickAway: onClickAway,
  },
  props: {
    options: {
      type: Array,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    default: {
      type: String,
      required: false,
      default: null,
    },
    tabindex: {
      type: Number,
      required: false,
      default: 0,
    },
    label: {
      type: String,
      default: '',
    },
    update: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'defaultType',
      validator(value) {
        return ['defaultType'].includes(value)
      },
    },
    size: {
      type: String,
      default: 'defaultSize',
      validator(value) {
        return ['defaultSize', 'large', 'medium'].includes(value)
      },
    },
  },
  data() {
    return {
      selected: this.default || this.options[numbers.ZERO],
      open: false,
    }
  },
  watch: {
    update(newValue) {
      this.selected = newValue
    },
  },
  mounted() {
    this.$emit('input', this.selected)
  },
  methods: {
    setSelected(option) {
      this.open = false
      this.selected = option
      this.$emit('input', option)
    },
    clickOutside() {
      this.open = false
    },
    onSelectToggle() {
      this.open = !this.open
    },
  },
}
</script>

<style lang="scss" module>
.select {
  position: relative;
  margin: 0;
  display: block;
  width: 100%;
  text-align: left;
  &__selected {
    position: relative;
    width: 100%;
    height: 100%;
    font-family: $font-family-main;
    font-weight: $font-weight-medium;
    color: $color-white;
    text-align: left;
    white-space: nowrap;
    text-overflow: ellipsis;
    background-color: $color-transparent;
    border: none;
    border-radius: 0.4rem;
    opacity: $opacity-08;
    cursor: pointer;
    transition: opacity $duration-animation-02s ease;
    z-index: $zIndex-4;
    overflow: hidden;
    outline: none;
    user-select: none;
    &:disabled {
      cursor: not-allowed;
    }
    &:hover:not([disabled]),
    &:focus:not([disabled]) {
      opacity: $opacity-default;
      -moz-appearance: number-input;
    }
    &:focus:not([disabled]) {
      outline: none;
    }
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: auto;
      right: 2rem;
      bottom: auto;
      height: 1rem;
      width: 1rem;
      display: block;
      border-width: 0 0 0.1rem 0.1rem;
      border-style: solid;
      border-color: $color-white;
      transform-origin: center center;
      transform: translateY(-50%) rotate(-45deg);
      transition: transform $duration-animation-02s ease, border-color $duration-animation-02s ease;
    }
    &_open {
      &::after {
        transform: rotate(135deg);
      }
    }
  }

  &__label {
    position: absolute;
    left: 2rem;
    top: 50%;
    margin: 0;
    padding: 0;
    display: inline-block;
    font-weight: $font-weight-medium;
    font-size: 1.2rem;
    line-height: 1.43;
    color: $color-grey;
    background-color: $color-transparent;
    transform-origin: left bottom;
    transform: translate(0, -145%);
    transition: transform $duration-animation-02s ease, font-size $duration-animation-02s ease, color $duration-animation-02s ease;
    touch-action: manipulation;
    pointer-events: none;
    z-index: $zIndex-4;
  }

  &__items {
    position: absolute;
    top: calc(100% - 0.3rem);
    left: 0;
    right: 0;
    max-height: 27.6rem;
    background-color: $color-dark-heavy;
    border-right: 0.1rem solid $color-white-02;
    border-left: 0.1rem solid $color-white-02;
    border-bottom: 0.1rem solid $color-white-02;
    border-radius: 0 0 0.4rem 0.4rem;
    box-shadow: 0 1rem 2rem $color-black-004, 0 0.2rem 0.6rem $color-black-004, 0 0 0.1rem $color-black-004;
    overflow: auto;
    z-index: $zIndex-3;
    &_hide {
      display: none;
    }
  }
}

/* Types */
/* defaultType */
.defaultType {
  color: $color-white;
  background-color: $color-input-bg;
  border: $size-input-border solid $color-white-01;

  &:hover:not([disabled]) {
    background-color: $color-input-bg-bold;
    border: $size-input-border solid $color-white-03;
  }
  &:focus-within:not([disabled]),
  &:active:not([disabled]) {
    background-color: $color-input-bg-light;
    border: $size-input-border solid $color-white-03;
  }
}

/* Sizes */
/* defaultSize, large, medium */
.defaultSize {
  padding: 3.1rem 3.6rem 1.2rem 2rem;
  font-size: 1.8rem;
  line-height: 1.43;
  &::placeholder {
    font-size: 1.6rem;
  }
}
.large {
  padding: 2rem;
  font-size: 1.6rem;
  line-height: 1.25;
  &::placeholder {
    font-size: 1.6rem;
  }
}
.medium {
  padding: 1.2rem;
  font-size: 1.4rem;
  line-height: 1.25;
  &::placeholder {
    font-size: 1.4rem;
  }
}
</style>
