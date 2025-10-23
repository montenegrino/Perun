import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

interface Config {
  nodeEnv: string;
  port: number;
  arango: {
    url: string;
    database: string;
    user: string;
    password: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  csrf: {
    secret: string;
  };
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
  };
  paypal: {
    clientId: string;
    clientSecret: string;
    mode: 'sandbox' | 'live';
  };
  urls: {
    publicBase: string;
    frontend: string;
  };
  email: {
    from: string;
    smtp: {
      host: string;
      port: number;
      user: string;
      pass: string;
      secure: boolean;
    };
  };
  admin: {
    ipAllowlist: string[];
  };
  bank: {
    iban: string;
    bic: string;
    beneficiary: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8080', 10),
  arango: {
    url: process.env.ARANGO_URL || 'http://localhost:8529',
    database: process.env.ARANGO_DB || 'perper',
    user: process.env.ARANGO_USER || 'root',
    password: process.env.ARANGO_PASSWORD || 'changeme'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'superlongrandomsecretkeythatshouldbereplacedwithsecureone',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'anotherlongrandomsecretforrefreshtoken',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  csrf: {
    secret: process.env.CSRF_SECRET || 'anothersecretforcrsftokens'
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    mode: (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox'
  },
  urls: {
    publicBase: process.env.PUBLIC_BASE_URL || 'http://localhost:8080',
    frontend: process.env.FRONTEND_URL || 'http://localhost:5173'
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@perper.digital',
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      secure: process.env.SMTP_SECURE === 'true'
    }
  },
  admin: {
    ipAllowlist: process.env.ADMIN_IP_ALLOWLIST?.split(',') || ['127.0.0.1', '::1']
  },
  bank: {
    iban: process.env.BANK_IBAN || 'DE00 0000 0000 0000 0000 00',
    bic: process.env.BANK_BIC || 'ABCDEFGH',
    beneficiary: process.env.BANK_BENEFICIARY || 'Digital Perper d.o.o.'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  }
};

export default config;
