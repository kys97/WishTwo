import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_COUPLE_CODE_KEY = '@wish-u/pending-couple-code';
const COUPLE_CODE_PATTERN = /^WISH-[A-Z0-9]{8}$/;

export function normalizeCoupleCode(value: string) {
  return value.trim().toUpperCase();
}

export function isValidCoupleCode(value: string) {
  return COUPLE_CODE_PATTERN.test(normalizeCoupleCode(value));
}

export async function loadPendingCoupleCode() {
  const stored = await AsyncStorage.getItem(PENDING_COUPLE_CODE_KEY);
  if (!stored || !isValidCoupleCode(stored)) {
    if (stored) await AsyncStorage.removeItem(PENDING_COUPLE_CODE_KEY);
    return null;
  }
  return normalizeCoupleCode(stored);
}

export async function storePendingCoupleCode(value: string) {
  const code = normalizeCoupleCode(value);
  if (!isValidCoupleCode(code)) throw new Error('올바르지 않은 연결 링크입니다.');
  await AsyncStorage.setItem(PENDING_COUPLE_CODE_KEY, code);
  return code;
}

export async function removePendingCoupleCode() {
  await AsyncStorage.removeItem(PENDING_COUPLE_CODE_KEY);
}
