# SaaS API Boilerplate - Complete Setup Guide

This guide will walk you through setting up both the backend and frontend of the SaaS API Boilerplate.

## Prerequisites

### Required Software
1. **Node.js 18+** and npm
   - Check: `node --version` (should be 18+)
   - Install from: https://nodejs.org/

2. **PostgreSQL 14+**
   - Install on Mac: `brew install postgresql@14`
   - Start service: `brew services start postgresql@14`
   - Create user: `createuser -s postgres` (if needed)

3. **Git**
   - Check: `git --version`
   - Install on Mac: `brew install git`

### Optional (for Stripe integration)
4. **Stripe CLI** (for webhook testing)
   - Install: `brew install stripe/stripe-cli/stripe`
   - Login: `stripe login`

## Backend Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables

The `.env` file has been created with development defaults. Update these values:

```bash
# Edit backend/.env
nano .env
```

**Required changes:**
- `DATABASE_URL`: Update with your PostgreSQL credentials if different
- `STRIPE_SECRET_KEY`: Add your Stripe test key from https://dashboard.stripe.com/test/apikeys
- `STRIPE_WEBHOOK_SECRET`: Will be generated in Step 5

### Step 3: Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE saas_api_db;

# Exit
\q
```

### Step 4: Run Prisma Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

This will:
- Generate the Prisma Client
- Create all database tables
- Set up indexes and relationships

### Step 5: (Optional) Setup Stripe Webhooks

For local development:

```bash
# In a separate terminal
stripe listen --forward-to localhost:4000/api/v1/subscriptions/webhook
```

Copy the webhook secret (starts with `whsec_`) and update `.env`:
```
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Step 6: Start Backend Server

```bash
npm run start:dev
```

The API will be available at:
- **API**: http://localhost:4000/api/v1
- **Swagger Docs**: http://localhost:4000/api/docs

## Frontend Setup

### Step 1: Install Dependencies

```bash
cd ../frontend
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env.local
```

The default configuration should work:
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### Step 3: Start Frontend Server

```bash
npm run dev
```

The app will be available at: http://localhost:3000

## Testing the Application

### 1. Register a New User

1. Go to http://localhost:3000
2. Click "Get Started" or "Sign Up"
3. Fill in your details:
   - Name: John Doe
   - Email: john@example.com
   - Password: password123
4. Click "Create account"

### 2. Create API Key

1. After login, go to "API Keys" in the navigation
2. Click "Create New Key"
3. Optionally give it a name (e.g., "Test Key")
4. Copy the generated API key (starts with `sk_`)

### 3. Test API with cURL

```bash
# Replace YOUR_API_KEY with the key you generated
export API_KEY="sk_your_generated_key_here"

# Get current user info
curl -H "X-API-Key: $API_KEY" http://localhost:4000/api/v1/users/me
```

### 4. View Dashboard

1. Go to the Dashboard page
2. You should see:
   - Stats cards (requests, API keys, etc.)
   - Subscription info (FREE plan by default)
   - Quick action buttons

### 5. Create Organization (Optional)

```bash
# Using JWT token (get from localStorage in browser)
curl -X POST http://localhost:4000/api/v1/organizations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Company",
    "slug": "my-company"
  }'
```

## Stripe Integration (Optional)

### Create Test Products

1. Go to https://dashboard.stripe.com/test/products
2. Create products with the following Price IDs:
   - `price_starter` - $29/month
   - `price_professional` - $99/month
   - `price_enterprise` - Custom pricing

3. Update `backend/src/subscriptions/subscriptions.service.ts` with your actual price IDs

### Test Checkout Flow

1. Go to Settings page in the frontend
2. Click "Upgrade Plan"
3. Select a plan
4. Complete checkout with Stripe test card: `4242 4242 4242 4242`

## Database Management

### View Database with Prisma Studio

```bash
cd backend
npm run prisma:studio
```

This opens a GUI at http://localhost:5555 to view and edit data.

### Reset Database

```bash
cd backend
npm run prisma:migrate reset
```

**Warning**: This will delete all data!

## Troubleshooting

### Port Already in Use

If ports 3000 or 4000 are in use:

**Backend:**
```bash
# Change PORT in backend/.env
PORT=4001
```

**Frontend:**
```bash
# Start on different port
PORT=3001 npm run dev
```

### Database Connection Error

1. Check PostgreSQL is running:
   ```bash
   brew services list
   ```

2. Verify credentials:
   ```bash
   psql -U postgres -d saas_api_db
   ```

3. Update `DATABASE_URL` in `backend/.env`

### Prisma Migration Errors

```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev
```

### CORS Errors

Make sure `FRONTEND_URL` in `backend/.env` matches your frontend URL.

## Production Deployment

### Backend (e.g., Railway, Render, Heroku)

1. Set environment variables in your hosting platform
2. Run migrations: `npm run prisma:migrate deploy`
3. Build: `npm run build`
4. Start: `npm run start:prod`

### Frontend (e.g., Vercel, Netlify)

1. Set `NEXT_PUBLIC_API_URL` to your production API URL
2. Build command: `npm run build`
3. Start command: `npm run start`

## Next Steps

### Development
- [ ] Add more API endpoints
- [ ] Implement usage tracking middleware
- [ ] Add email notifications
- [ ] Create admin panel

### Production
- [ ] Set up production database
- [ ] Configure production Stripe keys
- [ ] Set up domain and SSL
- [ ] Configure monitoring (Sentry, DataDog)
- [ ] Set up CI/CD pipeline

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:4000/api/docs

This provides interactive API documentation with the ability to test endpoints directly.

## Project Structure

```
saas-api-boilerplate/
├── backend/           # NestJS API
│   ├── src/
│   │   ├── auth/     # Authentication
│   │   ├── users/    # User management
│   │   ├── organizations/  # Multi-tenancy
│   │   └── subscriptions/  # Stripe integration
│   └── prisma/       # Database schema
├── frontend/         # Next.js app
│   └── src/
│       ├── components/  # React components
│       ├── pages/      # Next.js pages
│       ├── lib/        # API client
│       └── hooks/      # Custom hooks
└── SETUP_GUIDE.md    # This file
```

## Support

For issues or questions:
1. Check the backend README: `backend/README.md`
2. Check the frontend README: `frontend/README.md`
3. Review Swagger docs: http://localhost:4000/api/docs

## License

MIT - See LICENSE file for details

---

Built by Jumar Juaton
