// Local-only hashing for the app-lock PIN/password/pattern secrets. This
// protects against casually reading the raw secret out of localStorage —
// it is not a server-verified credential. The real account security
// boundary is Firebase Auth; this is a device-level "re-enter to keep
// using the app" gate on top of it, the same trust model most mobile
// banking apps use for their local PIN/biometric lock.
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

export function generateSalt() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return bufferToHex(bytes.buffer)
}

export async function hashSecret(secret, salt) {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${salt}:${secret}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return bufferToHex(digest)
}

export async function secretMatches(secret, salt, storedHash) {
  if (!storedHash) return false
  const candidate = await hashSecret(secret, salt)
  return candidate === storedHash
}
