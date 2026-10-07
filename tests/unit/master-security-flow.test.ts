import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hashPin } from '../../electron/security'
import { getActiveMasterSession, clearActiveMasterSession, isPinChangeRequired } from '../../electron/session'
import { sessionAllows } from '../../electron/accessPolicy'
const fixture = vi.hoisted(() => ({ row: { id: 1, name: 'Test', pin: '', is_active: 1 } }))
vi.mock('../../electron/database.js', () => ({ dbPath: 'fixture', default: { prepare: (sql: string) => ({ get: () => fixture.row, run: (pin: string) => { if(sql.includes('UPDATE masters SET pin') || sql.includes('SET pin = ?')) fixture.row.pin = pin }, all: () => [] }) } }))
import { registerMasterHandlers } from '../../electron/controllers/masterController'
const handlers = new Map<string, (...args: any[]) => any>()
registerMasterHandlers((name, fn) => handlers.set(name, fn))
beforeEach(() => { clearActiveMasterSession(); fixture.row.pin = hashPin(String(1).repeat(4)) })
describe('production master credential replacement handlers', () => {
 it('requires existing-user replacement before any data access, and accepts the replacement', () => {
  const original = String(1).repeat(4), replacement = String(9000+Math.floor(Math.random()*900))
  const login = handlers.get('usta-giris-yap')!(null,{ master_id:1,pin:original })
  expect(login.success).toBe(true); expect(login.requiresPinChange).toBe(true)
  expect(sessionAllows('musterileri-getir',getActiveMasterSession(),isPinChangeRequired())).toBe(false)
  expect(handlers.get('usta-pin-degistir')!(null,{master_id:1,eski_pin:original,yeni_pin:replacement}).success).toBe(true)
  expect(isPinChangeRequired()).toBe(false)
  clearActiveMasterSession()
  expect(handlers.get('usta-giris-yap')!(null,{master_id:1,pin:replacement}).requiresPinChange).toBe(false)
 })
 it('cannot change another master PIN or replace it with a bootstrap credential', () => {
  const original = String(1).repeat(4)
  expect(handlers.get('usta-pin-degistir')!(null,{master_id:1,eski_pin:original,yeni_pin:'9876'}).success).toBe(false)
  handlers.get('usta-giris-yap')!(null,{master_id:1,pin:original})
  expect(handlers.get('usta-pin-degistir')!(null,{master_id:1,eski_pin:original,yeni_pin:String(2).repeat(4)}).success).toBe(false)
  expect(isPinChangeRequired()).toBe(true)
 })
})
