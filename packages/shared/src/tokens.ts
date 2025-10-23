/**
 * Token definitions for Perper Wallet
 * These are centralized, non-blockchain tokens
 */

export enum TokenSymbol {
  PERP = 'PERP',
  PERN = 'PERN',
  ZET = 'ZET',
  ADRI = 'ADRI'
}

export interface TokenConfig {
  symbol: TokenSymbol;
  name: string;
  primaryColor: string;
  accentColor: string;
  logo?: string;
  addressPrefix: string;
}

export const TOKENS: Record<TokenSymbol, TokenConfig> = {
  [TokenSymbol.PERP]: {
    symbol: TokenSymbol.PERP,
    name: 'Perper',
    primaryColor: '#000000',
    accentColor: '#F59E0B',
    logo: 'https://www.perper.digital/images/perper-Logo.png',
    addressPrefix: 'PERP'
  },
  [TokenSymbol.PERN]: {
    symbol: TokenSymbol.PERN,
    name: 'Perun',
    primaryColor: '#000000',
    accentColor: '#C0C0C0',
    addressPrefix: 'PERN'
  },
  [TokenSymbol.ZET]: {
    symbol: TokenSymbol.ZET,
    name: 'Zeta',
    primaryColor: '#000000',
    accentColor: '#3B82F6',
    addressPrefix: 'ZET'
  },
  [TokenSymbol.ADRI]: {
    symbol: TokenSymbol.ADRI,
    name: 'Adria',
    primaryColor: '#000000',
    accentColor: '#14B8A6',
    addressPrefix: 'ADRI'
  }
};

export const ALL_TOKENS = Object.values(TokenSymbol);
