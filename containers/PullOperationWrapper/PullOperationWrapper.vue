<template>
  <styled-switcher :slot-name="slotName">
    <template slot="body">
      <slot name="body" />
    </template>
    <template slot="actions">
      <slot name="actions" />
    </template>
  </styled-switcher>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

import { StyledSwitcher } from '@/containers'

export default {
  components: {
    StyledSwitcher,
  },
  props: {
    amount: {
      type: String,
      required: true,
    },
    slotName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    checker: {
      type: Function,
      required: true,
    },
  },
  computed: {
    ...mapGetters('account', ['isRelayer', 'accountBalance']),
    ...mapGetters('relayer', ['currentRelayer']),
    ...mapGetters('application', ['l1Fee']),
  },
  watch: {
    accountBalance() {
      this.checker()
    },
    currentRelayer() {
      this.checker()
    },
    l1Fee() {
      if (this.type === 'withdrawal') {
        this.checker()
      }
    },
    amount() {
      this.checker()
    },
    isRelayer() {
      this.checker()
    },
  },
  created() {
    this.getRelayers(this.type)

    this.checker()
  },
  methods: {
    ...mapActions('relayer', ['getRelayers']),
  },
}
</script>
