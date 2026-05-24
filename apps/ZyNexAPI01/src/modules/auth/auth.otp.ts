import { hashSecret, verifySecret } from "./auth.password";

export function generateNumericCode(digits: number) {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

export async function hashOtp(code: string) {
  return hashSecret(code);
}

export async function verifyOtp(hash: string, code: string) {
  return verifySecret(hash, code);
}
