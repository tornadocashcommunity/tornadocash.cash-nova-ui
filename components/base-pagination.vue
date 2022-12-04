<template>
  <div :class="$style.pagination">
    <div v-show="total > 1" :class="$style.pagination__wrap">
      <span :class="$style.pagination__text">{{ page }}&nbsp;of&nbsp;{{ total }}</span>

      <div :class="$style.pagination__buttons">
        <base-button size="symbol" :disabled="!isShowToPrev" :class="$style.pagination__btn" @click="onPrev">
          <base-icon name="arrow" :class="$style.pagination__iconPrev" />
        </base-button>
      </div>
      <div :class="$style.pagination__buttons">
        <base-button size="symbol" :disabled="!isShowToNext" :class="$style.pagination__btn" @click="onNext">
          <base-icon name="arrow" />
        </base-button>
      </div>
    </div>
  </div>
</template>

<script>
import { numbers } from '@/constants'

export default {
  inheritAttrs: false,
  props: {
    list: {
      type: Array,
      required: true,
    },
    limit: {
      type: Number,
      required: true,
    },
    current: {
      type: Number,
      required: true,
    },
  },
  emits: ['on-set-list'],
  data: function () {
    return {
      page: numbers.PAGINATION_STEP,
    }
  },
  computed: {
    isShowToPrev() {
      return this.page > numbers.PAGINATION_STEP
    },
    isShowToNext() {
      return this.total > this.page
    },
    total() {
      return Math.ceil(this.list.length / this.limit)
    },
  },
  created() {
    this.page = this.current
    this.onSetNewList()
  },
  beforeUpdate() {
    this.onSetNewList()
  },
  methods: {
    onPrev() {
      this.page = this.page - numbers.PAGINATION_STEP
      this.onSetNewList()
    },
    onNext() {
      this.page = this.page + numbers.PAGINATION_STEP
      this.onSetNewList()
    },
    onSetNewList() {
      const actualIndex = this.page - numbers.PAGINATION_STEP
      this.$emit('on-set-list', { from: actualIndex * this.limit, to: this.limit })
    },
  },
}
</script>

<style lang="scss" module scoped>
.pagination {
  height: 3.2rem;
  &__wrap {
    width: 100%;
    display: inline-flex;
    justify-content: flex-end;
    align-items: center;
  }
  &__text {
    margin: 0 1rem;
    font-weight: $font-weight-medium;
    font-size: 1.4rem;
    line-height: 1.4;
    color: $color-white;
  }
  &__buttons {
    display: inline-flex;
    justify-content: space-between;
    align-items: center;
  }
  &__btn {
    margin: 0 0.3rem;
  }
  &__iconPrev {
    transform: rotate(180deg);
  }
}
</style>
