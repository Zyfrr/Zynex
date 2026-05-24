import argon2 from "argon2";

export async function hashSecret(value: string) {
  return argon2.hash(value);
}

export async function verifySecret(hash: string, value: string) {
  return argon2.verify(hash, value);
}
