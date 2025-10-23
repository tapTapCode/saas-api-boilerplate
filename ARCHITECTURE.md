# SaaS API Boilerplate - Complete Architecture

## Overview

This document provides the complete architecture for building a production-ready multi-tenant SaaS API with Stripe billing. It demonstrates enterprise-level patterns for subscription management, API rate limiting, and usage tracking.

## System Architecture

```
┌─────────────┐
│   Client    │
│ (Dashboard) │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│  NestJS API │
│   (Node.js) │
└──────┬──────┘
       │
   ┌───┴────┐
   ▼        ▼
┌────────┐ ┌────────┐
│Postgres│ │ Redis  │
│  (Data)│ │(Rate   │
└────────┘ │Limit)  │
           └────────┘
              │
              ▼
         ┌─────────┐
         │ Stripe  │
         │ (Billing│
         └─────────┘
```

## Database Schema

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  password      String
  name          String
  role          Role           @default(MEMBER)
  organizationId String
  organization  Organization   @relation(fields: [organizationId], references: [id])
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

enum Role {
  OWNER
  ADMIN
  MEMBER
}

model Organization {
  id            String         @id @default(uuid())
  name          String
  slug          String         @unique
  users         User[]
  apiKeys       ApiKey[]
  subscription  Subscription?
  usage         Usage[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model ApiKey {
  id              String       @id @default(uuid())
  name            String
  key             String       @unique  // Hashed
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  lastUsedAt      DateTime?
  createdAt       DateTime     @default(now())
  revokedAt       DateTime?
}

model Subscription {
  id              String       @id @default(uuid())
  organizationId  String       @unique
  organization    Organization @relation(fields: [organizationId], references: [id])
  plan            Plan         @default(FREE)
  stripeCustomerId      String?  @unique
  stripeSubscriptionId  String?  @unique
  stripePriceId        String?
  status          SubscriptionStatus @default(ACTIVE)
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean   @default(false)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  TRIALING
}

model Usage {
  id              String       @id @default(uuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  endpoint        String
  method          String
  statusCode      Int
  responseTime    Int
  timestamp       DateTime     @default(now())
  month           Int
  year            Int
  
  @@index([organizationId, year, month])
}
```

## Core Modules Implementation

### 1. Authentication Module

**File**: `src/auth/auth.service.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        organization: {
          create: {
            name: `${dto.name}'s Workspace`,
            slug: this.generateSlug(dto.name),
          }
        },
        role: 'OWNER',
      },
      include: { organization: true },
    });

    // Create free subscription
    await this.prisma.subscription.create({
      data: {
        organizationId: user.organizationId,
        plan: 'FREE',
        status: 'ACTIVE',
      },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  private generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organization: user.organization,
      },
    };
  }
}
```

### 2. Subscription Service with Stripe

**File**: `src/subscriptions/subscriptions.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  async createCheckoutSession(organizationId: string, plan: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true },
    });

    let customerId = organization.subscription?.stripeCustomerId;

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        metadata: { organizationId },
      });
      customerId = customer.id;
    }

    // Get price ID based on plan
    const priceId = this.getPriceId(plan);

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.APP_URL}/pricing?canceled=true`,
      metadata: { organizationId, plan },
    });

    return { url: session.url };
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.updateSubscription(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.cancelSubscription(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        // Track successful payment
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.Invoice);
        break;
    }
  }

  private async updateSubscription(subscription: Stripe.Subscription) {
    const organizationId = subscription.metadata.organizationId;
    const plan = this.getPlanFromPriceId(subscription.items.data[0].price.id);

    await this.prisma.subscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        plan,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        status: this.mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
      update: {
        plan,
        status: this.mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  private getPriceId(plan: string): string {
    const priceMap = {
      pro: process.env.STRIPE_PRICE_PRO,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
    };
    return priceMap[plan];
  }

  private getPlanFromPriceId(priceId: string): string {
    if (priceId === process.env.STRIPE_PRICE_PRO) return 'PRO';
    if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) return 'ENTERPRISE';
    return 'FREE';
  }

  private mapStripeStatus(status: string): string {
    const statusMap = {
      active: 'ACTIVE',
      canceled: 'CANCELED',
      past_due: 'PAST_DUE',
      trialing: 'TRIALING',
    };
    return statusMap[status] || 'ACTIVE';
  }
}
```

### 3. Rate Limiting Guard

**File**: `src/common/guards/rate-limit.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private redis: Redis;

  constructor(private prisma: PrismaService) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
    });
  }

  async canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.user?.organizationId;

    if (!organizationId) {
      return false;
    }

    // Get subscription tier
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
    });

    // Get rate limit for tier
    const limit = this.getRateLimit(subscription.plan);

    // Check Redis for current count
    const key = `rate_limit:${organizationId}:${Date.now() / 60000 | 0}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, 60); // 60 seconds TTL
    }

    if (current > limit) {
      return false; // Rate limit exceeded
    }

    return true;
  }

  private getRateLimit(plan: string): number {
    const limits = {
      FREE: 10,
      PRO: 100,
      ENTERPRISE: 1000,
    };
    return limits[plan] || 10;
  }
}
```

### 4. API Key Authentication

**File**: `src/auth/strategies/api-key.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private prisma: PrismaService) {
    super();
  }

  async validate(apiKey: string) {
    // Find API key (keys are hashed in database)
    const keys = await this.prisma.apiKey.findMany({
      where: {
        revokedAt: null,
      },
      include: {
        organization: {
          include: {
            subscription: true,
          },
        },
      },
    });

    for (const key of keys) {
      const isValid = await bcrypt.compare(apiKey, key.key);
      if (isValid) {
        // Update last used
        await this.prisma.apiKey.update({
          where: { id: key.id },
          data: { lastUsedAt: new Date() },
        });

        return {
          organizationId: key.organizationId,
          organization: key.organization,
        };
      }
    }

    throw new UnauthorizedException('Invalid API key');
  }
}
```

### 5. Usage Tracking Middleware

**File**: `src/common/middleware/usage-tracking.middleware.ts`

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsageTrackingMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', async () => {
      const responseTime = Date.now() - startTime;
      const user = req['user'];

      if (user?.organizationId) {
        const now = new Date();
        
        await this.prisma.usage.create({
          data: {
            organizationId: user.organizationId,
            endpoint: req.path,
            method: req.method,
            statusCode: res.statusCode,
            responseTime,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        });
      }
    });

    next();
  }
}
```

## Subscription Tier Limits

```typescript
// src/common/constants/subscription-tiers.ts

export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    price: 0,
    limits: {
      apiCallsPerMonth: 1000,
      rateLimit: 10, // per minute
      teamMembers: 1,
      features: ['basic-analytics'],
    },
  },
  PRO: {
    name: 'Pro',
    price: 49,
    limits: {
      apiCallsPerMonth: 100000,
      rateLimit: 100,
      teamMembers: 10,
      features: ['basic-analytics', 'advanced-analytics', 'priority-support'],
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: null, // Custom pricing
    limits: {
      apiCallsPerMonth: Infinity,
      rateLimit: 1000,
      teamMembers: Infinity,
      features: ['all'],
    },
  },
};
```

## Security Best Practices

### 1. API Key Storage
- Keys are hashed with bcrypt before storage
- Never store plain text API keys
- Rotate keys regularly

### 2. JWT Security
- Short expiration times (7 days)
- Secure secret keys
- Refresh token rotation

### 3. Stripe Webhook Verification
```typescript
// Verify webhook signature
const sig = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  request.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### 4. Input Validation
```typescript
// Use class-validator DTOs
export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Plan)
  plan: Plan;
}
```

## Deployment Checklist

1. Set up PostgreSQL database
2. Set up Redis instance
3. Configure Stripe account
   - Create products and prices
   - Set up webhook endpoint
   - Get API keys
4. Set environment variables
5. Run database migrations
6. Configure CORS for frontend domain
7. Set up monitoring (Sentry, DataDog)
8. Configure rate limiting
9. Test payment flow in Stripe test mode
10. Switch to production mode

## Testing Strategy

### Unit Tests
```typescript
describe('SubscriptionsService', () => {
  it('should create checkout session', async () => {
    const result = await service.createCheckoutSession('org_id', 'pro');
    expect(result.url).toBeDefined();
  });
});
```

### Integration Tests
- Test Stripe webhook handling
- Test rate limiting
- Test multi-tenancy isolation

### E2E Tests
- Complete subscription flow
- API key authentication
- Usage tracking

## Monitoring & Alerts

- **Stripe Dashboard**: Monitor subscriptions
- **Redis**: Track rate limit hits
- **Database**: Query performance
- **Logs**: Error tracking with Winston
- **Metrics**: API response times, usage patterns

## Scaling Considerations

- **Horizontal Scaling**: Stateless API design
- **Database**: Connection pooling with Prisma
- **Redis**: Separate instances for cache and rate limiting
- **Queue**: Add BullMQ for async operations
- **CDN**: Cache static assets

This architecture provides a solid foundation for building a production-ready SaaS API platform.
