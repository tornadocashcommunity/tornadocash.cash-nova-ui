<template>
  <a v-tooltip="tooltip" :href="explorerLink" target="_blank" rel="noopener noreferrer">
    <slot />
  </a>
</template>

<script>
import { getEtherscanLink } from '@/utilities'

export default {
  props: {
    value: {
      type: String,
      required: true,
    },
    tooltip: {
      type: String,
      default: null,
    },
    chainId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      validator(value) {
        return ['transaction', 'token', 'address', 'block'].includes(value)
      },
    },
  },
  computed: {
    explorerLink() {
      return getEtherscanLink(Number(this.chainId), this.value, this.type)
    },
  },
}
</script>
