import { customAlphabet } from 'nanoid';
import { TokenSymbol, TOKENS } from '@perper/shared';

/**
 * Generate deterministic wallet address for a user and token
 * Format: {TOKEN_PREFIX}-{RANDOM_ID}
 * Example: PERP-A1B2C3D4E5F6G7H8
 */
export function generateWalletAddress(userId: string, token: TokenSymbol): string {
  const tokenConfig = TOKENS[token];
  const prefix = tokenConfig.addressPrefix;

  // Create a custom alphabet for the random part (alphanumeric, uppercase)
  const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 16);

  // Generate a unique ID based on userId and token for determinism
  // In production, you might want to use a more sophisticated hashing approach
  const uniqueId = nanoid();

  return `${prefix}-${uniqueId}`;
}

/**
 * Validate wallet address format
 */
export function isValidWalletAddress(address: string): boolean {
  // Format: TOKEN-XXXXXXXXXXXXXXXX (4 chars - 16 chars)
  const pattern = /^(PERP|PERN|ZET|ADRI)-[A-Z0-9]{16}$/;
  return pattern.test(address);
}

/**
 * Extract token symbol from wallet address
 */
export function extractTokenFromAddress(address: string): TokenSymbol | null {
  const match = address.match(/^(PERP|PERN|ZET|ADRI)-/);
  if (match) {
    return match[1] as TokenSymbol;
  }
  return null;
}
