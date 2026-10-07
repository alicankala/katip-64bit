import db, {
  dbPath,
  uygulamaVerileriniYenileBackend,
  ayarlariGetirBackend,
  topluAyarlariKaydetBackend,
  veritabaniKontrolEtBackend
} from '../database.js'
import { app, shell } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { hashPin, verifyPin, isBootstrapPin } from '../security.js'
import { SETTINGS_KEYS, safeSettings } from '../accessPolicy.js'
import { getActiveMasterSession, isPinChangeRequired, requirePinChange, setActiveMasterSession } from '../session.js'

const ADMIN_PIN_SETTING_KEY = 'admin_pin_hash'
const ADMIN_PIN_DEFAULT = '4444'

function getAdminPinHash(): string {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(ADMIN_PIN_SETTING_KEY) as any
  return row?.value || hashPin(ADMIN_PIN_DEFAULT)
}

function setAdminPinHash(hash: string): void {
  db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = CURRENT_TIMESTAMP
  `).run(ADMIN_PIN_SETTING_KEY, hash)
}

// Diğer controller'ların (örn. gün sonu yeniden açma) admin PIN doğrulaması
// için tek nokta; hash okuma mantığı bu dosyada kalır.
export function verifyAdminPin(pin: string): boolean {
  const girilenPin = String(pin || '').trim()
  if (!/^\d{4}$/.test(girilenPin) || isBootstrapPin(girilenPin)) return false
  return verifyPin(girilenPin, getAdminPinHash())
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export async function destekSistemBilgileriGetirBackend(): Promise<any> {
  try {
    const backupDir = path.join(app.getPath('userData'), 'yedekler')
    let dbSize = '0 B'
    try {
      const stat = await fs.stat(dbPath)
      dbSize = formatBytes(stat.size)
    } catch (e) {}

    let lastBackupDate = 'Yapılmadı'
    let lastBackupName = 'Yok'
    let lastBackupSize = '0 B'

    try {
      await fs.mkdir(backupDir, { recursive: true })
      const files = await fs.readdir(backupDir)
      let newest: { name: string; path: string; time: number; size: number } | null = null
      for (const f of files) {
        if (f.endsWith('.zip') || f.endsWith('.db')) {
          const fp = path.join(backupDir, f)
          const stat = await fs.stat(fp)
          if (!newest || stat.mtimeMs > newest.time) {
            newest = { name: f, path: fp, time: stat.mtimeMs, size: stat.size }
          }
        }
      }
      if (newest) {
        lastBackupDate = new Date(newest.time).toLocaleString('tr-TR')
        lastBackupName = newest.name
        lastBackupSize = formatBytes(newest.size)
      }
    } catch (e) {}

    const musteriSayisi = Number((db.prepare('SELECT COUNT(*) AS count FROM customers WHERE IFNULL(is_active, 1) = 1').get() as any)?.count || 0)
    const aracSayisi = Number((db.prepare('SELECT COUNT(*) AS count FROM vehicles WHERE IFNULL(is_active, 1) = 1').get() as any)?.count || 0)
    const isEmriSayisi = Number((db.prepare('SELECT COUNT(*) AS count FROM work_orders').get() as any)?.count || 0)
    const parcaSayisi = Number((db.prepare('SELECT COUNT(*) AS count FROM parts WHERE IFNULL(is_active, 1) = 1').get() as any)?.count || 0)

    return {
      success: true,
      bilgiler: {
        dbPath,
        backupDir,
        dbSize,
        musteriSayisi,
        aracSayisi,
        isEmriSayisi,
        parcaSayisi,
        lastBackupDate,
        lastBackupName,
        lastBackupSize,
        appVersion: app.getVersion() || '1.0.0'
      }
    }
  } catch (error) {
    console.error('Destek sistem bilgileri getirme hatası:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}

export function registerSettingsHandlers(kanalEkle: (kanal: string, fonksiyon: (...args: any[]) => any) => void) {
  // 1. Uygulama Verilerini Yenile
  kanalEkle('uygulama-verilerini-yenile', async () => {
    return await uygulamaVerileriniYenileBackend()
  })

  // 2. Ayarları Getir
  kanalEkle('ayarlari-getir', () => {
    const result = ayarlariGetirBackend()
    result.settings = Object.fromEntries(Object.entries(result.settings).filter(([key]) => SETTINGS_KEYS.has(key) && ((getActiveMasterSession() !== null && !isPinChangeRequired()) || ['theme','list_density','setup_wizard_done'].includes(key))))
    return result
  })

  // 3. Ayar Kaydet / Toplu Kaydet
  kanalEkle('ayarlari-kaydet', (_event, settings: any) => {
    if (safeSettings(settings)) {
      return topluAyarlariKaydetBackend(Object.fromEntries(Object.entries(settings).map(([key,value]) => [key,String(value)])))
    }
    return { success: false, error: 'Geçersiz ayar verisi.' }
  })

  // 4. Destek Sistem Bilgileri Getir
  kanalEkle('destek-sistem-bilgileri-getir', async () => {
    return await destekSistemBilgileriGetirBackend()
  })

  // 5. Veritabanı Kontrol Et
  kanalEkle('veritabani-kontrol-et', () => {
    return veritabaniKontrolEtBackend()
  })

  // 6. Log Klasörünü Aç
  kanalEkle('log-klasoru-ac', async () => {
    try {
      const logDir = app.getPath('logs') || app.getPath('userData')
      await fs.mkdir(logDir, { recursive: true })
      await shell.openPath(logDir)
      return { success: true }
    } catch (err) {
      return { success: false, error: getErrorMessage(err) }
    }
  })

  // 7. Admin PIN Doğrula
  kanalEkle('admin-pin-dogrula', (_event, pin: any) => {
    try {
      const girilenPin = String(pin || '').trim()
      if (!/^\d{4}$/.test(girilenPin)) {
        return { success: false, error: 'PIN 4 haneli olmalıdır.' }
      }
      const mevcutHash = getAdminPinHash()
      if (!verifyPin(girilenPin, mevcutHash)) {
        return { success: false, error: 'Hatalı Admin PIN.' }
      }
      const guncelHash = hashPin(girilenPin)
      if (guncelHash !== mevcutHash) {
        setAdminPinHash(guncelHash)
      }
      setActiveMasterSession('admin')
      const requiresPinChange = isBootstrapPin(girilenPin)
      requirePinChange(requiresPinChange)
      return { success: true, requiresPinChange }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  })

  // 8. Admin PIN Değiştir
  kanalEkle('admin-pin-degistir', (_event, veri: any) => {
    try {
      if (getActiveMasterSession() !== 'admin') return { success: false, error: 'Admin girişi gereklidir.' }
      const eskiPin = String(veri?.eski_pin || '').trim()
      const yeniPin = String(veri?.yeni_pin || '').trim()

      if (!verifyPin(eskiPin, getAdminPinHash())) {
        return { success: false, error: 'Eski Admin PIN hatalı.' }
      }
      if (!/^\d{4}$/.test(yeniPin) || isBootstrapPin(yeniPin) || yeniPin === eskiPin) {
        return { success: false, error: 'Yeni PIN 4 haneli olmalıdır.' }
      }

      setAdminPinHash(hashPin(yeniPin))
      requirePinChange(false)
      return { success: true }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  })
}
