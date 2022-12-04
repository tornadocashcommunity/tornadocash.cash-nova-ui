<template>
  <div>
    <ul :class="$style.tabs" :style="indentStyles">
      <li v-for="{ name, link, tooltip } of tabs" :key="name" :class="$style.tabs__item">
        <nuxt-link
          v-if="isRouted"
          v-tooltip="tooltip"
          :to="link"
          :class="[$style.tabs__link, { [$style.tabs__link_active]: isActive(name) }]"
          @click.prevent="setActive(name)"
        >
          {{ name }}
        </nuxt-link>

        <a
          v-else
          v-tooltip="tooltip"
          :href="`#${name}`"
          :class="[$style.tabs__link, { [$style.tabs__link_active]: isActive(name) }]"
          @click.prevent="setActive(name)"
        >
          {{ name }}
        </a>
      </li>
    </ul>
    <slot :name="activeItem" />
  </div>
</template>

<script>
export default {
  props: {
    indent: {
      type: String,
      default: '1.5rem',
    },
    tabs: {
      type: Array,
      required: true,
    },
    activeTab: {
      type: String,
      default: null,
      required: false,
    },
    isRouted: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['setActiveTab'],
  data: function () {
    return {
      activeItem: null,
    }
  },
  computed: {
    indentStyles() {
      return `marginBottom: ${this.indent};`
    },
  },
  watch: {
    activeItem(newActiveTab) {
      this.$emit('setActiveTab', newActiveTab)
    },
  },
  mounted() {
    const routedTab = this.tabs.find(({ name }) => name === this.$route.name)

    if (this.activeTab) {
      this.activeItem = this.activeTab
      return
    }

    if (this.isRouted && routedTab) {
      this.activeItem = routedTab.name
      return
    }

    const [firstTab] = this.tabs
    this.activeItem = firstTab.name
  },
  methods: {
    isActive(menuItem) {
      return this.activeItem === menuItem
    },
    setActive(menuItem) {
      this.activeItem = menuItem
    },
    getProps(link) {
      const key = this.isRouted ? 'to' : 'href'
      return { [key]: link }
    },
  },
}
</script>

<style lang="scss" module>
.tabs {
  position: relative;
  margin: 0;
  padding: 0 2rem;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr));
  grid-template-rows: none;
  grid-column-gap: 1.6rem;
  grid-row-gap: 1.6rem;
  justify-content: space-between;
  align-items: center;
  border-bottom: 0.1rem solid $color-dark;
  box-shadow: 0 0.1rem $color-dark-light;
  @include media('sm') {
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  }
  &__item {
    width: 100%;
  }
  &__link {
    position: relative;
    margin: 0;
    padding: 1.4rem 0;
    width: 100%;
    display: inline-block;
    font-weight: $font-weight-semiBold;
    font-size: 1.4rem;
    line-height: 1.2;
    color: $color-grey;
    text-align: center;
    word-break: keep-all;
    text-transform: capitalize;
    &::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -0.2rem;
      display: block;
      width: 100%;
      height: 0.2rem;
      background-color: $color-white;
      border-radius: 0.1rem;
      transform-origin: center top;
      transform: scale(0, 1);
      transition: color $duration-animation-03s, transform $duration-animation-02s ease-out;
      z-index: $zIndex-1;
    }
    &:hover,
    &:focus {
      color: $color-white;
    }
    &_active {
      color: $color-white;
      &:after {
        transform: scale(1, 1);
      }
    }
    &_animated {
      color: $color-white;
      &:after {
        animation: animation-routed-link $duration-animation-02s linear;
      }
    }
    @include media('sm') {
      font-size: 1.6rem;
    }
  }
}

.tabContent {
  padding: 4rem 0 2.4rem;
}
</style>
