// Only non-sensitive bootstrap and window operations are public.
export const PUBLIC_CHANNELS = new Set(['ustalari-getir','usta-giris-yap','usta-cikis-yap','admin-pin-dogrula','ayarlari-getir','pencere-kucult','pencere-buyut-kucult','pencere-kapat','pencere-kapat-zorla','pencere-durum-getir','guncelleme-durum-getir'])
export function sessionAllows(channel: string, session: number | 'admin' | null, pendingChange = false): boolean {
  if (pendingChange) return ['usta-cikis-yap','usta-pin-degistir','admin-pin-degistir', ...PUBLIC_CHANNELS].includes(channel)
  return session !== null || PUBLIC_CHANNELS.has(channel)
}
export function trustedFrame(senderId: number, mainId: number | undefined, mainFrame: boolean, url: string, expected: string): boolean {
  try { const actual = new URL(url); const trusted = new URL(expected); return senderId === mainId && mainFrame && actual.origin === trusted.origin && actual.pathname === trusted.pathname && actual.search === trusted.search } catch { return false }
}
export const SETTINGS_KEYS = new Set(['theme','list_density','work_orders_default_filter','show_critical_stock_warnings','show_long_open_workorder_warnings','long_open_workorder_days','phone_server_auto_start','default_payment_method','ask_payment_on_completion','warn_unpaid_completion','show_payment_summary_on_receipt','automatic_backup_enabled','backup_on_exit','backup_retention_count','weather_city','setup_wizard_done'])
export function safeSettings(value: unknown): value is Record<string, string | number | boolean> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.entries(value).every(([key,v]) => SETTINGS_KEYS.has(key) && ['string','number','boolean'].includes(typeof v) && String(v).length <= 500)
}
