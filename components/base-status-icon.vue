<template>
  <base-icon :name="icon" :size="size" :class="[{ [$style[status]]: status }]" />
</template>

<script>
import { transactionTitles } from '@/constants'

export default {
  props: {
    type: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: '',
      validator(value) {
        return ['', 'fail', 'success', 'pending'].includes(value)
      },
    },
    size: {
      type: String,
      default: 'default',
      validator(value) {
        return ['default', 'extraMedium', 'medium', 'small', 'large', 'xlarge', 'xl', 'fill', 'auto', 'symbol'].includes(value)
      },
    },
  },
  computed: {
    icon() {
      return this.getTransactionType(this.type)
    },
  },
  methods: {
    getTransactionType(type) {
      const auth = [transactionTitles.SETUP]
      const incoming = [transactionTitles.FUND, transactionTitles.BRIDGE, transactionTitles.INCOMING_FUND]
      const outgoing = [transactionTitles.TRANSFER, transactionTitles.WITHDRAW]

      const txTypes = { auth, incoming, outgoing }

      const keys = Object.keys(txTypes)
      const key = keys.find((key) => Boolean(txTypes[key].find((el) => type.includes(el))))
      return key ?? type
    },
  },
}
</script>
<style lang="scss" module>
.success {
  svg {
    fill: $color-success;
  }
}
.pending {
  svg {
    fill: $color-warning;
  }
}
.fail {
  svg {
    fill: $color-danger;
  }
}
</style>
