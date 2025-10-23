# Perper Wallet - Quick Start Guide

Get Perper Wallet running in under 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- 8GB RAM minimum
- Ports 5173, 8080, and 8529 available

## Step-by-Step Setup

### 1. Install Dependencies (1 minute)

```bash
npm install
```

This installs all dependencies for the mono-repo (backend, frontend, shared packages).

### 2. Start Database (30 seconds)

```bash
npm run docker:up
```

This starts ArangoDB in a Docker container. Wait for it to be healthy.

### 3. Initialize Database (30 seconds)

```bash
npm run db:init
npm run db:seed
```

This creates collections, indexes, and seeds initial data including:
- Admin user: `admin@perper.digital` / `Admin123!`
- Initial token prices (PERP: €1.00, PERN: €0.50, ZET: €0.25, ADRI: €0.10)

### 4. Start Development Servers (10 seconds)

```bash
npm run dev
```

This starts both frontend and backend in watch mode.

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **ArangoDB UI**: http://localhost:8529
  - Username: `root`
  - Password: `changeme`

## First Steps

### As a User

1. Go to http://localhost:5173/register
2. Fill in registration form:
   - Email: `user@example.com`
   - Username: `testuser`
   - Full name: `Test User`
   - Password: `TestPass123!`
   - Accept ToS
3. Click "Register"
4. **Note**: You'll need admin approval before logging in

### As an Admin

1. Go to http://localhost:5173/login
2. Login with:
   - Email/Username: `admin@perper.digital`
   - Password: `Admin123!`
3. Click "Admin" in navigation
4. Approve pending users in "User Management"

### Test the Flow

1. **Login as admin** → Approve test user
2. **Login as test user** → View dashboard (will have 4 wallets with 0 balance)
3. **As admin** → Adjust user balance:
   - Navigate to Admin → Users
   - Find test user → Adjust Balance
   - Add 1000 PERP tokens with reason "Initial gift"
4. **As test user** → View updated balance on dashboard
5. **Register second user** → Approve as admin
6. **Send tokens** from first user to second user

## Common Commands

```bash
# Start everything
npm run dev

# Stop database
npm run docker:down

# View logs
npm run docker:logs

# Rebuild backend
npm run build:backend

# Rebuild frontend
npm run build:frontend

# Run type checking
npm run typecheck

# Reset database (WARNING: deletes all data)
npm run docker:down
docker volume rm perper_arangodb_data
npm run docker:up
npm run db:init
npm run db:seed
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :5173  # or :8080 or :8529

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check if ArangoDB is running
docker-compose ps

# Restart database
npm run docker:down
npm run docker:up

# Wait 10 seconds, then retry
npm run db:init
```

### Frontend Not Loading

```bash
# Clear cache and restart
rm -rf apps/frontend/node_modules/.vite
npm run dev
```

### "Cannot find module '@perper/shared'"

```bash
# Build shared package
npm run build --workspace=@perper/shared

# Restart dev servers
npm run dev
```

## What's Next?

- Explore the Admin dashboard to see statistics
- Try sending tokens between users
- Check transaction history
- View audit logs for admin actions
- Test email functionality (configure SMTP in .env)
- Integrate Stripe for purchases (see README.md)

## Development Tips

### Backend Hot Reload

Changes to backend TypeScript files auto-restart the server (using tsx watch).

### Frontend Hot Reload

Changes to frontend files auto-refresh the browser (using Vite HMR).

### Shared Package Changes

If you modify files in `packages/shared`, you need to:

```bash
npm run build --workspace=@perper/shared
```

Then restart dev servers to pick up changes.

### Database Inspection

Use ArangoDB web UI at http://localhost:8529 to:
- Browse collections
- Run AQL queries
- View indexes
- Monitor performance

Example queries:

```aql
// Get all users
FOR u IN users
  RETURN u

// Get user wallets
FOR w IN wallets
  FILTER w.userId == "123456"
  RETURN w

// Get recent transactions
FOR t IN transactions
  SORT t.createdAt DESC
  LIMIT 10
  RETURN t
```

## Production Checklist

Before deploying to production:

- [ ] Change all default passwords in .env
- [ ] Generate strong JWT secrets
- [ ] Configure real SMTP server
- [ ] Set up Stripe production keys
- [ ] Configure proper CORS origins
- [ ] Set NODE_ENV=production
- [ ] Use proper SSL certificates
- [ ] Set up monitoring and logging
- [ ] Configure backups for ArangoDB
- [ ] Review and restrict ADMIN_IP_ALLOWLIST
- [ ] Set up CI/CD pipeline
- [ ] Enable rate limiting in production mode
- [ ] Review all security settings

## Need Help?

- Check the full README.md for detailed documentation
- Review logs: `npm run docker:logs`
- Check backend logs in `apps/backend/logs/`
- Ensure all environment variables are set correctly

## Success!

You should now have a fully functional Perper Wallet running locally. Happy coding!
