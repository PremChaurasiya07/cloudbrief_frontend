import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'user_data';
const ENCRYPTION_SECRET = import.meta.env.VITE_ENCRYPTION_KEY;

if (!ENCRYPTION_SECRET || ENCRYPTION_SECRET.length < 32) {
  console.error('❌ VITE_ENCRYPTION_KEY must be at least 32 characters long');
}

const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_SECRET);

export const saveEncryptedUserId = (userId: string, ttlMinutes = 60) => {
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
  const payload = JSON.stringify({ userId, expiresAt });

  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(payload, key, { iv }).ciphertext;

  const combined = iv.concat(encrypted).toString(CryptoJS.enc.Base64);
  sessionStorage.setItem(STORAGE_KEY, combined);
};

export const getDecryptedUserId = (): string | null => {
  const combined = sessionStorage.getItem(STORAGE_KEY);
  if (!combined) return null;

  try {
    const combinedWordArray = CryptoJS.enc.Base64.parse(combined);

    const iv = CryptoJS.lib.WordArray.create(
      combinedWordArray.words.slice(0, 4),
      16
    );
    const ciphertext = CryptoJS.lib.WordArray.create(
      combinedWordArray.words.slice(4),
      combinedWordArray.sigBytes - 16
    );

    const decrypted = CryptoJS.AES.decrypt({ ciphertext }, key, { iv });
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedText) throw new Error('Failed to decrypt');

    const parsed = JSON.parse(decryptedText);
    if (typeof parsed !== 'object' || !parsed.userId || !parsed.expiresAt) {
      throw new Error('Invalid payload format');
    }

    if (Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed.userId;
  } catch (error) {
    console.warn('Decryption error:', error);
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const clearUserData = () => sessionStorage.removeItem(STORAGE_KEY);
