<template>
  <notifications animation-name="v-fade-top" :class="[{ [$style.poolNotify]: !isModalExist }]">
    <template slot="body" slot-scope="{ item, close }">
      <toast :item="item" :close="close" :is-modal-exist="isModalExist" :check-is-modal-exist="getIsModalExist" />
    </template>
  </notifications>
</template>

<script>
import Toast from './Toast.vue'

export default {
  components: {
    Toast,
  },
  data: function () {
    return {
      isModalExist: false,
    }
  },
  methods: {
    getIsModalExist() {
      const modalContainer = document.getElementById('modals-container')
      this.isModalExist = Boolean(modalContainer?.childElementCount)
    },
  },
}
</script>
<style lang="scss">
// Style for Notify lib
.vue-notification-group {
  top: 0 !important;
  right: 1rem !important;
  width: calc(100% - 2rem) !important;
  max-width: 38rem !important;
  z-index: $zIndex-7 !important;
  @include media('md') {
    top: 1rem !important;
    right: 1.5rem !important;
  }
  @include media('lg') {
    top: 1rem !important;
    right: 1.5rem !important;
  }
  @include media('xl') {
    right: 2rem !important;
  }
}

.v-fade-top-enter-active,
.v-fade-top-leave-active,
.v-fade-top-move {
  transition: all $duration-animation-05s;
}

.v-fade-top-enter,
.v-fade-top-leave-to {
  opacity: $opacity-invisible;
  transform: translateY(0) scale(0.2);
}
</style>

<style lang="scss" module>
.poolNotify {
  position: absolute !important;
  @include media('md') {
    top: 8rem !important;
    right: 7.5rem !important;
  }
  @include media('lg') {
    top: 8.8rem !important;
    right: 7.8rem !important;
  }
  @include media('xl') {
    right: 2.2rem !important;
  }
  @include media('xxl') {
    right: 5.6rem !important;
  }
}
</style>
