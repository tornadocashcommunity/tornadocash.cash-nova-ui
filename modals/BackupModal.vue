<template>
  <div :class="$style.backUp">
    <h3 :class="$style.backUp__title">Shielded key</h3>
    <p :class="$style.backUp__text">Please back up your shielded key to access your account in the future.</p>
    <p :class="$style.backUp__text"><strong>DO NOT</strong> share your key with anyone, including Tornado Cash developers.</p>
    <span :class="$style.backUp__actionButtons">
      <div :class="$style.backUp__actionButton">
        <base-button type="primary" full-width @click="onKeyDownload">
          <base-icon name="download" size="medium" />
          Download
        </base-button>
      </div>

      <div :class="$style.backUp__actionButton">
        <base-button type="primary" full-width @click="onKeyCopy">
          <base-icon v-if="showKeyIcon" name="tick" size="small" :class="$style.accountModal__copyButton" />
          <base-icon v-else name="copy" size="medium" />
          Copy
        </base-button>
      </div>
    </span>
    <div :class="$style.backUp__checkbox">
      <base-checkbox :id="checkBoxId" v-model="backedUp" label="base-checkbox" yaya />

      <label :for="checkBoxId" :class="$style.backUp__checkboxLabel">I backed up the shielded key</label>
    </div>

    <base-button :disabled="!backedUp" @click="onConfirm">Continue</base-button>
    <button :class="$style.buttonClose" @click="onClose">
      <base-icon name="cross" size="fill" />
    </button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { errors, numbers } from '@/constants'
import { copyToClipboard, saveAsFile } from '@/utilities'
import BaseIcon from '~/components/base-icon'

export default {
  name: 'BackupModal',
  components: { BaseIcon },
  props: {
    modalName: {
      type: String,
      required: true,
    },
    privateKey: {
      type: String,
      required: true,
    },
    callback: {
      type: Function,
      required: true,
    },
    rejectCallback: {
      type: Function,
      required: true,
    },
  },
  data: function () {
    return {
      backedUp: false,
      showKeyIcon: false,
      checkBoxId: 'backedUp',
    }
  },
  computed: {
    ...mapGetters('account', ['accountAddress']),
  },
  mounted() {
    setTimeout(() => {
      this.onKeyDownload()
    }, numbers.THOUSAND)
  },
  methods: {
    onConfirm() {
      this.callback()
      this.$modal.hide(this.modalName)
    },
    onClose() {
      this.rejectCallback(errors.processing.DECLINE_OPERATION)
      this.$modal.hide(this.modalName)
    },
    onKeyDownload() {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      saveAsFile(`Shielded private key \n${this.privateKey}`, `TornadoCash-Nova-key-${this.accountAddress.slice(0, 8)}`)
    },
    onKeyCopy() {
      copyToClipboard(this.privateKey)
      this.showKeyIcon = true
      setTimeout(() => {
        this.showKeyIcon = false
      }, numbers.SECOND * numbers.TWO)
    },
  },
}
</script>

<style lang="scss" module>
.backUp {
  margin: 0 auto;
  padding: 2.4rem 2rem;
  display: flex;
  flex-direction: column;
  &__title {
    margin: 0;
    padding: 0;
    font-weight: $font-weight-semiBold;
    font-size: 1.8rem;
    line-height: 1.44;
    margin-bottom: 1rem;
    color: $color-white;
    text-align: center;
  }
  &__text {
    margin: 0;
    padding: 0;
    font-weight: $font-weight-regular;
    font-size: 1.6rem;
    line-height: 1.5;
    color: $color-white-08;
  }
  &__checkbox {
    padding: 1.2rem 1.6rem 2rem 0;
    display: flex;
    align-items: center;
    column-gap: 0.8rem;
    @include media('sm') {
      padding: 1.2rem 2rem 1.6rem 0;
    }
  }
  &__checkboxLabel {
    font-weight: $font-weight-medium;
    font-size: 1.2rem;
    line-height: 1;
    color: $color-white;
    cursor: pointer;
    user-select: none;
  }
  &__actionButtons {
    display: flex;
    padding-top: 1.2rem;
    justify-content: space-between;

    span {
      margin-right: 0.75rem;
    }
  }
  &__actionButton {
    width: 16.5rem;
    button {
      height: 6rem;
    }
  }
}

.buttonClose {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.2rem;
  display: flex;
  width: 2.8rem;
  height: 2.8rem;
  color: $color-grey;
  background-color: $color-transparent;
  border: none;
  border-radius: 0.6rem;
  transition: color $duration-animation-02s ease-in, background-color $duration-animation-02s ease-in;
  cursor: pointer;
  &:hover:not([disabled]),
  &:focus-within:not([disabled]),
  &:active:not([disabled]) {
    color: $color-white;
  }
  @include media('md') {
    top: 1.4rem;
    right: 1.4rem;
  }
}
</style>
