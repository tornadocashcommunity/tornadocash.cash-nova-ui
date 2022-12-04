<template>
  <label :class="$style.checkbox">
    <input
      :id="id"
      name="checkbox"
      type="checkbox"
      :checked="checked"
      :disabled="disabled"
      :class="$style.checkbox__input"
      v-on="$listeners"
      @input="$emit('update:modelValue', $event.target.checked)"
    />
    <span :class="$style.checkbox__container">
      <span :class="$style.checkbox__icon"></span>
    </span>
  </label>
</template>

<script>
export default {
  model: {
    event: 'update:modelValue',
  },
  props: {
    modelValue: {
      type: Boolean,
    },
    label: {
      type: String,
      required: false,
    },
    id: {
      type: String,
      required: false,
    },
    checked: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
}
</script>
<style lang="scss" module>
.checkbox {
  display: inline-flex;
  justify-content: flex-start;
  align-items: center;
  cursor: pointer;
  &__container {
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 1.6rem;
    height: 1.6rem;
    background-color: $color-transparent;
    border: 0.1rem solid $color-checkbox-border;
    border-radius: 0.4rem;
    transition: background-color $duration-animation-02s, borber-color $duration-animation-02s;
  }
  &__icon {
    left: 0;
    position: absolute;
    display: inline-block;
    opacity: $opacity-invisible;
    transition: opacity $duration-animation-02s;
    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: -0.2rem;
      width: 1.8rem;
      height: 0.1rem;
      background-color: currentcolor;
      transform: translate(0, -50%) rotate(-45deg);
      z-index: $zIndex-1;
    }
    &::after {
      transform: translate(0, -50%) rotate(45deg);
    }
  }
  &__input {
    position: absolute;
    margin: -0.1rem;
    width: 0.1rem;
    height: 0.1rem;
    clip: rect(0.1rem 0.1rem 0.1rem 0.1rem);
    &:disabled {
      opacity: $opacity-05;
      cursor: not-allowed;
    }
    &:hover:not([disabled]) ~ .checkbox__container {
      background-color: $color-white-005;
    }
    &:focus:not([disabled]) ~ .checkbox__container,
    &:checked:not([disabled]) ~ .checkbox__container {
      border-color: $color-white;
    }
    &:checked:not([disabled]) ~ .checkbox__container > .checkbox__icon {
      opacity: $opacity-default;
    }
    &:focus:checked:not([disabled]) ~ .checkbox__container {
      background-color: darken($color-white, 84%);
    }
  }
}

.checkbox[disabled] .checkbox__container,
.checkbox__input:disabled + .checkbox__container {
  opacity: $opacity-06;
  filter: grayscale(40%);
  cursor: not-allowed;
}
</style>
