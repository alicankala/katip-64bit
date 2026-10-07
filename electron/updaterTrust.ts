import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
export const TRUSTED_WINDOWS_PUBLISHERS: readonly string[] = []
export function updaterPublisherReady(publishers: readonly string[] = TRUSTED_WINDOWS_PUBLISHERS): boolean { return publishers.length > 0 && publishers.every(name => !!name.trim()) }
export async function verifyInstallerPublisher(file: string | null | undefined): Promise<boolean> {
  if (process.platform !== 'win32' || !file || !updaterPublisherReady()) return false
  try {
    // No path interpolation in shell code; environment supplies the literal filename.
    const {stdout} = await promisify(execFile)('powershell.exe', ['-NoProfile','-NonInteractive','-Command', '$s=Get-AuthenticodeSignature -LiteralPath $env:KATIP_VERIFY_INSTALLER; if($s.Status -eq "Valid" -and $s.SignerCertificate) { $s.SignerCertificate.Subject }'], {windowsHide:true, timeout:30000, env:{...process.env,KATIP_VERIFY_INSTALLER:file}})
    return TRUSTED_WINDOWS_PUBLISHERS.includes(stdout.trim())
  } catch { return false }
}
