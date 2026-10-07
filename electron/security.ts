import { PinAttempts } from './pinAttempts.js'
const attempts = new PinAttempts()
// Bootstrap credentials are accepted only to replace them; no data session is granted.
export function isBootstrapPin(pin: string): boolean { return /^([1-4])\1{3}$/.test(pin) }
import crypto from 'node:crypto'

// Eski sabit salt: geriye dönük uyumluluk için hâlâ doğrulamada deneniyor,
// yeni hash üretiminde artık kullanılmıyor (bkz. setActiveSalt / ensureSecuritySalt).
const LEGACY_SALT = 'OtoServis2026_Salt_#9982'

let activeSalt: string = LEGACY_SALT

export function setActiveSalt(salt: string): void {
  if (salt && typeof salt === 'string' && salt.length >= 16) {
    activeSalt = salt
  }
}

function hashWithSalt(pin: string, salt: string): string {
  return crypto.createHash('sha256').update(String(pin || '').trim() + salt).digest('hex')
}

export function hashPin(pin: string): string {
  return hashWithSalt(pin, activeSalt)
}

export function verifyPin(enteredPin: string, storedDbPin: string): boolean {
  const key = String(storedDbPin || 'unknown')
  attempts.check(key)
  const finish = (valid: boolean) => { attempts.result(key,valid); return valid }
  if (!storedDbPin) return finish(false)
  const cleanStored = String(storedDbPin || '').trim()
  if (hashWithSalt(enteredPin, activeSalt) === cleanStored) return finish(true)
  // Kurulum bazlı rastgele salt'a geçmeden önce oluşturulmuş hash'ler için geriye dönük kontrol
  if (activeSalt !== LEGACY_SALT && hashWithSalt(enteredPin, LEGACY_SALT) === cleanStored) return finish(true)
  return finish(false)
}
