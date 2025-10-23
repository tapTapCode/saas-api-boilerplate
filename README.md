# SaaS API Boilerplate

Production-ready multi-tenant SaaS API platform with subscription management, built with NestJS and Next.js.

**📚 Documentation**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed setup instructions
**🚀 Quick Start**: Follow the setup guide to get running in 10 minutes

## Features

- **Multi-Tenant Architecture**: Isolated data per organization
- **Stripe Integration**: Subscription billing and usage-based pricing
- **Tiered Access**: Free, Pro, and Enterprise plans with different limits
- **API Key Management**: Secure API key generation and rotation
- **Rate Limiting**: Redis-based rate limiting per subscription tier
- **Usage Tracking**: Monitor API calls and billing
- **Webhook Handling**: Stripe webhooks for subscription events
- **Admin Dashboard**: Manage users, subscriptions, and analytics
- **JWT Authentication**: Secure user authentication
- **Role-Based Access**: Owner, Admin, Member roles

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
