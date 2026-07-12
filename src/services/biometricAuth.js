// Thin wrapper around the WebAuthn platform-authenticator flow (Face ID,
// Touch ID, Windows Hello, Android fingerprint) for the local app-lock
// gate. This intentionally never talks to a server — there is no backend
// to verify the signature against, so a successful navigator.credentials
// call is treated as "the device's own biometric check passed" and used
// purely as a local unlock signal, the same trust model iOS/Android apps
// use for "Unlock with Face ID" on top of an already-authenticated account.
function bufferToBase64(buffer) {
  let binary = ""
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export async function isBiometricSupported() {
  if (typeof window === "undefined") return false
  if (!window.PublicKeyCredential) return false
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

// Registers a new platform-authenticator credential and returns its ID
// (base64) to persist. Throws if the user cancels or the device has no
// biometric/platform authenticator available.
export async function registerBiometricCredential(userLabel) {
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const userId = crypto.getRandomValues(new Uint8Array(16))

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Money Mind" },
      user: {
        id: userId,
        name: userLabel || "money-mind-user",
        displayName: userLabel || "Money Mind",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    },
  })

  if (!credential) throw new Error("Biometric registration was cancelled.")
  return bufferToBase64(credential.rawId)
}

// Prompts the platform authenticator (Face ID / fingerprint / Windows
// Hello) and resolves true only if the user verification succeeded.
export async function verifyBiometricCredential(credentialIdBase64) {
  const challenge = crypto.getRandomValues(new Uint8Array(32))

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [
        {
          id: base64ToBuffer(credentialIdBase64),
          type: "public-key",
        },
      ],
      userVerification: "required",
      timeout: 60000,
    },
  })

  return Boolean(assertion)
}
