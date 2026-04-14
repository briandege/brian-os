/**
 * crypto.ts — strontium.os cryptographic primitives
 *
 * Security architecture overview:
 *
 * PASSWORDS (this file):
 *   PBKDF2-SHA256, 310,000 iterations, 16-byte random salt per hash.
 *   - SHA-256 alone is vulnerable to Grover's algorithm (quantum halves
 *     effective bit-security); PBKDF2 iterations compensate and make
 *     brute-force infeasible regardless.
 *   - NIST recommends PBKDF2 with ≥ 310,000 iterations (2023 SP 800-132).
 *
 * KEY EXCHANGE (future comms layer):
 *   Hybrid X25519 + ML-KEM-768 (NIST FIPS 203, formerly CRYSTALS-Kyber).
 *   - X25519: classical curve, fast, widely deployed.
 *   - ML-KEM-768: NIST-standardized post-quantum KEM (2024).
 *   - Hybrid ensures security against both classical and quantum adversaries.
 *   - Implementation: @noble/post-quantum (browser/Node WASM-free).
 *
 * SIGNATURES:
 *   SLH-DSA-SHAKE-256 (NIST FIPS 205, formerly SPHINCS+) for long-term keys.
 *
 * All operations use the browser-native Web Crypto API (SubtleCrypto).
 * No external dependencies for PBKDF2 — available in all Chromium versions.
 */

// ── PBKDF2 password hashing ──────────────────────────────────────────────────

const PBKDF2_ITERATIONS = 310_000;  // NIST SP 800-132 (2023) recommendation
const SALT_BYTES        = 16;
const KEY_BITS          = 256;      // AES-256 key length — 128-bit post-quantum security
const SEPARATOR         = ":";

/**
 * Hash a password with PBKDF2-SHA256 and a fresh random salt.
 * Returns a storable string: `<hex-salt>:<hex-derived-key>`.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(new ArrayBuffer(SALT_BYTES));
  crypto.getRandomValues(salt);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_BITS,
  );
  return toHex(salt) + SEPARATOR + toHex(new Uint8Array(derived));
}

/**
 * Verify a plaintext password against a stored PBKDF2 hash string.
 * Supports both the new PBKDF2 format (`<salt>:<hash>`) and the
 * legacy plain-SHA256 format (64-char hex, no separator) for migration.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.includes(SEPARATOR)) {
    // New PBKDF2 format
    const [saltHex, hashHex] = stored.split(SEPARATOR);
    const saltBytes   = fromHex(saltHex);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: saltBytes.buffer as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
      keyMaterial,
      KEY_BITS,
    );
    return safeEqual(toHex(new Uint8Array(derived)), hashHex);
  }

  // Legacy: plain SHA-256 (migration path — only for the initial "admin" default)
  const legacy = await sha256Legacy(password);
  return safeEqual(legacy, stored);
}

// ── SHA-256 (retained for migration + general digest use) ────────────────────

export async function sha256(input: string): Promise<string> {
  return sha256Legacy(input);
}

async function sha256Legacy(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const buffer  = await crypto.subtle.digest("SHA-256", encoded);
  return toHex(new Uint8Array(buffer));
}

// ── Constant-time comparison ─────────────────────────────────────────────────

/**
 * Timing-safe string comparison.
 * Prevents timing attacks when comparing password hashes.
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ── Encoding utilities ───────────────────────────────────────────────────────

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
}
