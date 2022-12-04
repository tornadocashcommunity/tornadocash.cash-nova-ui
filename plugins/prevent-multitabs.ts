import { numbers } from '@/constants'
import { Plugin } from '@nuxt/types'

function main() {
  const id = Date.now().toString()
  window.id = id
  window.localStorage.setItem('firstTab', id)

  const onLocalStorageEvent = function (e: StorageEvent) {
    // the second tab will write its id to this key. The first one will notice it
    if (e.key === 'firstTab') {
      const newID = Date.now()

      console.warn('Another tab detected. Setting the new page id', newID)

      setTimeout(() => {
        window.localStorage.secondTab = newID // this is going to be a message for the second tab
      }, numbers.ONE_HUNDRED * numbers.TWO)
    }

    // the second tab processes the message
    if (e.key === 'secondTab' && window.id === window.localStorage.firstTab) {
      console.warn('There is another tab that already opened. We will close this one')

      window.onbeforeunload = null
      window.alert(`Multiple tabs opened. Your page will be closed. Please only use single instance of ${window.location.origin}`)
      window.location.href = 'https://twitter.com/tornadocash'
    }
  }

  // this event will only trigger when a window other than itself makes changes to local storage.
  setTimeout(() => {
    window.addEventListener('storage', onLocalStorageEvent, false)
  }, numbers.ONE_HUNDRED)
}

const preventMultitabs: Plugin = (_, inject) => {
  inject('preventMultitabs', main)
}

export default preventMultitabs
