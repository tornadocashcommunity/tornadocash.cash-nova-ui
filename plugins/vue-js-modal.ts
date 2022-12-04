import Vue from 'vue'

// @ts-expect-error
import VModal from 'vue-js-modal/dist/ssr.nocss'

const MIN_HEIGHT = 300

Vue.use(VModal, {
  dynamicDefaults: {
    adaptive: true,
    focusTrap: true,
    height: 'auto',
    minHeight: MIN_HEIGHT,
    scrollable: true,
    classes: 'modal',
    closeOnClick: true,
  },
})
