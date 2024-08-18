# SaaS API Boilerplate - Backend

Multi-tenant SaaS API built with NestJS, Prisma, PostgreSQL, and Stripe.

## Features

- JWT & API Key Authentication
- Multi-tenant Architecture
- Subscription Management with Stripe
- Usage Tracking & Analytics
- Rate Limiting per Subscription Tier
- Comprehensive API Documentation (Swagger)
- PostgreSQL with Prisma ORM
- Type-safe Database Queries

## Tech Stack

- **NestJS** - Progressive Node.js framework
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Relational database
- **Stripe** - Payment processing
- **Passport** - Authentication middleware
- **Swagger** - API documentation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Stripe account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `FRONTEND_URL` - Frontend application URL

3. Generate Prisma client and run migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

### Development

Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:4000/api/v1`

API documentation (Swagger): `http://localhost:4000/api/docs`

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Production Build

```bash
npm run build
npm run start:prod
```

## API Overview

### Authentication Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with credentials
- `GET /api/v1/auth/profile` - Get current user profile
- `POST /api/v1/auth/api-keys` - Generate API key
- `POST /api/v1/auth/api-keys/:id/revoke` - Revoke API key

### Organization Endpoints

- `POST /api/v1/organizations` - Create organization
- `GET /api/v1/organizations/:id` - Get organization details
- `GET /api/v1/organizations/:id/usage` - Get usage statistics

### Subscription Endpoints

- `POST /api/v1/subscriptions/checkout` - Create Stripe checkout session
- `POST /api/v1/subscriptions/cancel` - Cancel subscription
- `POST /api/v1/subscriptions/webhook` - Stripe webhook handler

### User Endpoints

- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/users/api-keys` - List user's API keys

## Database Schema

### Models

- **User** - User accounts with roles
- **Organization** - Multi-tenant organizations
- **Subscription** - Stripe subscription management
- **ApiKey** - API key authentication
- **UsageRecord** - API usage tracking

### Subscription Plans

- **FREE** - 1,000 requests/month, 10 req/min
- **STARTER** - 10,000 requests/month, 50 req/min
- **PROFESSIONAL** - 100,000 requests/month, 200 req/min
- **ENTERPRISE** - 1,000,000 requests/month, 1000 req/min

## Authentication

### JWT Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### API Key Authentication

Include API key in custom header:
```
X-API-Key: sk_<your_api_key>
```

## Stripe Integration

### Webhook Setup

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:4000/api/v1/subscriptions/webhook
```
3. Update `STRIPE_WEBHOOK_SECRET` in `.env`

### Supported Events

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

## Rate Limiting

Rate limits are enforced based on subscription tier:
- Checked per API key
- Resets every minute
- Returns 429 status when exceeded

## Usage Tracking

All API requests are tracked with:
- Endpoint path
- HTTP method
- Response status
- Response time
- Timestamp

View usage stats via `/organizations/:id/usage` endpoint.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | JWT signing secret | `your-random-secret` |
| `STRIPE_SECRET_KEY` | Stripe API key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |
| `FRONTEND_URL` | Frontend app URL | `http://localhost:3000` |
| `PORT` | Server port | `4000` |

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── auth/                  # Authentication module
│   ├── users/                 # Users module
│   ├── organizations/         # Organizations module
│   ├── subscriptions/         # Subscriptions & Stripe
│   ├── prisma/                # Prisma service
│   ├── common/                # Shared guards, decorators
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry point
├── package.json
└── README.md
```

## License

MIT

## Author

Jumar Juaton
