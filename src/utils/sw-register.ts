export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported')
    return
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })

    console.log('Service Worker registered:', registration)

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('New Service Worker available')
          // Show update notification to user
          window.dispatchEvent(
            new CustomEvent('sw-update-available', {
              detail: { registration }
            })
          )
        }
      })
    })

    // Handle controller change (update applied)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker updated')
    })
  } catch (error) {
    console.error('Service Worker registration failed:', error)
  }
}

export function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then((persistent) => {
      console.log('Persistent storage granted:', persistent)
    })
  }
}

export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      await registration.unregister()
    }
    console.log('All Service Workers unregistered')
  } catch (error) {
    console.error('Service Worker unregistration failed:', error)
  }
}
