/**
 * Zero-knowledge encryption utilities (client-side only).
 *
 * Uses the Web Crypto API to encrypt/decrypt card content with a
 * password-derived AES-256-GCM key. The password and derived key never
 * leave the browser — the server only stores the encrypted ciphertext.
 */

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 150_000;

/**
 * Derive an AES-256-GCM CryptoKey from a password + salt using PBKDF2.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password) as BufferSource,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Encrypt a plaintext string with a password.
 * Returns a base64 string: salt + iv + ciphertext, all concatenated.
 */
export async function encryptContent(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    enc.encode(plaintext) as BufferSource
  );
  const combined = new Uint8Array(salt.length + iv.length + cipherBuf.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(cipherBuf), salt.length + iv.length);
  return toBase64(combined);
}

/**
 * Decrypt a base64 string (salt + iv + ciphertext) with a password.
 * Returns the plaintext, or null if decryption fails (wrong password).
 */
export async function decryptContent(ciphertextB64: string, password: string): Promise<string | null> {
  try {
    const combined = fromBase64(ciphertextB64);
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const data = combined.slice(SALT_LENGTH + IV_LENGTH);
    const key = await deriveKey(password, salt);
    const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, data as BufferSource);
    return new TextDecoder().decode(plainBuf);
  } catch {
    return null;
  }
}

/**
 * Heuristic: detect whether a string looks like encrypted base64 content.
 * Encrypted content from encryptContent() is a long base64 string with no
 * spaces/newlines. Plaintext feedback typically has spaces or is short.
 */
export function looksEncrypted(s: string): boolean {
  if (!s) return false;
  // Base64 alphabet only (A-Za-z0-9+/=), no whitespace, reasonably long
  return /^[A-Za-z0-9+/]{40,}={0,2}$/.test(s);
}
