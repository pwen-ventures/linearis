import { createCipheriv, createDecipheriv, createHash, randomBytes, } from "node:crypto";
const VERSION_PREFIX = "v1";
const ALGORITHM = "aes-256-cbc";
const KEY_MATERIAL = "linearis-v1-token-encryption-key";
function deriveKey() {
    return createHash("sha256").update(KEY_MATERIAL).digest();
}
export function encryptToken(token) {
    const key = deriveKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(token, "utf8"),
        cipher.final(),
    ]);
    return `${VERSION_PREFIX}:${iv.toString("hex")}:${encrypted.toString("hex")}`;
}
export function decryptToken(encrypted) {
    const parts = encrypted.split(":");
    if (parts.length === 2 && parts[0] && parts[1]) {
        return decryptV1(parts[0], parts[1]);
    }
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        if (parts[0] !== VERSION_PREFIX) {
            throw new Error(`Unsupported token encryption version: ${parts[0]}`);
        }
        return decryptV1(parts[1], parts[2]);
    }
    throw new Error("Invalid encrypted token format");
}
function decryptV1(ivHex, ciphertextHex) {
    const key = deriveKey();
    const iv = Buffer.from(ivHex, "hex");
    if (iv.length !== 16) {
        throw new Error("Invalid encrypted token: corrupted IV");
    }
    const ciphertext = Buffer.from(ciphertextHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);
    return decrypted.toString("utf8");
}
