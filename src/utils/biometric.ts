/**
 * Вход по Face ID / Touch ID (отпечатку).
 *
 * КАК ЭТО РАБОТАЕТ И ЧЕГО НЕ ДЕЛАЕТ
 *
 * Биометрия сама по себе паролей не хранит — она лишь подтверждает, что за
 * телефоном владелец. Поэтому схема такая:
 *
 *   1. Один раз входим паролем ДБО.
 *   2. Регистрируем в системе ключ устройства (WebAuthn, платформенный
 *      аутентификатор — это и есть Face ID / Touch ID).
 *   3. Пароль шифруем и кладём в хранилище браузера. Ключ шифрования —
 *      НЕИЗВЛЕКАЕМЫЙ (extractable: false): его нельзя прочитать даже из кода
 *      приложения, браузер отдаёт только результат операции.
 *   4. При следующем входе просим Face ID. Расшифровываем пароль только
 *      после успешного подтверждения.
 *
 * ЧЕСТНО О ГРАНИЦАХ ЗАЩИТЫ. Пароль от банка переезжает с сервера на ваше
 * устройство — это лучше (телефон под вашим контролем и заперт биометрией),
 * но не абсолютная защита: при полном доступе к разблокированному телефону
 * данные достать можно. Поэтому:
 *   - биометрия включается только по явному желанию владельца;
 *   - выключается одним движением, и пароль сразу стирается;
 *   - три неудачных подтверждения — отключаем и требуем пароль.
 */

const DB_NAME = 'centrinvest-auth'
const STORE = 'keys'
const CRED_KEY = 'credentialId'
const WRAP_KEY = 'wrapKey'
const SECRET_KEY = 'secret'
const FAILS_KEY = 'fails'
const MAX_FAILS = 3

// ─── Хранилище ──────────────────────────────────────────────────────────────
// IndexedDB, а не localStorage: только он умеет хранить CryptoKey как объект,
// не превращая его в строку. Строку можно было бы просто прочитать.
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function put(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function get<T>(key: string): Promise<T | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}

async function del(key: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ─── Доступность ────────────────────────────────────────────────────────────

/** Поддерживает ли устройство вход по биометрии. */
export async function isBiometricSupported(): Promise<boolean> {
  if (!window.PublicKeyCredential || !window.isSecureContext) return false
  if (!window.crypto?.subtle || !window.indexedDB) return false
  try {
    // Спрашиваем именно про ВСТРОЕННЫЙ аутентификатор: Face ID, Touch ID,
    // сканер отпечатка. Внешние ключи для входа в приложение не нужны.
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

/** Включена ли биометрия на этом устройстве. */
export async function isBiometricEnabled(): Promise<boolean> {
  return !!(await get<ArrayBuffer>(CRED_KEY)) && !!(await get<CryptoKey>(WRAP_KEY))
}

/** Как назвать способ входа на экране: у Apple это Face ID, у остальных — отпечаток. */
export function biometricName(): string {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod|Macintosh/.test(ua)) return 'Face ID'
  return 'отпечаток'
}

// ─── Подтверждение личности ─────────────────────────────────────────────────

const randomBytes = (n: number) => window.crypto.getRandomValues(new Uint8Array(n))

/**
 * Показать системный запрос Face ID / отпечатка.
 * userVerification: 'required' — без подтверждения личности не пускать,
 * иначе система может ограничиться простым присутствием ключа.
 */
async function verifyIdentity(credentialId: ArrayBuffer): Promise<boolean> {
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      allowCredentials: [{ id: credentialId, type: 'public-key' }],
      userVerification: 'required',
      timeout: 60000,
    },
  })
  return !!assertion
}

// ─── Включение ──────────────────────────────────────────────────────────────

/**
 * Включить вход по биометрии: регистрируем ключ устройства и запоминаем
 * учётные данные в зашифрованном виде.
 */
export async function enableBiometric(login: string, password: string): Promise<void> {
  if (!await isBiometricSupported()) {
    throw new Error('Устройство не поддерживает вход по биометрии')
  }

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: randomBytes(32),
      rp: { name: 'Центр-инвест Бизнес' },
      user: {
        id: new TextEncoder().encode(login),
        name: login,
        displayName: login,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },    // ES256
        { type: 'public-key', alg: -257 },  // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',   // именно встроенный: Face ID / Touch ID
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',   // подтверждение производителя нам ни к чему
    },
  }) as PublicKeyCredential | null

  if (!credential) throw new Error('Не удалось зарегистрировать биометрию')

  // Ключ шифрования создаём НЕИЗВЛЕКАЕМЫМ: даже код приложения не может его
  // прочитать и скопировать — браузер отдаёт только результат шифрования.
  const wrapKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  )

  const iv = randomBytes(12)
  const data = new TextEncoder().encode(JSON.stringify({ login, password }))
  const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrapKey, data)

  await put(CRED_KEY, credential.rawId)
  await put(WRAP_KEY, wrapKey)
  await put(SECRET_KEY, { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) })
  await put(FAILS_KEY, 0)
}

/** Выключить и стереть сохранённые данные. */
export async function disableBiometric(): Promise<void> {
  await Promise.all([del(CRED_KEY), del(WRAP_KEY), del(SECRET_KEY), del(FAILS_KEY)])
}

// ─── Вход ───────────────────────────────────────────────────────────────────

/**
 * Войти по биометрии. Возвращает учётные данные — или бросает ошибку,
 * если подтверждение не прошло.
 */
export async function unlockWithBiometric(): Promise<{ login: string; password: string }> {
  const credentialId = await get<ArrayBuffer>(CRED_KEY)
  const wrapKey = await get<CryptoKey>(WRAP_KEY)
  const secret = await get<{ iv: number[]; data: number[] }>(SECRET_KEY)

  if (!credentialId || !wrapKey || !secret) {
    await disableBiometric()
    throw new Error('Вход по биометрии не настроен')
  }

  try {
    const ok = await verifyIdentity(credentialId)
    if (!ok) throw new Error('Подтверждение не получено')
  } catch (e) {
    // Считаем неудачи: подобрать биометрию нельзя, но если что-то пошло не
    // так три раза подряд — надёжнее вернуться к паролю, чем упорствовать.
    const fails = ((await get<number>(FAILS_KEY)) ?? 0) + 1
    await put(FAILS_KEY, fails)
    if (fails >= MAX_FAILS) {
      await disableBiometric()
      throw new Error('Слишком много неудачных попыток — войдите по паролю')
    }
    throw e instanceof Error && e.name === 'NotAllowedError'
      ? new Error('Вход отменён')
      : new Error('Не удалось подтвердить личность')
  }

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(secret.iv) },
    wrapKey,
    new Uint8Array(secret.data),
  )
  await put(FAILS_KEY, 0)
  return JSON.parse(new TextDecoder().decode(decrypted))
}
