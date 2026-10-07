import fs from 'node:fs'
import path from 'node:path'
// DB and restored paths are untrusted. Reject links at every component before unlink.
export function safePhotoPath(root: string, candidate: string): string {
  if (!candidate || !path.isAbsolute(candidate) || candidate.split(/[\\/]/).includes('..')) throw new Error('Fotoğraf yolu güvenli değil.')
  const base = path.resolve(root), target = path.resolve(candidate), relative = path.relative(base, target)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Fotoğraf yolu güvenli değil.')
  if (fs.lstatSync(base).isSymbolicLink() || fs.realpathSync(base).toLowerCase() !== base.toLowerCase()) throw new Error('Fotoğraf klasörü güvenli değil.')
  let current = base
  for (const component of relative.split(path.sep)) { current = path.join(current,component); if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Fotoğraf bağlantıları kullanılamaz.') }
  if (!fs.statSync(target).isFile() || fs.realpathSync(target).toLowerCase() !== target.toLowerCase()) throw new Error('Fotoğraf yolu güvenli değil.')
  return target
}
export function deletePhoto(root: string, candidate: string): void { fs.unlinkSync(safePhotoPath(root,candidate)) }
