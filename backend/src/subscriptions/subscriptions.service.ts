import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  async createCheckoutSession(organizationId: string, priceId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const subscription = organization.subscriptions[0];
    
    // Create or retrieve Stripe customer
    let customerId = subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripeService.createCustomer(
        organization.name,
        `org-${organization.id}`,
      );
      customerId = customer.id;
      
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const session = await this.stripeService.createCheckoutSession(
      customerId,
      priceId,
      organizationId,
    );

    return { url: session.url };
  }

  async handleWebhook(event: any) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
    }
  }

  private async handleCheckoutComplete(session: any) {
    const organizationId = session.metadata.organizationId;
    const subscriptionId = session.subscription;

    const stripeSubscription = await this.stripeService.getSubscription(subscriptionId);
    
    await this.prisma.subscription.updateMany({
      where: { organizationId },
      data: {
        stripeSubscriptionId: subscriptionId,
        stripePriceId: stripeSubscription.items.data[0].price.id,
        plan: this.mapPriceToPlan(stripeSubscription.items.data[0].price.id),
        status: 'ACTIVE',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        requestLimit: this.getRequestLimit(stripeSubscription.items.data[0].price.id),
        rateLimit: this.getRateLimit(stripeSubscription.items.data[0].price.id),
      },
    });
  }

  private async handleSubscriptionUpdate(subscription: any) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status.toUpperCase(),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  private async handleSubscriptionDeleted(subscription: any) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELED',
      },
    });
  }

  private async handlePaymentFailed(invoice: any) {
    const subscriptionId = invoice.subscription;
    if (subscriptionId) {
      await this.prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
          status: 'PAST_DUE',
        },
      });
    }
  }

  private mapPriceToPlan(priceId: string): string {
    // Map your Stripe price IDs to plan names
    const priceMap: Record<string, string> = {
      'price_starter': 'STARTER',
      'price_professional': 'PROFESSIONAL',
      'price_enterprise': 'ENTERPRISE',
    };
    return priceMap[priceId] || 'FREE';
  }

  private getRequestLimit(priceId: string): number {
    const limitMap: Record<string, number> = {
      'price_starter': 10000,
      'price_professional': 100000,
      'price_enterprise': 1000000,
    };
    return limitMap[priceId] || 1000;
  }

  private getRateLimit(priceId: string): number {
    const limitMap: Record<string, number> = {
      'price_starter': 50,
      'price_professional': 200,
      'price_enterprise': 1000,
    };
    return limitMap[priceId] || 10;
  }

  async cancelSubscription(organizationId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new NotFoundException('Active subscription not found');
    }

    await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId);

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return { message: 'Subscription will be canceled at the end of the billing period' };
  }
}
