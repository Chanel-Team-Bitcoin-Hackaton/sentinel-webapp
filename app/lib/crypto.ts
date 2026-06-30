/**
 * Sentinel Cryptography Module
 * Native Web Crypto API client-side encryption and decryption.
 * Uses PBKDF2 (100,000 iterations, SHA-256) for key derivation
 * and AES-256-GCM for symmetric encryption/decryption.
 */

// Helper to convert ArrayBuffer to Hex string
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper to convert Hex string to ArrayBuffer
export function hexToBuffer(hex: string): ArrayBuffer {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

// Helper to derive an AES-256-GCM key from a secret passphrase and a salt
async function deriveKey(secretWord: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const rawKeyMaterial = encoder.encode(secretWord);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    rawKeyMaterial,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using a secret passphrase.
 * Generates a random 16-byte salt and a random 12-byte IV.
 */
export async function encryptSecret(
  plaintext: string,
  secretWord: string
): Promise<{ encryptedBlob: string; ivHex: string; saltHex: string }> {
  if (typeof window === 'undefined') {
    throw new Error('Web Crypto API is only available in the browser');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random salt (16 bytes) and IV (12 bytes for AES-GCM)
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Derive key using PBKDF2
  const key = await deriveKey(secretWord, salt);

  // Encrypt using AES-GCM
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    data
  );

  return {
    encryptedBlob: bufferToHex(ciphertextBuffer),
    ivHex: bufferToHex(iv),
    saltHex: bufferToHex(salt),
  };
}

/**
 * Decrypts an encrypted hex blob using a secret passphrase, iv, and salt.
 */
export async function decryptSecret(
  encryptedBlob: string,
  ivHex: string,
  saltHex: string,
  secretWord: string
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Web Crypto API is only available in the browser');
  }

  const ciphertext = hexToBuffer(encryptedBlob);
  const iv = new Uint8Array(hexToBuffer(ivHex));
  const salt = new Uint8Array(hexToBuffer(saltHex));

  // Derive key using PBKDF2
  const key = await deriveKey(secretWord, salt);

  try {
    // Decrypt using AES-GCM
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error('Decryption failed. Please check your secret word.');
  }
}

/**
 * Validates the strength of a beneficiary secret passphrase
 * Rules: min 10 chars, at least one letter, at least one number
 */
export function validateSecretStrength(secret: string): {
  isValid: boolean;
  message?: string;
  score: number; // 0 to 4
} {
  if (secret.length < 10) {
    return {
      isValid: false,
      message: 'Le mot secret doit comporter au moins 10 caractères.',
      score: 1,
    };
  }

  const hasLetter = /[a-zA-Z]/.test(secret);
  const hasDigit = /[0-9]/.test(secret);

  if (!hasLetter || !hasDigit) {
    return {
      isValid: false,
      message: 'Le mot secret doit contenir au moins une lettre et un chiffre.',
      score: 2,
    };
  }

  // Calculate score based on complexity
  let score = 2;
  const hasSpecial = /[^a-zA-Z0-9]/.test(secret);
  const isVeryLong = secret.length >= 14;

  if (hasSpecial) score += 1;
  if (isVeryLong) score += 1;

  // Simple check for common patterns/words (could be expanded)
  const forbiddenWords = ['password', '1234567890', 'azertyuiop', 'adjovikoko'];
  if (forbiddenWords.some(w => secret.toLowerCase().includes(w))) {
    return {
      isValid: false,
      message: 'Le mot secret contient des termes trop simples ou interdits.',
      score: 1,
    };
  }

  return {
    isValid: true,
    score: score,
  };
}
