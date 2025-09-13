import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private getUserId(req: any): string {
    return req.user.sub || req.user.id;
  }

  // Dashboard Stats
  @Get('stats')
  async getPaymentStats(@Request() req) {
    try {
      return await this.paymentsService.getPaymentStats(req.user.tenantId);
    } catch (error) {
      throw new HttpException(
        'Failed to get payment statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Subscription Management
  @Get('subscription')
  async getCurrentSubscription(@Request() req) {
    try {
      return await this.paymentsService.getCurrentSubscription(this.getUserId(req));
    } catch (error) {
      throw new HttpException(
        'Failed to get current subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('subscription')
  async createSubscription(
    @Request() req,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    try {
      return await this.paymentsService.createSubscription(
        req.user.id,
        createSubscriptionDto,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to create subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('subscription')
  async updateSubscription(
    @Request() req,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    try {
      return await this.paymentsService.updateSubscription(
        req.user.id,
        updateSubscriptionDto,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to update subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('subscription/cancel')
  async cancelSubscription(@Request() req) {
    try {
      return await this.paymentsService.cancelSubscription(req.user.id);
    } catch (error) {
      throw new HttpException(
        'Failed to cancel subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('subscription/reactivate')
  async reactivateSubscription(@Request() req) {
    try {
      return await this.paymentsService.reactivateSubscription(req.user.id);
    } catch (error) {
      throw new HttpException(
        'Failed to reactivate subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Plans and Pricing
  @Get('plans')
  async getAvailablePlans() {
    try {
      return await this.paymentsService.getAvailablePlans();
    } catch (error) {
      throw new HttpException(
        'Failed to get available plans',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Stripe Checkout Session
  @Post('subscription/create-checkout-session')
  async createCheckoutSession(
    @Request() req,
    @Body() body: { planId: string; billingPeriod: 'monthly' | 'yearly' }
  ) {
    try {
      return await this.paymentsService.createStripeCheckoutSession(
        this.getUserId(req),
        body.planId,
        body.billingPeriod
      );
    } catch (error) {
      throw new HttpException(
        'Failed to create checkout session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Payment Methods
  @Get('payment-methods')
  async getPaymentMethods(@Request() req) {
    try {
      return await this.paymentsService.getPaymentMethods(req.user.id);
    } catch (error) {
      throw new HttpException(
        'Failed to get payment methods',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('payment-methods')
  async addPaymentMethod(@Request() req, @Body() body: { payment_method_id: string }) {
    try {
      return await this.paymentsService.addPaymentMethod(
        req.user.id,
        body.payment_method_id,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to add payment method',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('payment-methods/:id')
  async removePaymentMethod(@Request() req, @Param('id') paymentMethodId: string) {
    try {
      return await this.paymentsService.removePaymentMethod(
        req.user.id,
        paymentMethodId,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to remove payment method',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('payment-methods/:id/set-default')
  async setDefaultPaymentMethod(@Request() req, @Param('id') paymentMethodId: string) {
    try {
      return await this.paymentsService.setDefaultPaymentMethod(
        req.user.id,
        paymentMethodId,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to set default payment method',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('setup-intent')
  async createSetupIntent(@Request() req) {
    try {
      return await this.paymentsService.createSetupIntent(req.user.id);
    } catch (error) {
      throw new HttpException(
        'Failed to create setup intent',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Billing History
  @Get('invoices')
  async getInvoices(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    try {
      return await this.paymentsService.getInvoices(req.user.id, {
        page: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      throw new HttpException(
        'Failed to get invoices',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('invoices/:id')
  async getInvoice(@Request() req, @Param('id') invoiceId: string) {
    try {
      return await this.paymentsService.getInvoice(req.user.id, invoiceId);
    } catch (error) {
      throw new HttpException(
        'Failed to get invoice',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('invoices/:id/download')
  async downloadInvoice(@Request() req, @Param('id') invoiceId: string) {
    try {
      const downloadUrl = await this.paymentsService.getInvoiceDownloadUrl(
        req.user.id,
        invoiceId,
      );
      return { download_url: downloadUrl };
    } catch (error) {
      throw new HttpException(
        'Failed to get invoice download URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Usage Statistics
  @Get('usage')
  async getUsageStats(@Request() req) {
    try {
      return await this.paymentsService.getUsageStats(req.user.id);
    } catch (error) {
      throw new HttpException(
        'Failed to get usage statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Transactions (legacy support)
  @Get('transactions')
  async getAllTransactions(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
    @Query('paymentType') paymentType?: string,
  ) {
    try {
      return await this.paymentsService.getAllTransactions(req.user, {
        page: Number(page),
        limit: Number(limit),
        status,
        vendorId,
        paymentType,
      });
    } catch (error) {
      throw new HttpException(
        'Failed to get transactions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('transactions')
  async createTransaction(
    @Request() req,
    @Body() createTransactionDto: CreatePaymentTransactionDto,
  ) {
    try {
      return await this.paymentsService.createTransaction(
        req.user.id,
        createTransactionDto,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to create transaction',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('stripe-payment')
  async createRealStripePayment(
    @Request() req,
    @Body() data: { amount: number; currency?: string; description?: string },
  ) {
    try {
      return await this.paymentsService.createRealStripePayment(
        req.user.id,
        data.amount,
        data.currency,
        data.description,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to create Stripe payment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync/:transactionId')
  async syncPaymentWithStripe(@Param('transactionId') transactionId: string) {
    try {
      const updated = await this.paymentsService.syncPaymentWithStripe(transactionId);
      if (!updated) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }
      return updated;
    } catch (error) {
      throw new HttpException(
        'Failed to sync payment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stripe-transactions')
  async getRealStripeTransactions(@Query('limit') limit = 10) {
    try {
      return await this.paymentsService.getRealStripeTransactions(Number(limit));
    } catch (error) {
      throw new HttpException(
        'Failed to get Stripe transactions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Stripe Webhook (no auth required)
  @Post('webhook')
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      const event = await this.paymentsService.constructWebhookEvent(
        req.rawBody,
        signature
      );
      
      return await this.paymentsService.handleWebhookEvent(event);
    } catch (error) {
      console.error('Webhook error:', error);
      throw new HttpException(
        'Webhook handling failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Legacy webhook method for tests
  async handleWebhook(body: any, signature: string) {
    return this.handleStripeWebhook({ rawBody: body } as any, signature);
  }
}
