<template>
  <div :class="$style.list">
    <button :key="metamask.name" type="button" :class="$style.list__item" @click="setProcessedWallet('METAMASK')">
      <span :class="$style.list__iconWrap">
        <base-icon :name="metamask.iconName" size="fill" />
      </span>
      <h4 :class="$style.list__itemTitle">Using {{ metamask.name }}</h4>
    </button>

    <button type="button" :class="$style.list__item" @click="openPrivateKeyBlock">
      <span :class="$style.list__iconWrap">
        <base-icon name="key" size="fill" />
      </span>
      <h4 :class="$style.list__itemTitle">Using private key</h4>
    </button>
  </div>
</template>

<script>
import { SUPPORTED_WALLETS } from '@/constants'

export default {
  props: {
    setProcessedWallet: {
      type: Function,
      required: true,
    },
    openPrivateKeyBlock: {
      type: Function,
      required: true,
    },
  },
  data: function () {
    return {
      metamask: SUPPORTED_WALLETS.METAMASK,
    }
  },
}
</script>

<style lang="scss" module>
@include animation-full-rotate;

.list {
  margin: 0 0 1rem;
  padding: 0 1.6rem;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-column-gap: 2rem;
  @include media('sm') {
    padding: 0 2rem;
  }

  &__item {
    position: relative;
    margin: 0;
    padding: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    font-family: $font-family-main;
    font-weight: $font-weight-semiBold;
    font-size: 1.4rem;
    line-height: 1.44;
    color: $color-grey;
    background-color: $color-transparent;
    border: none;
    cursor: pointer;
    outline: none;
    &:disabled {
      cursor: not-allowed;
    }
    &:hover:not([disabled]),
    &:focus-within:not([disabled]),
    &:active:not([disabled]) {
      .list__iconWrap {
        color: $color-default;
      }
      .list__itemTitle {
        color: $color-default;
      }
    }
  }
  &__iconWrap {
    margin: 0 0 1.6rem;
    width: 16rem;
    flex: 0 0 auto;
    background-color: $color-white-003;
    transition: color $duration-animation-02s ease-in;
  }
  &__itemTitle {
    margin: 0;
    width: 100%;
    text-align: center;
    transition: color $duration-animation-02s ease-in;
  }
}
</style>
