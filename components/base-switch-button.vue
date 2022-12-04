<template>
  <base-button
    full-width
    type="primary"
    size="small"
    :disabled="isButtonDisabled"
    :label="value"
    :class="[
      $style.switcherButton,
      {
        [$style.switcherButton_active]: isButtonActive,
      },
      {
        [$style.switcherButton_warning]: shouldExceptionMark && !hasError,
      },
      {
        [$style.switcherButton_error]: isButtonError,
      },
      {
        [$style.switcherButton_exception]: isException,
      },
    ]"
    @click="onSwitch(value)"
  >
    {{ value }}<span>{{ subValue }}</span>
  </base-button>
</template>

<script>
export default {
  props: {
    value: {
      type: String,
      required: true,
    },
    subValue: {
      type: String,
      default: '',
    },
    exception: {
      type: String,
      default: undefined,
    },
    isExceptionMarked: {
      type: Boolean,
      default: false,
    },
    selected: {
      type: String,
      required: true,
    },
    hasError: {
      type: Boolean,
      default: false,
    },
    onSwitch: {
      type: Function,
      required: true,
    },
  },
  computed: {
    isButtonActive() {
      return this.isSelected && !this.hasError
    },
    isButtonError() {
      return this.hasError && (this.isSelected || this.shouldExceptionMark)
    },
    isButtonDisabled() {
      return this.shouldExceptionMark
    },
    isException() {
      return this.exception && this.exception === this.value
    },
    isSelected() {
      return this.value === this.selected
    },
    shouldExceptionMark() {
      return this.isExceptionMarked && this.isException
    },
  },
  methods: {},
}
</script>

<style lang="scss" module scoped>
.switcherButton {
  max-width: 8rem;
  height: 4rem;
  overflow: inherit;
  border-radius: 0.3rem;
  font-size: 1.3rem;
  padding: 0.5rem 0.7rem;
  text-transform: uppercase;
  background: $color-bg-primary;
  border-color: $color-white-02;
  &:disabled {
    cursor: default;
  }
  &:hover {
    color: $color-white;
    background: $color-grey-bold;
    border-color: $color-white-04;
  }

  &:active {
    background: $color-bg-primary;
  }

  &:last-child {
    &::after {
      display: none;
    }
  }

  &_error,
  &_warning,
  &_exception,
  &_active {
    &:focus-within,
    &:focus {
      background: $color-bg-primary;
    }
    &::after {
      display: none;
    }
  }

  &_active {
    transform: none;
    border-color: $color-default;
    color: $color-default;
    &:focus-within {
      border-color: $color-default;
      color: $color-default;
    }
  }

  &_error {
    border-color: $color-danger;
    color: $color-danger;
    &:focus-within,
    &_active {
      color: $color-danger;
      border-color: $color-danger;
    }
  }

  &_warning {
    border-color: $color-alert;
    color: $color-alert;
    &:focus-within,
    &_active {
      color: $color-alert;
      border-color: $color-alert;
    }
  }

  &_exception {
    transform: none;
    span {
      display: none;
    }
    &:focus-within,
    &_active {
      border-color: $color-default;
      color: $color-default;
    }
    &:hover {
      color: $color-alert;
      border-color: $color-alert;
    }
  }
  span {
    margin-left: 0.5rem;
  }
}
</style>
