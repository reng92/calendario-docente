/** SHA-256 esadecimale di una stringa (Web Crypto, disponibile in Node e nel proxy). */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export const AUTH_COOKIE = 'app-auth'
