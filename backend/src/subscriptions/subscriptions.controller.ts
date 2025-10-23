import { Controller, Post, Body, UseGuards, Request, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private subscriptionsService: SubscriptionsService,
    private stripeService: StripeService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('checkout')
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  async createCheckout(@Body() dto: CreateCheckoutDto, @Request() req) {
    return this.subscriptionsService.createCheckoutSession(
      dto.organizationId,
      dto.priceId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancelSubscription(@Body('organizationId') organizationId: string) {
    return this.subscriptionsService.cancelSubscription(organizationId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    try {
      const event = this.stripeService.constructWebhookEvent(
        req.rawBody as Buffer,
        signature,
      );
      await this.subscriptionsService.handleWebhook(event);
      return { received: true };
    } catch (err) {
      console.error('Webhook error:', err.message);
      throw err;
    }
  }
}
