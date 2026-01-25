import * as bcrypt from 'bcrypt';

/**
 * Password utility functions
 * Centralized password hashing and validation for reuse across modules
 */

const SALT_ROUNDS = 10;
const BCRYPT_PREFIX = '$2b$';

/**
 * Hash a plain text password
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare plain text password with hashed password
 * @param password - Plain text password to check
 * @param hashedPassword - Stored hashed password
 * @returns true if passwords match
 */
export async function validatePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Check if a string is already a bcrypt hash
 * @param password - String to check
 * @returns true if already hashed
 */
export function isPasswordHashed(password: string): boolean {
  return password.startsWith(BCRYPT_PREFIX);
}

/**
 * Hash password only if not already hashed
 * Useful for entity hooks where password might be unchanged
 * @param password - Password that may or may not be hashed
 * @returns Hashed password
 */
export async function ensurePasswordHashed(password: string): Promise<string> {
  if (isPasswordHashed(password)) {
    return password;
  }
  return hashPassword(password);
}
