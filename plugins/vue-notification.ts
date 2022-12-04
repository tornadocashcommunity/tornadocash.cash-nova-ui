import Vue from 'vue'
import Notifications, { NotificationOptions } from 'vue-notification'

import { Inject } from '@/types'

Vue.use(Notifications, {
  closeOnClick: false,
})

export default (_: never, inject: Inject<NotificationOptions>) => {
  inject('notification', Vue.notify)
}
