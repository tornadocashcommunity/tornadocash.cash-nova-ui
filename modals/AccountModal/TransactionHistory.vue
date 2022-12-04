<template>
  <div>
    <div :class="$style.header">
      <h6 v-for="header of headers" :key="header.text" :class="$style.header__item">
        {{ header.text }}
        <base-icon v-if="header.tooltip" name="info" :tooltip="header.tooltip" />
      </h6>
    </div>

    <div v-if="isLoading" :class="$style.tx__noTransactions">
      <h5 :class="$style.tx__noTransactionsText"><span :class="$style.loading" /> Loading</h5>
    </div>
    <div v-else-if="txsHistory.length">
      <div v-for="tx of txsList" :key="tx.transactionHash" :class="$style.tx__row">
        <div :class="$style.tx__status">
          <base-status-icon :type="tx.type" size="fill" :status="tx.status" />
        </div>
        <div v-if="tx.timestamp" :class="$style.tx__timeStamp">
          <span :class="$style.tx__date">{{ tx.timestamp.date }}</span>
          <span :class="$style.tx__time">{{ tx.timestamp.time }}</span>
        </div>
        <div v-else>—</div>

        <span :class="$style.tx__amount">{{ tx.amount }} {{ chainConfig.symbol }}</span>

        <span v-if="tx.type" :class="$style.tx__type">{{ tx.type }}</span>
        <div v-else>—</div>

        <div>
          <base-explorer-link
            v-if="tx.recipient"
            tooltip="Link to explorer"
            type="address"
            :class="$style.tx__recipient"
            :value="tx.recipient"
            :chain-id="String(tx.chainId)"
          >
            {{ sliceHash(tx.recipient) }}
          </base-explorer-link>
          <span v-else>-</span>
        </div>

        <base-explorer-link
          type="transaction"
          :class="$style.tx__hash"
          :value="tx.transactionHash"
          :chain-id="String(tx.chainId)"
        >
          <base-button full-width type="primary" size="small">view</base-button>
        </base-explorer-link>
      </div>
    </div>
    <div v-else :class="$style.tx__noTransactions">
      <h5 :class="$style.tx__noTransactionsText">No data</h5>
    </div>

    <div>
      <base-pagination :list="txsHistory" :current="current" :limit="limit" @on-set-list="onSetList" />
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

import { DateTime } from 'luxon'
import { BigNumber } from 'ethers'

import { txStatuses } from '@/constants'
import { sliceHash, hexToNumber, toDecimalsPlaces } from '@/utilities'

const ITEMS_ON_PAGE = 5

export default {
  data: function () {
    return {
      current: 1,
      txsList: [],
      isLoading: false,
      limit: ITEMS_ON_PAGE,
      headers: [
        { text: '', tooltip: '' },
        { text: 'Date', tooltip: '' },
        { text: 'Token amount', tooltip: '' },
        { text: 'Action', tooltip: '' },
        { text: 'Recipient', tooltip: '' },
        { text: 'Explorer', tooltip: '' },
      ],
    }
  },
  computed: {
    ...mapGetters('wallet', ['chainConfig']),
    ...mapGetters('transaction', ['txsHistory']),
    transactions() {
      return this.txsHistory.map(({ status, timestamp, amount, ...rest }) => {
        const txTimestamp = this.getTime(timestamp)
        const txAmount = toDecimalsPlaces(Number(amount))
        const txStatus = Object.keys(txStatuses).find((key) => BigNumber.from(txStatuses[key]).eq(status))

        return { ...rest, status: txStatus.toLowerCase(), amount: txAmount, timestamp: txTimestamp }
      })
    },
  },
  mounted() {
    this.updateAccountHistory()
  },
  methods: {
    ...mapActions('transaction', ['migrateTxHistory']),
    async updateAccountHistory() {
      try {
        this.isLoading = true
        await this.migrateTxHistory()
      } catch (err) {
        this.$notification({
          type: 'error',
          title: 'Download history error',
          text: err.message,
        })
      } finally {
        this.isLoading = false
      }
    },
    getTime(dataTime) {
      const millis = DateTime.fromMillis(Number(dataTime))
      const date = millis.toLocaleString(DateTime.DATE_SHORT)
      const time = millis.toLocaleString(DateTime.TIME_WITH_SECONDS)

      if (date.includes('Invalid DateTime') || time.includes('Invalid DateTime')) {
        return
      }
      return { date, time }
    },
    getBlock(hex) {
      if (hex) {
        return String(hexToNumber(hex))
      }
      return '-'
    },
    onSetList({ from, to }) {
      const array = [...this.transactions]
      this.txsList = array.splice(from, to)
    },
    sliceHash,
  },
}
</script>

<style lang="scss" module>
@include animation-full-rotate;

.header {
  margin: 0 0 1rem;
  padding: 0 2rem;
  width: 100%;
  display: inline-grid;
  grid-template-columns: 6rem 11rem 13rem 9rem 9rem 8.4rem;
  grid-template-rows: auto;
  justify-content: space-between;
  align-items: center;
  grid-gap: 0 1.6rem;
  @include media('sm') {
    grid-template-columns: 7% 15% 18% 15% 15% 12%;
  }
  &__item {
    margin: 0;
    font-weight: $font-weight-semiBold;
    font-size: 1.2rem;
    line-height: 1.2;
    color: $color-white;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    &:first-child {
      width: 5rem;
      word-break: keep-all;
    }
  }
}

.tx {
  &__row {
    margin: 0 0 0.2rem;
    padding: 0.8rem 1.6rem;
    width: 100%;
    display: inline-grid;
    grid-template-columns: 6rem 11rem 13rem 9rem 9rem 8.4rem;
    grid-template-rows: auto;
    justify-content: space-between;
    align-items: center;
    grid-gap: 0 1.6rem;
    background-color: $color-white-003;
    border-radius: 0.4rem;
    &:last-child {
      margin: 0 0 2.4rem;
    }
    @include media('sm') {
      padding: 1.2rem 2rem;
      grid-template-columns: 7% 15% 18% 15% 15% 12%;
    }
  }
  &__status {
    width: 3rem;
    height: 3rem;
  }
  &__timeStamp {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    font-weight: $font-weight-medium;
  }
  &__date {
    font-size: 1.4rem;
    line-height: 1.4;
  }
  &__time {
    font-size: 1.2rem;
    line-height: 1;
  }
  &__amount {
    font-weight: $font-weight-semiBold;
    font-size: 1.4rem;
    line-height: 1;
  }
  &__type {
    max-width: 9rem;
    font-weight: $font-weight-medium;
    font-size: 1.4rem;
    line-height: 1.2;
    &:first-letter {
      text-transform: uppercase;
    }
  }
  &__recipient {
    font-weight: $font-weight-medium;
    font-size: 1.4rem;
    line-height: 1;
    color: $color-grey;
    text-decoration: underline;
    &:hover {
      color: $color-default;
    }
  }
  &__noTransactions {
    text-align: center;
  }
  &__noTransactionsText {
    margin: 0;
    padding: 1.2rem;
    font-weight: $font-weight-regular;
    font-size: 1.4rem;
    line-height: 1.2;
    color: $color-white;
    background-color: $color-white-01;
    border-radius: 0.6rem;
  }
}
.loading {
  position: relative;
  overflow: hidden;
  margin-right: 2rem;
  &::before {
    display: none;
  }
  &::after {
    content: '';
    margin: auto;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    position: absolute;
    display: block;
    width: 1.4rem;
    height: 1.4rem;
    background-color: $color-transparent;
    background-image: none;
    border: 0.2rem solid $color-white;
    border-color: $color-white $color-transparent $color-white $color-transparent;
    border-radius: 50%;
    animation: animation-full-rotate $duration-animation-1200ms linear infinite;
    opacity: $opacity-default;
  }
}
</style>
