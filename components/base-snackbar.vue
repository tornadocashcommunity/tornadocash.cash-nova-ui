<template>
  <div v-if="isOpen" :class="$style.wrapper">
    <div :class="$style.container">
      <div :class="$style.iconContainer">
        <base-icon v-if="icon" :class="$style.icon" :name="icon" size="fill" />
      </div>

      <div :class="$style.content">
        <div :class="$style.content__text">
          <slot />
        </div>

        <span :class="$style.content__close" @click="onClose">
          <base-icon name="error" size="extraMedium" />
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    icon: {
      type: String,
      default: null,
    },
    onClose: {
      type: Function,
      required: true,
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
  },
}
</script>

<style lang="scss" module>
.wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 1rem;
}

.container {
  margin: 0 auto;
  display: flex;
  max-width: 80%;
  width: max-content;
  min-height: 4rem;
  align-items: center;
  padding: 0 1rem 0 0.5rem;
  border: 0.1rem solid $color-alert;
  border-radius: 0.6rem;
  overflow: hidden;
}

.iconContainer {
  position: relative;
  width: 4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 4rem;
  &::after {
    content: '';
    position: absolute;
    top: -0.1rem;
    bottom: -0.1rem;
    left: -50%;
    right: -0.6rem;
    transform: skewX(20deg);
    background-color: rgba(255, 138, 0, 0.2);
    border-right: 0.1rem solid rgba(255, 138, 0, 0.2);
    border-top-right-radius: 0.2rem;
  }
  .icon {
    position: relative;
    z-index: $zIndex-1;
    width: 24px;
    height: 24px;
  }
}

.content {
  display: flex;
  width: 100%;
  justify-content: space-between;
  padding: 0 0 0 1.5rem;
  align-items: center;
  @include media('xsm') {
    padding: 0 0 0 2.5rem;
  }
  &__text {
    font-weight: $font-weight-regular;
    font-size: 0.9rem;
    line-height: 1.57;
    text-align: center;
    @include media('xsm') {
      font-size: 1.2rem;
    }
    @include media('md') {
      font-size: 1.4rem;
    }
  }
  &__close {
    cursor: pointer;
    margin-left: 1rem;
    svg {
      fill: $color-white;
      &:hover {
        fill: $color-grey;
        transition: 0.2s ease-in;
      }
    }
  }
}
</style>
