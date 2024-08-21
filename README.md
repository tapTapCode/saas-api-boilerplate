# SaaS API Starter

I got tired of rebuilding Stripe billing + auth for every side project, so I made this starter. It's a working multi-tenant API with subscriptions, rate limiting, and team management.

**Why I built this**: After my third side project that needed "just basic billing and auth," I realized I was copy-pasting the same NestJS setup every time. This is that setup, cleaned up enough that I can actually reuse it.

## What It Does

- **Multi-tenant**: Each org has isolated data (I learned the hard way that `WHERE org_id = ?` is easy to forget)
- **Stripe billing**: Free/Pro/Enterprise tiers with usage limits
- **Rate limiting**: Redis-based, tier-specific (Pro users get more calls)
- **API keys**: Teams can generate and revoke keys without bothering me
- **Basic dashboard**: React frontend for managing orgs and seeing usage

## Stack

- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL 
- **Billing**: Stripe (webhooks for subscription changes)
- **Rate limiting**: Redis + `@nestjs/throttler`
- **Frontend**: React + Tailwind (functional, not pretty)

## Quick Start

```bash
# Clone and setup
git clone https://github.com/tapTapCode/saas-api-boilerplate.git
cd saas-api-boilerplate/backend
npm install
cp .env.example .env
# Edit .env with your Stripe keys
npx prisma migrate dev
npm run start:dev
```

Need the frontend too?
```bash
cd ../frontend
npm install
npm run dev
```

## Subscription Tiers

| Feature | Free | Pro ($49/mo) | Enterprise |
|---------|------|-------------|------------|
| API calls/month | 1,000 | 100,000 | Custom |
| Rate limit | 10/min | 100/min | 1000/min |
| Team members | 1 | 10 | Unlimited |

## Trade-offs I Made

- **NestJS over Express**: More boilerplate, but the dependency injection pays off when you have 5+ services
- **Redis for rate limiting**: Could've done in-memory, but needed it to work across multiple server instances
- **Prisma over raw SQL**: Slower for complex queries, but I'm not writing migration scripts by hand

## What's Messy

- The rate limit logic in `app.module.ts` is a bit hacky - it checks the subscription tier on every request
- Stripe webhook handling could use better error recovery (right now it just logs and hopes)
- Frontend is bare-bones. I focused on the API because that's what I keep rebuilding.

## API Quick Reference

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword", "name": "John"}'

# Create org (requires auth)
curl -X POST http://localhost:3000/organizations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "My Company", "plan": "pro"}'

# Generate API key
curl -X POST http://localhost:3000/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Production Key", "organizationId": "org_123"}'

# Use the API
curl http://localhost:3000/api/data \
  -H "X-API-Key: sk_live_..."
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/saas_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Testing

```bash
npm test              # Unit tests (sparse, honestly)
npm run test:e2e      # E2E tests (even sparser)
```

## Deployment

I've deployed this to Railway. The gist:
1. Push to GitHub
2. Connect Railway to repo
3. Add PostgreSQL + Redis services
4. Set env vars
5. Configure Stripe webhook URL

## TODO / Known Issues

- [ ] Rate limit by API key, not just user (right now one user hogs all the calls)
- [ ] Better error messages when Stripe webhooks fail
- [ ] Invoice history in dashboard (currently only shows current usage)
- [ ] Email notifications when hitting usage limits

## License

MIT - Use it, fork it, complain about it.

## Architecture

```
saas-api-boilerplate/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── auth/        # Authentication & JWT
│   │   ├── users/       # User management
│   │   ├── organizations/  # Multi-tenant orgs
│   │   ├── subscriptions/  # Stripe billing
│   │   ├── api-keys/    # API key management
│   │   ├── usage/       # Usage tracking
│   │   └── webhooks/    # Stripe webhooks
│   └── prisma/          # Database schema
├── frontend/            # React dashboard
└── docker-compose.yml
```

## Tech Stack

### Backend
- **NestJS**: Scalable Node.js framework
- **TypeScript**: Type safety
- **Prisma**: PostgreSQL ORM
- **Stripe**: Payment processing
- **JWT**: Authentication
- **Redis**: Rate limiting & caching
- **Passport**: Auth strategies

### Frontend
- **React**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **React Query**: Data fetching

## Subscription Tiers

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| API Calls/month | 1,000 | 100,000 | Unlimited |
| Rate Limit | 10/min | 100/min | 1000/min |
| Team Members | 1 | 10 | Unlimited |
| Support | Community | Email | Priority |
| Price | $0 | $49/mo | Custom |

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Stripe account

### Quick Start

```bash
# Clone repository
git clone https://github.com/tapTapCode/saas-api-boilerplate.git
cd saas-api-boilerplate

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npx prisma migrate dev
npm run start:dev

# Frontend setup
cd ../frontend
npm install
npm run dev
```

### Docker Setup

```bash
docker-compose up --build
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/saas_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_FREE=price_...
STRIPE_PRICE_PRO=price_...

# App
PORT=3000
NODE_ENV=development
```

## API Endpoints

### Authentication
```bash
POST /auth/register         # Register new user
POST /auth/login           # Login user
POST /auth/refresh         # Refresh JWT token
```

### Organizations
```bash
GET    /organizations       # List user's organizations
POST   /organizations       # Create organization
GET    /organizations/:id   # Get organization details
PATCH  /organizations/:id   # Update organization
DELETE /organizations/:id   # Delete organization
```

### API Keys
```bash
GET    /api-keys           # List API keys
POST   /api-keys           # Generate new API key
DELETE /api-keys/:id       # Revoke API key
```

### Subscriptions
```bash
GET    /subscriptions              # Get current subscription
POST   /subscriptions/checkout     # Create Stripe checkout
POST   /subscriptions/portal       # Open customer portal
POST   /subscriptions/upgrade      # Upgrade plan
POST   /subscriptions/cancel       # Cancel subscription
```

### Usage
```bash
GET /usage/current         # Current period usage
GET /usage/history         # Historical usage data
```

## Usage Example

### 1. Register and Create Organization

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "name": "John Doe"
  }'

# Create organization
curl -X POST http://localhost:3000/organizations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Company",
    "plan": "pro"
  }'
```

### 2. Generate API Key

```bash
curl -X POST http://localhost:3000/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Production Key",
    "organizationId": "org_123"
  }'
```

### 3. Make API Call with Rate Limiting

```bash
curl http://localhost:3000/api/data \
  -H "X-API-Key: sk_live_..."
```

## Stripe Integration

### Subscription Flow

1. User creates account
2. User creates organization (starts on Free plan)
3. User clicks "Upgrade to Pro"
4. Backend creates Stripe checkout session
5. User completes payment
6. Stripe webhook updates subscription status
7. Rate limits and quotas automatically updated

### Webhook Events Handled

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Rate Limiting

Rate limits are enforced based on subscription tier:

```typescript
// Free: 10 requests per minute
// Pro: 100 requests per minute  
// Enterprise: 1000 requests per minute

@UseGuards(RateLimitGuard)
@Throttle({ default: { limit: tierLimit, ttl: 60000 } })
export class ApiController {
  // Your endpoints
}
```

## Multi-Tenancy

Each organization has isolated data:

```typescript
// Prisma schema ensures data isolation
model Organization {
  id           String   @id @default(uuid())
  name         String
  users        User[]
  apiKeys      ApiKey[]
  subscription Subscription?
  usage        Usage[]
}

// All queries filter by organizationId
const data = await prisma.data.findMany({
  where: { organizationId: req.user.organizationId }
});
```

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

### Railway/Render
- Deploy backend as web service
- Add PostgreSQL database
- Add Redis instance
- Set environment variables
- Configure Stripe webhooks

### Environment Setup
1. Create Stripe products and prices
2. Configure webhook endpoint
3. Set environment variables
4. Run database migrations
5. Deploy application

## Security Features

- **JWT Authentication**: Secure token-based auth
- **API Key Encryption**: Keys hashed before storage
- **Rate Limiting**: Prevent abuse
- **CORS Configuration**: Whitelist origins
- **Input Validation**: DTO validation with class-validator
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **Stripe Webhook Signature Verification**: Validate webhook authenticity

## Monitoring & Analytics

- API usage tracking
- Subscription analytics
- Error logging
- Performance metrics
- User activity logs

## License

MIT License

## Author

**Jumar Juaton**
- GitHub: [@tapTapCode](https://github.com/tapTapCode)
- Portfolio: [SaaS API Boilerplate](https://github.com/tapTapCode/saas-api-boilerplate)

## Acknowledgments

Built to demonstrate:
- Multi-tenant SaaS architecture
- Stripe payment integration
- API rate limiting patterns
- Usage-based billing
- Production-ready NestJS application
