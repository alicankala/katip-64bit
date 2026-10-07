import { describe,it,expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { sessionAllows, safeSettings, trustedFrame } from '../../electron/accessPolicy'
import { deletePhoto } from '../../electron/safePhotoPath'
import { PinAttempts } from '../../electron/pinAttempts'
import { hashPin, verifyPin, isBootstrapPin } from '../../electron/security'
import { escapeHtml, safeLanRequest, photoCookie, readPhotoCookie } from '../../electron/phoneHttpUtils'
import { updaterPublisherReady } from '../../electron/updaterTrust'
describe('security boundaries',()=>{
 it('denies sensitive calls before login and while credential replacement is pending',()=>{
  for(const channel of ['musterileri-getir','is-emri-sil','ayarlari-kaydet','yedekten-geri-yukle']) {expect(sessionAllows(channel,null)).toBe(false);expect(sessionAllows(channel,1,true)).toBe(false);expect(sessionAllows(channel,1)).toBe(true)}
  expect(sessionAllows('usta-pin-degistir',1,true)).toBe(true)
  expect(trustedFrame(1,1,true,'file:///C:/app/index.html','file:///C:/app/index.html')).toBe(true)
  expect(trustedFrame(1,1,false,'file:///C:/app/index.html','file:///C:/app/index.html')).toBe(false)
  expect(trustedFrame(1,1,true,'file:///C:/other.html','file:///C:/app/index.html')).toBe(false)
 })
 it('rejects generic security settings atomically',()=>{expect(safeSettings({theme:'dark'})).toBe(true);expect(safeSettings({theme:'dark',admin_pin_hash:'fixture'})).toBe(false);expect(safeSettings({pin_salt:'fixture'})).toBe(false)})
 it('deletes normal photo but cannot delete external files or junction targets',()=>{
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'katip-security-')),photos=path.join(base,'photos'),outside=path.join(base,'outside');fs.mkdirSync(photos);fs.mkdirSync(outside);const external=path.join(outside,'keep.jpg'),normal=path.join(photos,'photo.jpg');fs.writeFileSync(external,'keep');fs.writeFileSync(normal,'photo');
  try {expect(()=>deletePhoto(photos,external)).toThrow();expect(()=>deletePhoto(photos,photos+path.sep+'..'+path.sep+'outside'+path.sep+'keep.jpg')).toThrow();fs.symlinkSync(outside,path.join(photos,'linked'),'junction');expect(()=>deletePhoto(photos,path.join(photos,'linked','keep.jpg'))).toThrow();deletePhoto(photos,normal);expect(fs.existsSync(normal)).toBe(false);expect(fs.readFileSync(external,'utf8')).toBe('keep')}finally{fs.rmSync(base,{recursive:true,force:true})}
 })
 it('keeps stored XSS inert and rejects cross-origin LAN requests',()=>{expect(escapeHtml('<img src=x onerror=alert(1)>')).not.toContain('<img');expect(safeLanRequest('192.168.1.5:3000','http://evil.test',['192.168.1.5'],3000)).toBe(false);expect(safeLanRequest('evil.test:3000',undefined,['192.168.1.5'],3000)).toBe(false);expect(safeLanRequest('192.168.1.5:3000','http://192.168.1.5:3000',['192.168.1.5'],3000)).toBe(true);const token='a'.repeat(48);expect(photoCookie(token)).toContain('HttpOnly');expect(readPhotoCookie('katip_mobile='+token)).toBe(token)})
 it('backoff expires without locking users permanently; changed PIN validates',()=>{const limiter=new PinAttempts();for(let i=0;i<5;i++)limiter.result('fixture',false,1000);expect(()=>limiter.check('fixture',1001)).toThrow();expect(()=>limiter.check('fixture',31001)).not.toThrow();limiter.result('fixture',true,31001);expect(()=>limiter.check('fixture',31001)).not.toThrow();const pin=String(9000+Math.floor(Math.random()*900));expect(isBootstrapPin(pin)).toBe(false);expect(verifyPin(pin,hashPin(pin))).toBe(true);expect(updaterPublisherReady()).toBe(false)})
})
