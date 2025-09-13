import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey === 'your-stripe-secret-key' || stripeKey === 'sk_test_your_secret_key_here') {
      this.logger.warn('Stripe secret key not configured properly. Payment features will be disabled.');
      this.stripe = null as any;
    } else {
      this.stripe = new Stripe(stripeKey);
    }
  }

  // Check if Stripe is properly configured
  isConfigured(): boolean {
    return this.stripe !== null;
  }

  // Customer Management
  async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
      });
      return customer;
    } catch (error) {
      this.logger.error('Failed to create Stripe customer:', error);
      throw error;
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer as Stripe.Customer;
    } catch (error) {
      this.logger.error('Failed to retrieve Stripe customer:', error);
      throw error;
    }
  }

  // Subscription Management
  async createSubscription(
    customerId: string,
    priceId: string,
    paymentMethodId?: string,
  ): Promise<Stripe.Subscription> {
    try {
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      };

      if (paymentMethodId) {
        subscriptionParams.default_payment_method = paymentMethodId;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionParams);
      return subscription;
    } catch (error) {
      this.logger.error('Failed to create subscription:', error);
      throw error;
    }
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price.product'],
      });
      return subscription;
    } catch (error) {
      this.logger.error('Failed to retrieve subscription:', error);
      throw error;
    }
  }

  async updateSubscription(
    subscriptionId: string,
    priceId: string,
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: priceId,
          },
        ],
        proration_behavior: 'create_prorations',
      });
      
      return updatedSubscription;
    } catch (error) {
      this.logger.error('Failed to update subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      return subscription;
    } catch (error) {
      this.logger.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
      return subscription;
    } catch (error) {
      this.logger.error('Failed to reactivate subscription:', error);
      throw error;
    }
  }

  // Payment Methods
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      return paymentMethod;
    } catch (error) {
      this.logger.error('Failed to attach payment method:', error);
      throw error;
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);
      return paymentMethod;
    } catch (error) {
      this.logger.error('Failed to detach payment method:', error);
      throw error;
    }
  }

  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return paymentMethods.data;
    } catch (error) {
      this.logger.error('Failed to list payment methods:', error);
      throw error;
    }
  }

  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      return customer;
    } catch (error) {
      this.logger.error('Failed to set default payment method:', error);
      throw error;
    }
  }

  // Invoices
  async listInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit,
      });
      return invoices.data;
    } catch (error) {
      this.logger.error('Failed to list invoices:', error);
      throw error;
    }
  }

  async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId);
      return invoice;
    } catch (error) {
      this.logger.error('Failed to retrieve invoice:', error);
      throw error;
    }
  }

  async downloadInvoice(invoiceId: string): Promise<string> {
    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId);
      return invoice.hosted_invoice_url || invoice.invoice_pdf || '';
    } catch (error) {
      this.logger.error('Failed to get invoice download URL:', error);
      throw error;
    }
  }

  // Products and Prices
  async listPrices(): Promise<Stripe.Price[]> {
    try {
      const prices = await this.stripe.prices.list({
        expand: ['data.product'],
        active: true,
      });
      return prices.data;
    } catch (error) {
      this.logger.error('Failed to list prices:', error);
      throw error;
    }
  }

  async getPrice(priceId: string): Promise<Stripe.Price> {
    try {
      const price = await this.stripe.prices.retrieve(priceId, {
        expand: ['product'],
      });
      return price;
    } catch (error) {
      this.logger.error('Failed to retrieve price:', error);
      throw error;
    }
  }

  // Setup Intent for adding payment methods
  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
      });
      return setupIntent;
    } catch (error) {
      this.logger.error('Failed to create setup intent:', error);
      throw error;
    }
  }

  // Payment Intents for processing payments
  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    description?: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        description,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to create payment intent:', error);
      throw error;
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId,
        { expand: ['charges'] }
      );
      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to retrieve payment intent:', error);
      throw error;
    }
  }

  async getPaymentIntents(limit: number = 10): Promise<Stripe.ApiList<Stripe.PaymentIntent>> {
    try {
      const paymentIntents = await this.stripe.paymentIntents.list({
        limit,
        expand: ['data.charges'],
      });
      return paymentIntents;
    } catch (error) {
      this.logger.error('Failed to list payment intents:', error);
      throw error;
    }
  }

  // Usage Records (for metered billing) - TODO: Implement when needed
  // async createUsageRecord(...) { ... }

  // Checkout Session Management
  async createCheckoutSession(
    customerId: string,
    lineItems: any[],
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: metadata || {},
        allow_promotion_codes: true,
        billing_address_collection: 'required',
      });
      
      return session;
    } catch (error) {
      this.logger.error('Failed to create checkout session:', error);
      throw error;
    }
  }

  // Webhook Event Construction
  constructWebhookEvent(
    rawBody: Buffer,
    signature: string,
    webhookSecret: string
  ): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      this.logger.error('Failed to construct webhook event:', error);
      throw error;
    }
  }
} 