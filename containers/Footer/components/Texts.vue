<template>
  <div :class="$style.container">
    <span :class="$style.texts">
      Tornado.cash Nova version:
      <span :class="$style.texts__version">{{ commit }}</span>
    </span>
  </div>
</template>

<script>
export default {
  data: function () {
    return {
      commit: process.env.commit,
    }
  },
}
</script>

<style lang="scss" module>
.container {
  margin: 0 0 3rem;
  display: flex;
  align-items: flex-end;
  flex: 1 0 auto;
  @include media('sm') {
    margin: 0;
  }
}
.texts {
  font-weight: $font-weight-regular;
  font-size: 1.6rem;
  line-height: 1.2;
  color: $color-grey;
  &__version {
    margin: 0 0 0 0.3rem;
    font-weight: $font-weight-bold;
    color: $color-white;
  }
}
</style>
