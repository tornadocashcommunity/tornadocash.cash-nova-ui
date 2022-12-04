<template>
  <div :class="$style.container">
    <div :class="$style.social">
      <a :href="dune" target="_blank" aria-label="Dune analytics" :class="$style.social__link" rel="noopener noreferrer nofollow">
        <span :class="$style.social__linkText">Dune analytics</span>
        <base-icon name="stats" size="large" />
      </a>

      <a :href="twitter" target="_blank" aria-label="Twitter" :class="$style.social__link" rel="noopener noreferrer nofollow">
        <span :class="$style.social__linkText">Twitter</span>
        <base-icon name="twitter" size="large" />
      </a>

      <a :href="telegram" target="_blank" aria-label="Telegram" :class="$style.social__link" rel="noopener noreferrer nofollow">
        <span :class="$style.social__linkText">Telegram</span>
        <base-icon name="telegram" size="large" />
      </a>

      <a :href="github" target="_blank" aria-label="Github" :class="$style.social__link" rel="noopener noreferrer nofollow">
        <span :class="$style.social__linkText">Github</span>
        <base-icon name="github" size="large" />
      </a>
    </div>
  </div>
</template>

<script>
import { DUNE, TWITTER, TELEGRAM, GITHUB } from '@/constants'

export default {
  data: function () {
    return {
      dune: DUNE,
      twitter: TWITTER,
      telegram: TELEGRAM,
      github: GITHUB,
    }
  },
}
</script>

<style lang="scss" module>
.container {
  margin: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  @include media('sm') {
    margin: 0;
    width: auto;
    flex-direction: row;
    justify-content: flex-start;
  }
}

.social {
  position: relative;
  margin: 0 0 2rem;
  display: flex;
  align-items: center;
  @include media('sm') {
    margin: 0;
  }
  &__link {
    margin: 0 0.1rem;
    width: 4rem;
    height: 4rem;
    display: flex;
    justify-content: center;
    align-items: center;
    color: $color-grey;
    border-radius: 1.2rem;
    &:hover,
    &:focus,
    &:active {
      color: $color-white;
    }
  }
  &__linkText {
    position: absolute;
    width: 4rem;
    text-indent: -1000%;
    overflow: hidden;
  }
}
</style>
