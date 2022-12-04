<template>
  <div :class="$style.container">
    <div :class="$style.block">
      <base-switcher is-routed :tabs="routedTabs">
        <div :slot="slotName" :class="$style.content">
          <div :class="$style.bodyWrapper">
            <slot name="body" />
          </div>

          <div :class="$style.actionWrapper">
            <slot name="actions" />
          </div>
        </div>
      </base-switcher>
    </div>
  </div>
</template>

<script>
import { routedTabs } from '@/constants'

export default {
  name: 'WorkflowWindow',
  props: {
    slotName: {
      type: String,
      required: true,
    },
  },
  data: function () {
    return {
      routedTabs,
    }
  },
}
</script>

<style lang="scss" module>
.container {
  margin: 0 auto;
  padding: 1.4rem 2rem;
  width: 100%;
  max-width: 136rem;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  justify-content: center;
  @include media('md') {
    padding: 1.4rem 1.8rem;
  }
  @include media('xl') {
    padding: 3rem 0;
  }
  @include media('xxl') {
    padding: 1.8rem 3.4rem;
  }
}

.stats {
  width: 100%;
  max-width: 40rem;
  background-color: $color-white-003;
  border-radius: 0.6rem;
  justify-self: start;
  @include media('md') {
    margin: 0;
  }
  &__item {
    padding: 2rem 1.6rem;
    &:first-child {
      border-bottom: 0.1rem solid $color-dark;
      box-shadow: 0 0.1rem $color-dark-light;
    }
    @include media('md') {
      padding: 3.3rem 2rem;
    }
  }
  &__itemTitle {
    margin: 0 0 0.6rem;
    display: flex;
    align-items: center;
    font-weight: $font-weight-medium;
    font-size: 1.4rem;
    line-height: 1;
    color: $color-grey;
    @include media('md') {
      font-size: 1.6rem;
    }
  }
  &__itemValue {
    margin: 0;
    font-weight: $font-weight-bold;
    font-size: 2rem;
    line-height: 1;
    color: $color-white;
    text-transform: uppercase;
    @include media('md') {
      font-size: 2.4rem;
    }
  }
}

.block {
  position: relative;
  margin: 0 0 4rem;
  padding: 1.8rem 0 2.4rem;
  justify-self: center;
  width: 100%;
  max-width: $size-content-block;
  background-color: $color-grey;
  background-image: $color-gradient-grey;
  background-repeat: no-repeat;
  border-radius: 0.6rem;
  box-shadow: 0 1rem 2rem $color-black-004, 0 0.2rem 0.6rem $color-black-004, 0 0 0.1rem $color-black-004;
  @include media('md') {
    margin: 0;
  }
}

.content {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bodyWrapper {
  padding: 2rem 2rem 4rem;
  width: 100%;
  border-bottom: 0.1rem solid $color-dark;
  box-shadow: 0 0.1rem $color-dark-light;
}

.actionWrapper {
  width: 100%;
  padding: 2.4rem 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
