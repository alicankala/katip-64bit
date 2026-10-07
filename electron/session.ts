// Aktif oturum (giriş yapmış usta/admin) main process içinde tutulur.
// Renderer'dan gelen active_master_id artık "kim yaptı" bilgisi için doğrudan güvenilmez;
// IPC handler'ları bu modülden okuyarak login akışında main process'in onayladığı kimliği kullanır.

type MasterSession = number | 'admin' | null

let activeMasterId: MasterSession = null
let pinChangeRequired = false
export function isPinChangeRequired(): boolean { return pinChangeRequired }
export function requirePinChange(value: boolean): void { pinChangeRequired = value }

export function setActiveMasterSession(id: MasterSession): void {
  activeMasterId = id
  pinChangeRequired = false
}

export function clearActiveMasterSession(): void {
  activeMasterId = null
  pinChangeRequired = false
}

export function getActiveMasterSession(): MasterSession {
  return activeMasterId
}

// work_orders / stock_movements gibi "kim yaptı" alanlarına yazılacak, DB'ye uygun değeri döner.
// Admin modunda veya oturum yokken null döner (mevcut davranışla aynı).
export function resolveActiveMasterId(): number | null {
  return typeof activeMasterId === 'number' && Number.isFinite(activeMasterId) && activeMasterId > 0
    ? activeMasterId
    : null
}
