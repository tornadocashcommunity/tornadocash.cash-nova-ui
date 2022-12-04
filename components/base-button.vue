<template>
  <button
    v-bind="$attrs"
    :disabled="isDisabled"
    :class="[
      $style.styledButton,
      $style[type],
      $style[size],
      { [$style.fullWidth]: fullWidth },
      { [$style.freeSize]: freeSize },
      { [$style.loading]: loading },
    ]"
    v-on="$listeners"
  >
    <slot />
  </button>
</template>

<script>
export default {
  inheritAttrs: false,
  props: {
    fullWidth: {
      type: Boolean,
      default: false,
    },
    freeSize: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: 'defaultType',
      validator(value) {
        return ['defaultType', 'primary', 'link'].includes(value)
      },
    },
    size: {
      type: String,
      default: 'defaultSize',
      validator(value) {
        return ['defaultSize', 'large', 'medium', 'small', 'mini', 'symbol', 'square'].includes(value)
      },
    },
  },
  computed: {
    isDisabled() {
      return this.disabled || this.loading
    },
  },
}
</script>
<style lang="scss" module>
@include animation-full-rotate;

.styledButton {
  position: relative;
  margin: 0;
  width: auto;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  font-family: $font-family-main;
  font-weight: $font-weight-semiBold;
  letter-spacing: normal;

  border: none;
  border-radius: 0.4rem;

  transition: all $duration-animation-02s ease-in, text-indent $duration-animation-0s;
  cursor: pointer;
  overflow: hidden;
  z-index: $zIndex-1;
  outline: none;
  &:disabled {
    cursor: not-allowed;
  }
  &::-moz-focus-inner {
    border: none;
  }
}

.fullWidth {
  width: 100%;
  height: 100%;
}

/* Types */
/* defaultType, primary, link */
.defaultType {
  color: $color-dark-hard;
  background-color: $color-default;
  background-image: $color-gradient-green;
  background-repeat: no-repeat;
  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    display: block;
    z-index: $zIndex-negative;
  }
  &::before {
    background-image: $color-gradient-green;
  }
  &::after {
    opacity: $opacity-invisible;
    background-image: $color-gradient-green-light;
    transition: transform $duration-animation-02s ease-in, opacity $duration-animation-02s ease-in;
  }
  &:disabled {
    color: $color-white-02;
    background-image: $color-gradient-green-disabled;
    border: 0.1rem solid $color-grey-bold;
    &::before {
      opacity: $opacity-invisible;
    }
    &::after {
      transition: unset;
    }
  }

  &:hover:not([disabled]) {
    &::after {
      opacity: $opacity-default;
    }
  }

  &:focus-within:not([disabled]) {
    box-shadow: 0 0 0.4rem 0 $color-default;
  }

  &:active:not([disabled]) {
    transform: translateY(0.2rem);
  }
}
.primary {
  font-weight: $font-weight-medium;
  color: $color-grey;
  background-color: $color-transparent;
  border: 0.1rem solid $color-grey;
  &:disabled {
    color: $color-grey-hard;
    background-color: $color-transparent;
    border-color: $color-grey-hard;
  }

  &:hover:not([disabled]) {
    color: $color-white;
    border-color: $color-white;
  }

  &:focus-within:not([disabled]),
  &:active:not([disabled]) {
    color: $color-grey-medium;
    background-color: $color-white;
    border-color: $color-white;
  }
  &:active:not([disabled]) {
    transform: translateY(0.2rem);
  }
}
.link {
  font-weight: $font-weight-medium;
  color: $color-link-text;
  background-color: $color-transparent;
  text-decoration: underline;
  &:disabled {
    color: $color-grey-hard;
  }

  &:hover:not([disabled]),
  &:focus-within:not([disabled]),
  &:active:not([disabled]) {
    color: $color-link-hover;
  }
}

/* Sizes */
/* defaultSize, large, medium, small, mini, symbol, square */
.defaultSize {
  padding: 0.4rem 1.6rem;
  min-width: 11rem;
  height: 5rem;
  font-size: 1.6rem;
  line-height: 1.44;
}
.large {
  padding: 1.2rem 2rem;
  min-width: 14rem;
  height: 5.8rem;
  font-size: 1.8rem;
  line-height: 1.44;
}
.medium {
  padding: 0.8rem 2rem;
  min-width: 5.2rem;
  height: 4rem;
  font-size: 1.6rem;
  line-height: 1.14;
}
.small {
  padding: 0.5rem 1.2rem;
  min-width: 3rem;
  height: auto;
  font-size: 1.4rem;
  line-height: 1.67;
}
.mini {
  padding: 0.4rem;
  min-width: 3.2rem;
  height: 3.2rem;
  font-size: 1.2rem;
  line-height: 1;
}
.symbol {
  padding: 0.4rem;
  min-width: 3.2rem;
  max-width: 3.2rem;
  height: 3.2rem;
  font-size: 1.2rem;
  line-height: 1;
}

.freeSize {
  padding: 0;
  min-width: auto;
}

.loading {
  position: relative;
  text-indent: -1000%;
  overflow: hidden;
  &::before {
    display: none;
  }
  &::after {
    content: '';
    margin: auto;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    position: absolute;
    display: block;
    width: 2rem;
    height: 2rem;
    background-color: $color-transparent;
    background-image: none;
    border: 0.2rem solid $color-white;
    border-color: $color-white $color-transparent $color-white $color-transparent;
    border-radius: 50%;
    animation: animation-full-rotate $duration-animation-1200ms linear infinite;
    opacity: $opacity-default;
  }
}
</style>
