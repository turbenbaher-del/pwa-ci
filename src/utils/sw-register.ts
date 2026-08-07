export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported')
    return
  }

  // Путь и scope берём из base сборки: в подпапке (GitHub Pages) корневой '/sw.js' даёт 404,
  // а scope '/' вообще запрещён для скрипта из подпапки.
  const base = import.meta.env.BASE_URL

  try {
    const registration = await navigator.serviceWorker.register(`${base}sw.js`, {
      scope: base
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

    // Новый воркер встал у руля — ПЕРЕЗАГРУЖАЕМ страницу. Без этого на экране
    // остаётся старая сборка: воркер обновился, а загруженный HTML и JS — нет.
    // Именно поэтому на телефоне раз за разом открывалась прошлая версия.
    //
    // Но перезагружать можно ТОЛЬКО при настоящем обновлении. При первой
    // установке clientsClaim заставляет воркер захватить уже открытую страницу,
    // и это же событие срабатывает на ровном месте. Перезагрузка тогда рвала
    // идущие запросы к банку (счета грузятся до 40 секунд) — и экран оставался
    // пустым. Поэтому смотрим, был ли контроллер ДО регистрации.
    const hadController = !!navigator.serviceWorker.controller
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) {
        console.log('Service Worker установлен впервые — перезагрузка не нужна')
        return
      }
      if (reloading) return          // защита от петли перезагрузок
      // Идёт подпись — перезагрузка оборвала бы транзакцию с токеном и
      // человек потерял бы попытку ввода ключа. Обновимся в другой раз.
      if (document.querySelector('.sign-modal')) {
        console.log('Идёт подпись — откладываем обновление')
        return
      }
      reloading = true
      console.log('Service Worker updated — перезагружаем приложение')
      window.location.reload()
    })

    // Установленное на телефон приложение может не перезапускаться сутками.
    // Проверяем обновления при возврате к приложению и раз в 5 минут.
    const checkForUpdate = () => { registration.update().catch(() => {}) }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    })
    window.setInterval(checkForUpdate, 5 * 60 * 1000)
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
