# Perper Wallet

A centralized, non-blockchain multi-token wallet system built with modern web technologies.

## Overview

Perper Wallet is a secure, centralized platform for managing four digital tokens: Perper (PERP), Perun (PERN), Zeta (ZET), and Adria (ADRI). Users can buy, send, and track their tokens through an intuitive web interface, while administrators manage user approvals, token supply, and pricing.

**Important Legal Notice:** This is a closed, centralized token system, not cryptocurrency or e-money. No withdrawals or external transfers are supported. Token purchases are non-refundable except where required by law.

## Features

### User Features
- **Registration & Authentication**: Secure signup with email verification and admin approval
- **Multi-Token Wallet**: Manage balances across four different tokens
- **Send Tokens**: Transfer tokens to other users by username, email, or wallet address
- **Transaction History**: View detailed transaction logs with filtering
- **Buy Tokens**: Purchase tokens via Stripe (cards, Apple Pay, Google Pay, SEPA) or bank transfer
- **Dashboard**: Real-time portfolio value and recent activity

### Admin Features
- **User Management**: Approve, reject, suspend, or activate user accounts
- **Token Management**: Mint new tokens and set pricing
- **Balance Adjustments**: Manually adjust user balances with audit trails
- **Transaction Monitoring**: View all platform transactions
- **Analytics Dashboard**: User stats, token supply, and activity metrics
- **Audit Logs**: Complete history of all admin actions

### Security Features
- JWT-based authentication with httpOnly cookies
- CSRF protection
- Rate limiting on sensitive endpoints
- IP allowlist for admin access
- Bcrypt password hashing (cost 12)
- Atomic transaction processing with ArangoDB
- Idempotency keys for duplicate prevention
- Comprehensive audit logging

## Tech Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: ArangoDB 3.11
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod schemas
- **Security**: Helmet, CORS, Rate limiting
- **Email**: Nodemailer
- **Payments**: Stripe SDK (not yet integrated in this delivery)
- **Logging**: Winston

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: ArangoDB in Docker
- **Development**: Hot reload for both frontend and backend

## Project Structure

```
perper-wallet/
├── apps/
│   ├── backend/              # Express API server
│   │   ├── src/
│   │   │   ├── config/       # Configuration
│   │   │   ├── db/           # Database connection & repositories
│   │   │   ├── middleware/   # Auth, validation, error handling
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── services/     # Business logic
│   │   │   ├── utils/        # Utilities (JWT, email, etc.)
│   │   │   ├── scripts/      # DB init & seed scripts
│   │   │   └── server.ts     # Entry point
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── frontend/             # React SPA
│       ├── src/
│       │   ├── components/   # Reusable UI components
│       │   ├── contexts/     # React contexts (Auth)
│       │   ├── pages/        # Route pages
│       │   ├── services/     # API client
│       │   ├── App.tsx       # Main app component
│       │   └── main.tsx      # Entry point
│       ├── index.html
│       └── package.json
│
├── packages/
│   └── shared/               # Shared types & validation
│       ├── src/
│       │   ├── tokens.ts     # Token definitions
│       │   ├── types.ts      # TypeScript interfaces
│       │   └── validation.ts # Zod schemas
│       └── package.json
│
├── docker-compose.yml        # Docker services
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Perun
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start ArangoDB**
   ```bash
   npm run docker:up
   ```

5. **Initialize database**
   ```bash
   npm run db:init
   npm run db:seed
   ```

   Default admin credentials after seeding:
   - Email: `admin@perper.digital`
   - Password: `Admin123!`

6. **Start development servers**
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - ArangoDB Web UI: http://localhost:8529

### Build for Production

```bash
# Build all packages
npm run build

# Start production server
npm run start
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Wallet Endpoints

- `GET /api/wallets` - Get user wallets with balances
- `POST /api/wallets/send` - Send tokens to another user
- `GET /api/wallets/transactions` - Get transaction history
- `GET /api/wallets/transactions/:id` - Get transaction details

### Pricing Endpoints

- `GET /api/pricing` - Get current token prices

### Admin Endpoints

- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - List users with filters
- `POST /api/admin/users/:id/approve` - Approve user
- `POST /api/admin/users/:id/reject` - Reject user
- `POST /api/admin/users/:id/suspend` - Suspend user
- `POST /api/admin/users/:id/activate` - Activate user
- `POST /api/admin/users/:id/adjust-balance` - Adjust user balance
- `GET /api/admin/transactions` - Get all transactions
- `POST /api/admin/tokens/mint` - Mint new tokens
- `POST /api/admin/tokens/price` - Set token price
- `GET /api/admin/audit` - Get audit logs

## Database Schema

### Collections

- **users**: User accounts with authentication data
- **wallets**: Token wallets (one per user per token)
- **transactions**: All token movements (send, receive, purchase, adjustment, mint)
- **purchases**: Purchase records with payment provider info
- **priceHistory**: Token price changes over time
- **supplyEvents**: Token minting/burning events
- **auditLogs**: Admin action logs

### Key Indexes

- Unique indexes on: email, username, wallet addresses, idempotency keys
- Query indexes on: status, dates, transaction types, tokens

## Security Considerations

1. **Authentication**: JWT tokens in httpOnly secure cookies with refresh rotation
2. **Authorization**: Role-based access control (user, admin)
3. **Rate Limiting**: Applied to auth and sensitive endpoints
4. **CSRF Protection**: Token-based protection on state-changing operations
5. **Input Validation**: Zod schemas validate all inputs
6. **Admin Access**: IP allowlist (configurable in .env)
7. **Audit Trail**: All admin actions logged
8. **Atomic Transactions**: ArangoDB transactions prevent race conditions
9. **Idempotency**: Keys prevent duplicate transactions

## Environment Variables

See `.env.example` for all configuration options. Key variables:

- `ARANGO_URL`, `ARANGO_DB`, `ARANGO_USER`, `ARANGO_PASSWORD`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (not yet integrated)
- `SMTP_*` - Email service configuration
- `ADMIN_IP_ALLOWLIST` - Comma-separated IPs for admin access

## Token Definitions

| Token | Symbol | Primary Color | Accent Color | Address Prefix |
|-------|--------|---------------|--------------|----------------|
| Perper | PERP | #000000 | #F59E0B (Gold) | PERP- |
| Perun | PERN | #000000 | #C0C0C0 (Silver) | PERN- |
| Zeta | ZET | #000000 | #3B82F6 (Blue) | ZET- |
| Adria | ADRI | #000000 | #14B8A6 (Teal) | ADRI- |

Wallet addresses follow the format: `{PREFIX}-{16-char-ID}` (e.g., `PERP-A1B2C3D4E5F6G7H8`)

## Troubleshooting

### Database Connection Issues

```bash
# Check if ArangoDB is running
docker-compose ps

# View ArangoDB logs
docker-compose logs arangodb

# Restart ArangoDB
npm run docker:down
npm run docker:up
```

### Frontend Build Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf apps/frontend/node_modules/.vite
```

## Development Notes

### Testing

Tests are planned but not yet implemented. To add tests:

```bash
# Backend tests with Jest
npm run test --workspace=apps/backend

# Frontend tests would use Vitest
npm run test --workspace=apps/frontend
```

### Stripe Integration

The Stripe payment integration is defined in the architecture but not fully implemented in this delivery. To complete:

1. Implement purchase intent endpoint in backend
2. Add Stripe Elements to frontend Buy page
3. Implement webhook handler for payment confirmation
4. Test with Stripe test mode

### Email Service

Configure SMTP settings in `.env` for email notifications to work. For development, consider using a service like Mailtrap or disable email sending.

## License

Proprietary - All rights reserved

## Support

For issues and questions, please contact the development team or create an issue in the repository.
