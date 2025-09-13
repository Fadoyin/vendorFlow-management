import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StripeService } from '../../common/stripe/stripe.service';
import { User } from '../users/schemas/user.schema';
import {
  Subscription,
  SubscriptionStatus,
  SubscriptionPlan,
} from './schemas/subscription.schema';
import {
  PaymentTransaction,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
} from './schemas/payment-transaction.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';
import Stripe from 'stripe';

interface PaginationParams {
  page: number;
  limit: number;
}

interface TransactionFilters extends PaginationParams {
  status?: string;
  vendorId?: string;
  paymentType?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
    @InjectModel(PaymentTransaction.name)
    private paymentTransactionModel: Model<PaymentTransaction>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    private stripeService: StripeService,
  ) {}

  // Helper method to get or create Stripe customer
  private async getOrCreateStripeCustomer(userId: string): Promise<Stripe.Customer> {
    const user = await this.userModel.findById(new Types.ObjectId(userId));
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has a Stripe customer ID
    if (user.stripeCustomerId) {
      try {
        return await this.stripeService.getCustomer(user.stripeCustomerId);
      } catch (error) {
        this.logger.warn(`Stripe customer ${user.stripeCustomerId} not found, creating new one`);
      }
    }

    // Create new Stripe customer
    const customer = await this.stripeService.createCustomer(
      user.email,
      `${user.firstName} ${user.lastName}`,
    );

    // Save Stripe customer ID to user
    await this.userModel.findByIdAndUpdate(userId, {
      stripeCustomerId: customer.id,
    });

    return customer;
  }

  // Subscription Management
  async getCurrentSubscription(userId: string): Promise<any> {
    try {
      // Get subscription from database
      const dbSubscription = await this.subscriptionModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 });

      if (!dbSubscription) {
        return null;
      }

      // For free subscriptions (no Stripe subscription ID)
      if (!dbSubscription.stripeSubscriptionId) {
        return {
          plan: dbSubscription.plan,
          status: dbSubscription.status,
          amount: dbSubscription.amount,
          currency: dbSubscription.currency,
          billingPeriod: dbSubscription.billingPeriod,
          currentPeriodStart: dbSubscription.currentPeriodStart,
          currentPeriodEnd: dbSubscription.currentPeriodEnd,
          isActive: dbSubscription.status === SubscriptionStatus.ACTIVE,
        };
      }

      // Get latest data from Stripe for paid subscriptions
      const stripeSubscription = await this.stripeService.getSubscription(
        dbSubscription.stripeSubscriptionId,
      );

      // Convert Stripe subscription to our format
      return this.formatSubscriptionResponse(stripeSubscription, dbSubscription);
    } catch (error) {
      this.logger.error('Failed to get current subscription:', error);
      throw error;
    }
  }

  async createSubscription(
    userId: string,
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<any> {
    try {
      const customer = await this.getOrCreateStripeCustomer(userId);

      // Create subscription in Stripe
      const stripeSubscription = await this.stripeService.createSubscription(
        customer.id,
        createSubscriptionDto.planId,
        createSubscriptionDto.paymentMethodId,
      );

      // Save subscription to database
      const subscription = new this.subscriptionModel({
        vendorId: new Types.ObjectId(userId),
        stripeCustomerId: customer.id,
        stripeSubscriptionId: stripeSubscription.id,
        plan: this.mapStripePlanToEnum(createSubscriptionDto.planId),
        status: this.mapStripeStatusToEnum(stripeSubscription.status),
        monthlyPrice: (stripeSubscription.items.data[0].price.unit_amount || 0) / 100,
        currency: stripeSubscription.items.data[0].price.currency || 'usd',
        currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        totalBilled: 0,
        totalPaid: 0,
        outstandingAmount: 0,
        features: this.getPlanFeatures(createSubscriptionDto.planId),
      });

      await subscription.save();

      return this.formatSubscriptionResponse(stripeSubscription, subscription);
    } catch (error) {
      this.logger.error('Failed to create subscription:', error);
      throw error;
    }
  }

  async updateSubscription(
    userId: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<any> {
    try {
      const subscription = await this.subscriptionModel.findOne({
        vendorId: userId,
      });

      if (!subscription?.stripeSubscriptionId) {
        throw new NotFoundException('Subscription not found');
      }

      // Update subscription in Stripe
      const stripeSubscription = await this.stripeService.updateSubscription(
        subscription.stripeSubscriptionId,
        updateSubscriptionDto.planId,
      );

      // Update database record
      subscription.plan = this.mapStripePlanToEnum(updateSubscriptionDto.planId);
      subscription.amount = (stripeSubscription.items.data[0].price.unit_amount || 0) / 100;
      subscription.features = this.getPlanFeatures(updateSubscriptionDto.planId);
      await subscription.save();

      return this.formatSubscriptionResponse(stripeSubscription, subscription);
    } catch (error) {
      this.logger.error('Failed to update subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(userId: string): Promise<any> {
    try {
      const subscription = await this.subscriptionModel.findOne({
        vendorId: userId,
      });

      if (!subscription?.stripeSubscriptionId) {
        throw new NotFoundException('Subscription not found');
      }

      // Cancel subscription in Stripe
      const stripeSubscription = await this.stripeService.cancelSubscription(
        subscription.stripeSubscriptionId,
      );

      // Update database record
      subscription.status = this.mapStripeStatusToEnum(stripeSubscription.status);
      await subscription.save();

      return this.formatSubscriptionResponse(stripeSubscription, subscription);
    } catch (error) {
      this.logger.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  async reactivateSubscription(userId: string): Promise<any> {
    try {
      const subscription = await this.subscriptionModel.findOne({
        vendorId: userId,
      });

      if (!subscription?.stripeSubscriptionId) {
        throw new NotFoundException('Subscription not found');
      }

      // Reactivate subscription in Stripe
      const stripeSubscription = await this.stripeService.reactivateSubscription(
        subscription.stripeSubscriptionId,
      );

      // Update database record
      subscription.status = this.mapStripeStatusToEnum(stripeSubscription.status);
      await subscription.save();

      return this.formatSubscriptionResponse(stripeSubscription, subscription);
    } catch (error) {
      this.logger.error('Failed to reactivate subscription:', error);
      throw error;
    }
  }

  // Plans and Pricing
  async getAvailablePlans(): Promise<any[]> {
    try {
      const prices = await this.stripeService.listPrices();
      
      return prices.map(price => ({
        id: price.id,
        name: (price.product as Stripe.Product).name,
        description: (price.product as Stripe.Product).description,
        price: (price.unit_amount || 0) / 100,
        currency: price.currency,
        interval: price.recurring?.interval || 'month',
        features: this.getPlanFeatures(price.id),
        maxOrders: this.getPlanLimits(price.id).orders,
        maxUsers: this.getPlanLimits(price.id).users,
        isPopular: this.isPlanPopular(price.id),
        isActive: price.active,
      }));
    } catch (error) {
      this.logger.error('Failed to get available plans:', error);
      throw error;
    }
  }

  // Payment Methods
  async getPaymentMethods(userId: string): Promise<any[]> {
    try {
      this.logger.log(`Getting payment methods for user: ${userId}`);
      
      const customer = await this.getOrCreateStripeCustomer(userId);
      const paymentMethods = await this.stripeService.listPaymentMethods(customer.id);

      return paymentMethods.map(pm => ({
        id: pm.id,
        type: pm.type,
        last4: pm.card?.last4,
        brand: pm.card?.brand,
        expiryMonth: pm.card?.exp_month,
        expiryYear: pm.card?.exp_year,
        holderName: pm.billing_details?.name,
        isDefault: customer.invoice_settings?.default_payment_method === pm.id,
        createdAt: new Date(pm.created * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    } catch (error) {
      this.logger.error('Failed to get payment methods:', error);
      throw error;
    }
  }

  async addPaymentMethod(userId: string, paymentMethodId: string): Promise<any> {
    try {
      const customer = await this.getOrCreateStripeCustomer(userId);
      const paymentMethod = await this.stripeService.attachPaymentMethod(
        paymentMethodId,
        customer.id,
      );

      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
        expiryMonth: paymentMethod.card?.exp_month,
        expiryYear: paymentMethod.card?.exp_year,
        holderName: paymentMethod.billing_details?.name,
        isDefault: false,
        createdAt: new Date(paymentMethod.created * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to add payment method:', error);
      throw error;
    }
  }

  async removePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    try {
      await this.stripeService.detachPaymentMethod(paymentMethodId);
    } catch (error) {
      this.logger.error('Failed to remove payment method:', error);
      throw error;
    }
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<any> {
    try {
      const customer = await this.getOrCreateStripeCustomer(userId);
      await this.stripeService.setDefaultPaymentMethod(customer.id, paymentMethodId);

      return {
        id: paymentMethodId,
        isDefault: true,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to set default payment method:', error);
      throw error;
    }
  }

  async createSetupIntent(userId: string): Promise<any> {
    try {
      const customer = await this.getOrCreateStripeCustomer(userId);
      const setupIntent = await this.stripeService.createSetupIntent(customer.id);

      return {
        client_secret: setupIntent.client_secret,
        id: setupIntent.id,
      };
    } catch (error) {
      this.logger.error('Failed to create setup intent:', error);
      throw error;
    }
  }

  // Billing History
  async getInvoices(userId: string, params: PaginationParams): Promise<any> {
    try {
      const customer = await this.getOrCreateStripeCustomer(userId);
      const invoices = await this.stripeService.listInvoices(customer.id, params.limit);

      const formattedInvoices = invoices.map(invoice => ({
        id: invoice.id,
        subscriptionId: (invoice as any).subscription,
        amount: (invoice.amount_paid || 0) / 100,
        currency: invoice.currency,
        status: invoice.status,
        invoiceDate: new Date(invoice.created * 1000).toISOString(),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
        paidAt: invoice.status_transitions?.paid_at 
          ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() 
          : null,
        description: invoice.description || `Invoice ${invoice.number}`,
        downloadUrl: invoice.hosted_invoice_url,
        createdAt: new Date(invoice.created * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      return {
        invoices: formattedInvoices,
        total: formattedInvoices.length,
        page: params.page,
        totalPages: Math.ceil(formattedInvoices.length / params.limit),
      };
    } catch (error) {
      this.logger.error('Failed to get invoices:', error);
      throw error;
    }
  }

  async getInvoice(userId: string, invoiceId: string): Promise<any> {
    try {
      const invoice = await this.stripeService.getInvoice(invoiceId);

      return {
        id: invoice.id,
        subscriptionId: (invoice as any).subscription,
        amount: (invoice.amount_paid || 0) / 100,
        currency: invoice.currency,
        status: invoice.status,
        invoiceDate: new Date(invoice.created * 1000).toISOString(),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
        paidAt: invoice.status_transitions?.paid_at 
          ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() 
          : null,
        description: invoice.description || `Invoice ${invoice.number}`,
        downloadUrl: invoice.hosted_invoice_url,
        createdAt: new Date(invoice.created * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get invoice:', error);
      throw error;
    }
  }

  async getInvoiceDownloadUrl(userId: string, invoiceId: string): Promise<string> {
    try {
      return await this.stripeService.downloadInvoice(invoiceId);
    } catch (error) {
      this.logger.error('Failed to get invoice download URL:', error);
      throw error;
    }
  }

  // Usage Statistics
  async getUsageStats(userId: string): Promise<any> {
    try {
      const subscription = await this.subscriptionModel.findOne({ vendorId: userId });
      
      if (!subscription) {
        return {
          currentPeriodOrders: 0,
          maxOrders: 100,
          currentPeriodUsers: 1,
          maxUsers: 1,
          storageUsed: 0,
          maxStorage: 1,
        };
      }

      const limits = this.getPlanLimits(subscription.plan);
      
      // In a real implementation, you'd calculate actual usage from your database
      return {
        currentPeriodOrders: 247,
        maxOrders: limits.orders,
        currentPeriodUsers: 3,
        maxUsers: limits.users,
        storageUsed: 1.2,
        maxStorage: limits.storage,
      };
    } catch (error) {
      this.logger.error('Failed to get usage stats:', error);
      throw error;
    }
  }

  // Legacy transaction support
  async getAllTransactions(user: any, filters: TransactionFilters): Promise<any> {
    try {
      const query: any = {};
      
      // For admin users, show all transactions in their tenant
      // For regular users, only show their own transactions
      if (user.role !== 'admin') {
        query.vendorId = new Types.ObjectId(user.id);
      }
      
      if (filters.status) query.status = filters.status;
      if (filters.paymentType) query.paymentType = filters.paymentType;
      if (filters.vendorId) query.vendorId = new Types.ObjectId(filters.vendorId);

      const transactions = await this.paymentTransactionModel
        .find(query)
        .limit(filters.limit)
        .skip((filters.page - 1) * filters.limit)
        .sort({ createdAt: -1 });

      const total = await this.paymentTransactionModel.countDocuments(query);

      return {
        transactions,
        total,
        page: filters.page,
        totalPages: Math.ceil(total / filters.limit),
      };
    } catch (error) {
      this.logger.error('Failed to get transactions:', error);
      throw error;
    }
  }

  async createTransaction(
    userId: string,
    createTransactionDto: CreatePaymentTransactionDto,
  ): Promise<PaymentTransaction> {
    try {
      const transaction = new this.paymentTransactionModel({
        ...createTransactionDto,
        vendorId: new Types.ObjectId(userId),
      });

      return await transaction.save();
    } catch (error) {
      this.logger.error('Failed to create transaction:', error);
      throw error;
    }
  }

  // NEW: Create real Stripe payment intent
  async createRealStripePayment(
    userId: string,
    amount: number,
    currency: string = 'usd',
    description?: string,
  ): Promise<PaymentTransaction> {
    try {
      // Get or create Stripe customer
      const customer = await this.getOrCreateStripeCustomer(userId);

      // Create real Stripe Payment Intent
      const paymentIntent = await this.stripeService.createPaymentIntent(
        amount * 100, // Convert to cents
        currency,
        customer.id,
        description || 'VendorFlow Payment',
      );

      // Store transaction with real Stripe data
      const transaction = new this.paymentTransactionModel({
        vendorId: new Types.ObjectId(userId),
        transactionId: `stripe_${paymentIntent.id}`,
        stripePaymentIntentId: paymentIntent.id,
        amount: amount,
        currency: currency.toUpperCase(),
        status: paymentIntent.status,
        paymentMethod: 'card',
        paymentType: 'one_time',
        description,
        customerEmail: customer.email,
        customerName: customer.name,
      });

      const savedTransaction = await transaction.save();
      
      this.logger.log(`Created real Stripe payment: ${paymentIntent.id}`);
      return savedTransaction;
    } catch (error) {
      this.logger.error('Failed to create real Stripe payment:', error);
      throw error;
    }
  }

  // NEW: Sync payment status with Stripe
  async syncPaymentWithStripe(transactionId: string): Promise<PaymentTransaction | null> {
    try {
      const transaction = await this.paymentTransactionModel.findOne({
        transactionId: transactionId,
      });

      if (!transaction || !transaction.stripePaymentIntentId) {
        return null;
      }

      // Get current status from Stripe
      const paymentIntent = await this.stripeService.getPaymentIntent(
        transaction.stripePaymentIntentId,
      );

      // Update local record with Stripe status
      transaction.status = paymentIntent.status as any;
      if ((paymentIntent as any).charges?.data?.[0]) {
        const charge = (paymentIntent as any).charges.data[0];
        transaction.receiptUrl = charge.receipt_url;
        if (paymentIntent.status === 'succeeded') {
          transaction.processedAt = new Date(charge.created * 1000);
        }
      }

      return await transaction.save();
    } catch (error) {
      this.logger.error('Failed to sync payment with Stripe:', error);
      return null;
    }
  }

  // NEW: Get real transactions from Stripe
  async getRealStripeTransactions(limit: number = 10): Promise<any[]> {
    try {
      const stripePayments = await this.stripeService.getPaymentIntents(limit);
      
      return stripePayments.data.map(payment => ({
        id: payment.id,
        amount: payment.amount / 100, // Convert from cents
        currency: payment.currency.toUpperCase(),
        status: payment.status,
        created: new Date(payment.created * 1000),
        description: payment.description,
        customer: payment.customer,
        receipt_url: (payment as any).charges?.data?.[0]?.receipt_url,
      }));
    } catch (error) {
      this.logger.error('Failed to get real Stripe transactions:', error);
      return [];
    }
  }

  // Stripe Webhook Handler
  async handleStripeWebhook(payload: Buffer, signature: string): Promise<any> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new BadRequestException('Stripe webhook secret not configured');
      }
      const event = this.stripeService.constructWebhookEvent(payload, signature, webhookSecret);

      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Failed to handle Stripe webhook:', error);
      throw error;
    }
  }

  // Legacy webhook method for tests
  async handleWebhook(event: any): Promise<any> {
    return this.handleStripeWebhook(Buffer.from(JSON.stringify(event)), 'test_signature');
  }

  // NEW: Create Stripe Checkout Session for Subscription
  async createStripeCheckoutSession(
    userId: string,
    planId: string,
    billingPeriod: 'monthly' | 'yearly'
  ): Promise<{ sessionId: string; url: string }> {
    try {
      // Get user details
      const user = await this.userModel.findById(new Types.ObjectId(userId));
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Define plan configurations
      const planConfigs = {
        free_trial: {
          name: 'Supplier Starter',
          monthlyPrice: 0,
          yearlyPrice: 0,
        },
        standard: {
          name: 'Supplier Standard',
          monthlyPrice: 4900, // $49.00 in cents
          yearlyPrice: 49000, // $490.00 in cents
        },
        premium: {
          name: 'Supplier Enterprise',
          monthlyPrice: 14900, // $149.00 in cents
          yearlyPrice: 149000, // $1490.00 in cents
        },
      };

      const planConfig = planConfigs[planId];
      if (!planConfig) {
        throw new BadRequestException('Invalid plan ID');
      }

      // Skip checkout for free plan
      if (planConfig.monthlyPrice === 0) {
        // Create free subscription directly
        await this.createFreeSubscription(userId, planId);
        return {
          sessionId: 'free_plan',
          url: '/dashboard/subscription-plans?success=true&plan=free'
        };
      }

      // Check if Stripe is configured
      const isStripeConfigured = this.stripeService.isConfigured();
      if (!isStripeConfigured) {
        // Create mock subscription for development when Stripe is not configured
        this.logger.warn(`Stripe not configured. Creating mock subscription for development: ${planId}`);
        await this.createMockSubscription(userId, planId, billingPeriod);
        return {
          sessionId: 'mock_development',
          url: '/dashboard/subscription-plans?success=true&plan=' + planId
        };
      }

      // Get or create Stripe customer
      const customer = await this.stripeService.createCustomer(
        user.email,
        `${user.firstName} ${user.lastName}`
      );

      const price = billingPeriod === 'monthly' 
        ? planConfig.monthlyPrice 
        : planConfig.yearlyPrice;

      // Create Stripe checkout session
      const session = await this.stripeService.createCheckoutSession(
        customer.id,
        [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${planConfig.name} - ${billingPeriod === 'monthly' ? 'Monthly' : 'Yearly'}`,
              description: `VendorFlow ${planConfig.name} subscription`,
            },
            unit_amount: price,
            recurring: {
              interval: billingPeriod === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        }],
        `${process.env.FRONTEND_URL}/dashboard/subscription-plans?success=true&session_id={CHECKOUT_SESSION_ID}`,
        `${process.env.FRONTEND_URL}/dashboard/subscription-plans?canceled=true`,
        {
          userId,
          planId,
          billingPeriod,
        }
      );

      this.logger.log(`Created checkout session for user ${userId}: ${session.id}`);
      
      return {
        sessionId: session.id,
        url: session.url
      };

    } catch (error) {
      this.logger.error('Error creating checkout session:', error);
      throw new BadRequestException('Failed to create checkout session');
    }
  }

  // Helper method to create free subscription
  private async createFreeSubscription(userId: string, planId: string): Promise<Subscription> {
    const subscription = new this.subscriptionModel({
      userId: new Types.ObjectId(userId),
      stripeSubscriptionId: null, // No Stripe subscription ID for free plan
      stripeCustomerId: null, // No Stripe customer ID for free plan
      plan: planId,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      billingPeriod: 'yearly',
      amount: 0,
      currency: 'USD',
      autoRenew: true,
    });

    return await subscription.save();
  }

  // Helper method to create mock subscription for development when Stripe is not configured
  private async createMockSubscription(userId: string, planId: string, billingPeriod: 'monthly' | 'yearly'): Promise<Subscription> {
    // Define plan configurations
    const planConfigs = {
      standard: {
        name: 'Supplier Standard',
        monthlyPrice: 4900, // $49.00 in cents
        yearlyPrice: 49000, // $490.00 in cents
      },
      premium: {
        name: 'Supplier Enterprise',
        monthlyPrice: 14900, // $149.00 in cents
        yearlyPrice: 149000, // $1490.00 in cents
      },
    };

    const planConfig = planConfigs[planId];
    const price = billingPeriod === 'monthly' 
      ? planConfig.monthlyPrice 
      : planConfig.yearlyPrice;

    const periodLength = billingPeriod === 'monthly' ? 30 : 365;
    const currentPeriodEnd = new Date(Date.now() + periodLength * 24 * 60 * 60 * 1000);

    const subscription = new this.subscriptionModel({
      userId: new Types.ObjectId(userId),
      stripeSubscriptionId: `mock_sub_${Date.now()}`, // Mock subscription ID
      stripeCustomerId: `mock_cus_${Date.now()}`, // Mock customer ID
      plan: planId,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: currentPeriodEnd,
      billingPeriod: billingPeriod,
      amount: price / 100, // Convert from cents to dollars
      currency: 'USD',
      autoRenew: true,
      lastPaymentDate: new Date(),
      lastPaymentAmount: price / 100,
      nextPaymentDate: currentPeriodEnd,
    });

    return await subscription.save();
  }

  // NEW: Construct webhook event from Stripe
  async constructWebhookEvent(rawBody: Buffer, signature: string): Promise<any> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret not configured');
    }

    try {
      return this.stripeService.constructWebhookEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      this.logger.error('Webhook signature verification failed:', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  // NEW: Handle Stripe webhook events
  async handleWebhookEvent(event: any): Promise<{ received: boolean }> {
    this.logger.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Error handling webhook event ${event.type}:`, error);
      throw error;
    }
  }

  // Webhook event handlers
  private async handleCheckoutSessionCompleted(session: any): Promise<void> {
    const metadata = session.metadata;
    if (!metadata?.userId || !metadata?.planId) {
      this.logger.error('Missing metadata in checkout session');
      return;
    }

    try {
      // Create subscription record
      const subscription = new this.subscriptionModel({
        userId: new Types.ObjectId(metadata.userId),
        stripeSubscriptionId: session.subscription,
        stripeCustomerId: session.customer,
        plan: metadata.planId,
        status: SubscriptionStatus.ACTIVE,
        billingPeriod: metadata.billingPeriod,
        amount: session.amount_total / 100, // Convert from cents
        currency: session.currency.toUpperCase(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (metadata.billingPeriod === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
        autoRenew: true,
      });

      await subscription.save();
      this.logger.log(`Created subscription for user ${metadata.userId}`);
    } catch (error) {
      this.logger.error('Error creating subscription from checkout session:', error);
    }
  }

  private async handleSubscriptionCreated(subscription: any): Promise<void> {
    this.logger.log(`Subscription created: ${subscription.id}`);
    // Additional handling if needed
  }

  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    try {
      const dbSubscription = await this.subscriptionModel.findOne({
        stripeSubscriptionId: subscription.id
      });

      if (dbSubscription) {
        dbSubscription.status = this.mapStripeStatus(subscription.status);
        dbSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
        dbSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        await dbSubscription.save();
        
        this.logger.log(`Updated subscription: ${subscription.id}`);
      }
    } catch (error) {
      this.logger.error('Error updating subscription:', error);
    }
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    try {
      await this.subscriptionModel.updateOne(
        { stripeSubscriptionId: subscription.id },
        { status: SubscriptionStatus.CANCELLED }
      );
      
      this.logger.log(`Cancelled subscription: ${subscription.id}`);
    } catch (error) {
      this.logger.error('Error cancelling subscription:', error);
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    this.logger.log(`Payment succeeded for invoice: ${invoice.id}`);
    // Additional handling if needed (e.g., send confirmation email)
  }

  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    this.logger.log(`Payment failed for invoice: ${invoice.id}`);
    // Handle failed payment (e.g., notify user, retry logic)
  }

  private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'past_due':
        return SubscriptionStatus.INACTIVE;
      case 'canceled':
        return SubscriptionStatus.CANCELLED;
      case 'unpaid':
        return SubscriptionStatus.INACTIVE;
      default:
        return SubscriptionStatus.PENDING;
    }
  }

  // Legacy methods for backward compatibility
  async createPaymentTransaction(
    userId: string,
    transactionDto: CreatePaymentTransactionDto,
  ): Promise<PaymentTransaction> {
    return this.createTransaction(userId, transactionDto);
  }

  async getPaymentTransactions(userId: string, filters: any): Promise<any> {
    return this.getAllTransactions(userId, filters);
  }

  async getBulkSubscriptions(userIds: string[]): Promise<any[]> {
    try {
      const subscriptions = await this.subscriptionModel
        .find({ vendorId: { $in: userIds.map(id => new Types.ObjectId(id)) } })
        .sort({ createdAt: -1 });

      return subscriptions;
    } catch (error) {
      this.logger.error('Failed to get bulk subscriptions:', error);
      throw error;
    }
  }

  // Helper methods
  private formatSubscriptionResponse(stripeSubscription: Stripe.Subscription, dbSubscription: any): any {
    const price = stripeSubscription.items.data[0].price;
    
    return {
      id: stripeSubscription.id,
      userId: dbSubscription.vendorId,
      planId: price.id,
      plan: {
        id: price.id,
        name: (price.product as Stripe.Product).name || this.getPlanName(price.id),
        description: (price.product as Stripe.Product).description || '',
        price: (price.unit_amount || 0) / 100,
        currency: price.currency,
        interval: price.recurring?.interval || 'month',
        features: this.getPlanFeatures(price.id),
        maxOrders: this.getPlanLimits(price.id).orders,
        maxUsers: this.getPlanLimits(price.id).users,
        isPopular: this.isPlanPopular(price.id),
        isActive: price.active,
      },
      status: stripeSubscription.status,
      currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      createdAt: new Date(stripeSubscription.created * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private mapStripePlanToEnum(priceId: string): SubscriptionPlan {
    if (priceId.includes('basic')) return SubscriptionPlan.BASIC;
    if (priceId.includes('enterprise')) return SubscriptionPlan.ENTERPRISE;
    return SubscriptionPlan.PROFESSIONAL;
  }

  private mapStripeStatusToEnum(status: string): SubscriptionStatus {
    switch (status) {
      case 'active': return SubscriptionStatus.ACTIVE;
      case 'canceled': return SubscriptionStatus.INACTIVE;
      case 'past_due': return SubscriptionStatus.INACTIVE;
      default: return SubscriptionStatus.ACTIVE;
    }
  }

  private getPlanFeatures(planId: string): string[] {
    // Using actual Stripe Price IDs
    if (planId === 'price_1S2pFgRvqRGNyKm56y3yEVLE') { // Basic Plan
      return [
        'Up to 100 orders per month',
        'Basic analytics',
        'Email support',
        'Standard integrations',
        '1 user account'
      ];
    }
    
    if (planId === 'price_1S2pFiRvqRGNyKm50DI9KSaO') { // Enterprise Plan
      return [
        'Unlimited orders',
        'Advanced analytics & reporting',
        'Dedicated support',
        'Full API access',
        'Custom integrations',
        'Unlimited users',
        'White-label options',
        'SLA guarantee'
      ];
    }

    // Professional Plan (price_1S2pFhRvqRGNyKm57FE9P4lc) or default
    return [
      'Up to 1,000 orders per month',
      'Advanced analytics',
      'Priority support',
      'API access',
      'Custom integrations',
      'Up to 10 users'
    ];
  }

  private getPlanLimits(planId: string): { orders: number; users: number; storage: number } {
    if (planId === 'price_1S2pFgRvqRGNyKm56y3yEVLE') { // Basic Plan
      return { orders: 100, users: 1, storage: 1 };
    }
    
    if (planId === 'price_1S2pFiRvqRGNyKm50DI9KSaO') { // Enterprise Plan
      return { orders: -1, users: -1, storage: 100 }; // -1 means unlimited
    }

    // Professional Plan (price_1S2pFhRvqRGNyKm57FE9P4lc) or default
    return { orders: 1000, users: 10, storage: 10 };
  }

  private getPlanName(planId: string): string {
    if (planId === 'price_1S2pFgRvqRGNyKm56y3yEVLE') return 'Basic';
    if (planId === 'price_1S2pFiRvqRGNyKm50DI9KSaO') return 'Enterprise';
    return 'Professional'; // price_1S2pFhRvqRGNyKm57FE9P4lc or default
  }

  private isPlanPopular(planId: string): boolean {
    return planId === 'price_1S2pFhRvqRGNyKm57FE9P4lc'; // Professional Plan
  }

  async getPaymentStats(tenantId: string) {
    try {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      // Get total revenue
      const totalRevenue = await this.paymentTransactionModel.aggregate([
        { $match: { vendorId: new Types.ObjectId(tenantId), status: PaymentStatus.SUCCEEDED } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      // Get this month's revenue
      const thisMonthRevenue = await this.paymentTransactionModel.aggregate([
        { 
          $match: { 
            vendorId: new Types.ObjectId(tenantId), 
            status: PaymentStatus.SUCCEEDED,
            createdAt: { $gte: currentMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      // Get last month's revenue
      const lastMonthRevenue = await this.paymentTransactionModel.aggregate([
        { 
          $match: { 
            vendorId: new Types.ObjectId(tenantId), 
            status: PaymentStatus.SUCCEEDED,
            createdAt: { $gte: lastMonth, $lte: lastMonthEnd }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      // Calculate growth percentage
      const thisMonthTotal = thisMonthRevenue[0]?.total || 0;
      const lastMonthTotal = lastMonthRevenue[0]?.total || 0;
      const revenueGrowth = lastMonthTotal > 0 
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
        : thisMonthTotal > 0 ? 100 : 0;

      // Get transaction counts
      const totalTransactions = await this.paymentTransactionModel.countDocuments({
        vendorId: new Types.ObjectId(tenantId)
      });

      const completedTransactions = await this.paymentTransactionModel.countDocuments({
        vendorId: new Types.ObjectId(tenantId),
        status: PaymentStatus.SUCCEEDED
      });

      const pendingTransactions = await this.paymentTransactionModel.countDocuments({
        vendorId: new Types.ObjectId(tenantId),
        status: PaymentStatus.PENDING
      });

      return {
        totalRevenue: totalRevenue[0]?.total || 0,
        thisMonthRevenue: thisMonthTotal,
        lastMonthRevenue: lastMonthTotal,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        totalTransactions,
        completedTransactions,
        pendingTransactions,
        successRate: totalTransactions > 0 ? Math.round((completedTransactions / totalTransactions) * 100) : 0
      };
    } catch (error) {
      this.logger.error('Error getting payment stats:', error);
      throw new BadRequestException('Failed to get payment statistics');
    }
  }
}
