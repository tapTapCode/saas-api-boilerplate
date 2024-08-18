import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('STRIPE_SECRET_KEY');
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-12-18.acacia',
    });
  }

  async createCustomer(name: string, metadata: string) {
    return this.stripe.customers.create({
      name,
      metadata: { organizationId: metadata },
    });
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    organizationId: string,
  ) {
    const successUrl = this.configService.get('FRONTEND_URL') + '/dashboard?session_id={CHECKOUT_SESSION_ID}';
    const cancelUrl = this.configService.get('FRONTEND_URL') + '/pricing';

    return this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organizationId,
      },
    });
  }

  async getSubscription(subscriptionId: string) {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  async cancelSubscription(subscriptionId: string) {
    return this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  constructWebhookEvent(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
