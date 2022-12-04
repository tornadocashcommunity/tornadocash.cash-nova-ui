<template>
  <div v-on-clickAway="onBlur" :class="$style.wrap">
    <label v-if="label" :for="label" :class="$style.label">
      {{ label }}
    </label>

    <base-button v-if="buttonClick" type="link" free-size :disabled="disabled" :class="$style.buttonBlock" @click="buttonClick">
      <span v-if="info" :class="$style.info">
        <span :class="$style.info__text">{{ info }}</span>
        <span :class="$style.info__button">{{ buttonText }}</span>
      </span>
    </base-button>

    <div :class="$style.container">
      <span
        ref="mirror"
        :class="[
          $style.mirrorElement,
          $style[size],
          $style[type],
          $style[inputMode],
          $style[inputType],
          {
            [$style.loading]: loading,
          },
        ]"
      >
        {{ modelValue }}
      </span>
      <input
        :id="label"
        ref="input"
        v-bind="$attrs"
        :type="type"
        :disabled="disabled"
        :value="modelValue"
        :placeholder="placeholderText"
        :class="[
          $style.input,
          $style[type],
          $style[size],
          $style[inputMode],
          $style[inputType],
          {
            [$style.error]: error,
            [$style.loading]: loading,
            [$style.focused]: focused,
          },
        ]"
        autocomplete="nope"
        v-on="$listeners"
        @focus="onFocus"
        @blur="onBlur"
        @input="sendEvent"
      />

      <span
        v-if="isShowShortedAddress"
        :class="[
          $style.shortedAddress,
          $style[size],
          $style[type],
          $style[inputMode],
          $style[inputType],

          {
            [$style.shortedAddress__disabled]: disabled,
            [$style.loading]: loading,
          },
        ]"
        @click="onFocus"
      >
        {{ shortedAddress }}
      </span>
      <span v-if="loading" :class="$style.loader"><span :class="$style.loader__icon" /></span>

      <span v-if="icon" :class="$style.iconTicker">
        <base-icon v-if="icon !== ''" :name="icon" />
        <span v-if="ticker" :class="$style.iconTicker__value">{{ ticker }}</span>
      </span>
    </div>

    <span v-if="error" :class="$style.errorMessage" role="alert">
      {{ errorMessage }}
      <a v-if="errorLink" :href="errorLink" :class="$style.link" target="_blank" rel="noopener noreferrer">more info</a>
    </span>
  </div>
</template>

<script>
import { directive as onClickAway } from 'vue-clickaway'

import { numbers } from '@/constants'
import { checkCryptoNumeric, isAddress } from '@/utilities'

export default {
  directives: {
    onClickAway: onClickAway,
  },
  inheritAttrs: false,
  model: {
    event: 'update:modelValue',
  },
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    buttonClick: {
      type: Function,
      default: null,
    },
    buttonText: {
      type: String,
      default: 'button',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    info: {
      type: String,
      default: '',
    },
    loading: {
      type: Boolean,
      default: false,
    },
    error: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    errorLink: {
      type: String,
      default: '',
    },
    placeholderText: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
      validator(value) {
        return ['', 'ethereum', 'goerli', 'optimism', 'binance'].includes(value)
      },
    },
    ticker: {
      type: String,
      default: 'eth',
    },
    type: {
      type: String,
      default: 'text',
      validator(value) {
        return ['email', 'number', 'password', 'search', 'tel', 'text', 'url', 'file'].includes(value)
      },
    },
    inputMode: {
      type: String,
      default: 'text',
      validator(value) {
        return ['none', 'text', 'tel', 'url', 'email', 'numeric', 'decimal', 'search'].includes(value)
      },
    },
    inputType: {
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
  emits: ['update:modelValue'],
  data() {
    return {
      focused: false,
      isAddress: false,
      shortedAddress: '',
      resizeObserver: '',
    }
  },
  computed: {
    isShowShortedAddress() {
      return Boolean(!this.focused && this.isAddress)
    },
    isFilled() {
      return Boolean(this.modelValue && typeof this.modelValue === 'string' && this.modelValue.length > numbers.ZERO)
    },
  },
  watch: {
    modelValue() {
      this.getShortenAddress()
    },
  },
  mounted() {
    this.isAddress = isAddress(this.modelValue)
    this.observeWidth()

    window.addEventListener('resize', this.getShortenAddress)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.getShortenAddress)
    this.unobserveWidth()
  },
  methods: {
    onFocus() {
      this.focused = true
    },
    observeWidth() {
      this.resizeObserver = new ResizeObserver(() => {
        this.getShortenAddress()
      })

      this.resizeObserver.observe(this.$refs.mirror)
    },
    unobserveWidth() {
      this.resizeObserver.unobserve(this.$refs.mirror)
    },
    onCutAddress(text) {
      const dots = '...'
      if (!text) {
        return ''
      }
      const median = text.length / numbers.TWO
      const cutPoint = median + numbers.ONE + dots.length

      return `${text.substring(numbers.ZERO, median)}${dots}${text.substring(cutPoint)}`
    },
    getShortenAddress() {
      if (!this.isShowShortedAddress) {
        return
      }

      if (!this.modelValue) {
        this.shortedAddress = ''
      }

      this.$refs.mirror.textContent = this.modelValue

      while (true) {
        this.$refs.mirror.textContent = this.onCutAddress(this.$refs.mirror.textContent)

        if (this.$refs.mirror?.offsetWidth < this.$refs.input?.offsetWidth) {
          break
        }
      }
      this.shortedAddress = this.$refs.mirror.textContent
    },
    onBlur() {
      this.focused = false
      this.isAddress = isAddress(this.modelValue)
      this.getShortenAddress()
    },
    sendEvent(event) {
      const { value } = event.target

      switch (this.inputMode) {
        case 'numeric':
          this.sendNumericEvent(value)
          break
        default:
          this.$emit('update:modelValue', value)
      }
    },
    sendNumericEvent(value) {
      if (!value) {
        this.$emit('update:modelValue', value)
        return
      }

      value = value.replaceAll(',', '.').trim()

      const isValid = checkCryptoNumeric(value)

      if (!isValid) {
        // https://github.com/vuejs/vue/issues/6689
        this.$forceUpdate()
        return
      }
      this.$emit('update:modelValue', value)
    },
  },
}
</script>

<style lang="scss" module>
@include animation-full-rotate;

.wrap {
  position: relative;
  margin: 0;
  text-align: left;
}

.label {
  margin: 0 0 0.8rem;
  padding: 0;
  display: inline-block;
  font-weight: $font-weight-semiBold;
  font-size: 1.4rem;
  line-height: 1.2;
  color: $color-grey;
  background-color: $color-transparent;
}

.container {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  height: 4.8rem;
}

.mirrorElement,
.shortedAddress,
.input {
  position: relative;
  margin: 0;
  display: block;
  width: 100%;
  font-family: $font-family-main;
  font-weight: $font-weight-medium;
  text-align: left;
  border: none;
  border-radius: 0.4rem;
  box-shadow: none;
  appearance: none;
  transition: color $duration-animation-02s ease, background-color $duration-animation-02s ease,
    border-color $duration-animation-02s ease;
  z-index: $zIndex-2;
  &::placeholder {
    font-weight: $font-weight-regular;
    line-height: 1.33;
    color: $color-input-placeholder;
    transition: opacity $duration-animation-02s;
    user-select: none;
  }
  &:hover:not([disabled]) {
    & + .label {
      color: $color-white;
    }
  }
  &:hover:not([disabled]),
  &:focus:not([disabled]) {
    -moz-appearance: number-input;
  }
  &:focus:not([disabled]) {
    outline: none;
  }
  &:disabled {
    color: $color-white-04;
    background-color: $color-input-bg-disabled;
    border-color: $color-white-01;
  }
  &[readonly] {
    cursor: not-allowed;
    background-color: $color-input-bg-disabled;
  }
  &[type='password'] {
    font-family: caption;
    letter-spacing: 0.5rem;
    &::placeholder {
      letter-spacing: normal;
    }
  }
  &[type='file'] {
    display: none;
  }

  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type='search']::-webkit-search-cancel-button,
  &[type='time']::-webkit-calendar-picker-indicator,
  &[type='date']::-webkit-calendar-picker-indicator,
  &[type='week']::-webkit-calendar-picker-indicator,
  &[type='month']::-webkit-calendar-picker-indicator,
  &[type='datetime-local']::-webkit-calendar-picker-indicator {
    display: none;
  }
}
/* Types */
/* defaultType */
.defaultType {
  color: $color-white;
  background-color: $color-input-bg;
  border: $size-input-border solid $color-white-02;

  &:hover:not([disabled]) {
    background-color: $color-input-bg-bold;
    border: $size-input-border solid $color-white-04;
    label {
      color: $color-white;
    }
  }
  &:focus-within:not([disabled]),
  &:active:not([disabled]) {
    background-color: $color-input-bg-light;
    border: $size-input-border solid $color-white-03;
  }
}

.mirrorElement {
  visibility: hidden;
  position: absolute;
  width: max-content;
}

/* Sizes */
/* defaultSize, large, medium */
.defaultSize {
  padding: 1.1rem 1rem;
  font-size: 1.8rem;
  line-height: 1.33;
  &::placeholder {
    font-size: 1.8rem;
  }
}
.large {
  padding: 2rem;
  font-size: 2rem;
  line-height: 1.25;
  &::placeholder {
    font-size: 2rem;
  }
}
.medium {
  padding: 1.2rem 1rem;
  font-size: 1.4rem;
  line-height: 1.25;
  &::placeholder {
    font-size: 1.4rem;
  }
}

.shortedAddress {
  position: absolute;
  width: 100%;
  height: 100%;
  cursor: pointer;
  z-index: $zIndex-3;
  &__disabled {
    color: $color-white-04;
    background-color: $color-input-bg-disabled;
    border: $size-input-border solid $color-white-01;
    pointer-events: none;
  }
}

.loader {
  position: absolute;
  top: 50%;
  left: 1.2rem;
  width: 2rem;
  height: 2rem;
  transform: translate(0, -50%);
  z-index: $zIndex-3;
  &__icon {
    margin: 0;
    width: 2rem;
    height: 2rem;
    display: inline-block;
    border-style: solid;
    border-width: 0.2rem;
    border-color: $color-white $color-transparent $color-white $color-transparent;
    border-radius: 50%;
    animation: animation-full-rotate $duration-animation-1200ms linear infinite;
  }
}

.loading {
  padding-left: 4rem;
}
.error {
  border-color: $color-danger;
}

.errorMessage {
  position: absolute;
  left: 0;
  top: calc(100% + 0.6rem);
  display: inline-block;
  font-family: $font-family-main;
  font-weight: $font-weight-regular;
  font-size: 1.2rem;
  line-height: 1.3;
  color: $color-danger;
}

.iconTicker {
  position: relative;
  padding: 0.8rem;
  width: 100%;
  min-width: 8rem;
  height: 100%;
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 0 0.4rem;
  color: $color-white;
  background-color: $color-input-bg;
  border-radius: 0 0.4rem 0.4rem 0;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -0.6rem;
    width: 0.6rem;
    height: 100%;
    background-color: $color-input-bg;
  }
  &__value {
    font-weight: $font-weight-semiBold;
    font-size: 1.4rem;
    line-height: 1.2;
    text-transform: uppercase;
  }
}

.buttonBlock {
  position: absolute;
  top: 0.5rem;
  right: 0;
  height: auto;
  text-decoration: none;
}

.buttonAction {
  padding: 0.2rem;
  width: auto;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  text-decoration: none;
  color: $color-link-hover;
  &:disabled {
    color: $color-link-hover;
  }
  &:focus-within:not([disabled]) {
    background-color: $color-input-bg;
  }
}

.info {
  margin: 0;
  display: inline-flex;
  justify-content: flex-end;
  font-weight: $font-weight-medium;
  font-size: 1.2rem;
  line-height: 1.2;
  color: $color-input-placeholder;
  white-space: nowrap;
  overflow: hidden;
  user-select: none;
  &:hover {
    .info__button {
      color: $color-default;
    }
  }
  &__text {
    display: none;
    @include media('sm') {
      display: inline-block;
    }
  }
  &__button {
    color: $color-success;
    margin-left: 0.5rem;
    transition: all $duration-animation-02s ease-in;
    &:first-letter {
      text-transform: uppercase;
    }
  }
}

.link {
  color: $color-danger;
  text-decoration: underline;
  text-underline-offset: 0.5rem;
}
</style>
