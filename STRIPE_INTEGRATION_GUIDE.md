# 🔐 Stripe Integration Setup Guide

This guide will help you integrate Stripe payments with VendorFlow for production-ready subscription management.

## 📋 Prerequisites

1. **Stripe Account**: Sign up at [stripe.com](https://stripe.com)
2. **Development Environment**: Node.js, npm/yarn
3. **VendorFlow Project**: This project setup

## 🚀 Step 1: Stripe Account Setup

### 1.1 Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete business verification (for live payments)
3. Access your [Stripe Dashboard](https://dashboard.stripe.com)

### 1.2 Get API Keys
1. In Stripe Dashboard, go to **Developers** → **API Keys**
2. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
3. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

## 🛠️ Step 2: Environment Configuration

### 2.1 Frontend Environment Variables
Create/update `apps/frontend/.env.local`:

```bash
# Stripe Frontend Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### 2.2 Backend Environment Variables
Create/update `apps/backend/.env`:

```bash
# Stripe Backend Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 💰 Step 3: Create Subscription Plans

### 3.1 Create Products in Stripe Dashboard
1. Go to **Products** → **Add Product**
2. Create three products:

#### Basic Plan
- **Name**: Basic Plan
- **Description**: Perfect for small businesses just getting started
- **Pricing**: $19/month (or your preferred price)
- **Price ID**: Copy this for later (e.g., `price_1234567890`)

#### Professional Plan
- **Name**: Professional Plan
- **Description**: Perfect for growing businesses
- **Pricing**: $49/month
- **Price ID**: Copy this for later

#### Enterprise Plan
- **Name**: Enterprise Plan
- **Description**: For large organizations with complex needs
- **Pricing**: $149/month
- **Price ID**: Copy this for later

### 3.2 Update Plan Configuration
Update `apps/backend/src/modules/payments/payments.service.ts` with your actual price IDs:

```typescript
private getPlanFeatures(planId: string): string[] {
  // Replace with your actual Stripe Price IDs
  if (planId === 'price_your_basic_plan_id') {
    return [/* Basic plan features */];
  }
  if (planId === 'price_your_enterprise_plan_id') {
    return [/* Enterprise plan features */];
  }
  return [/* Professional plan features */];
}
```

## 🔗 Step 4: Webhook Configuration

### 4.1 Create Webhook Endpoint
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL: `https://your-domain.com/api/payments/webhooks/stripe`
4. Select these events:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `setup_intent.succeeded`

### 4.2 Get Webhook Secret
1. Click on your created webhook
2. Copy the **Signing secret** (starts with `whsec_`)
3. Add to your backend `.env` file

## 🎨 Step 5: Customize Stripe Elements

### 5.1 Update Branding (Optional)
Update `apps/frontend/src/lib/stripe.ts` to match your brand:

```typescript
export const stripeElementsOptions: StripeElementsOptions = {
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#your-brand-color',
      // ... other customizations
    },
  },
};
```

## 🧪 Step 6: Testing

### 6.1 Test Card Numbers
Use these test cards for development:

- **Visa**: `4242424242424242`
- **Visa (debit)**: `4000056655665556`
- **Mastercard**: `5555555555554444`
- **American Express**: `378282246310005`
- **Declined card**: `4000000000000002`

### 6.2 Test the Integration
1. Start your development servers:
   ```bash
   # Terminal 1: Backend
   cd apps/backend && npm run start:dev
   
   # Terminal 2: Frontend
   cd apps/frontend && npm run dev
   ```

2. Navigate to `/dashboard/vendor/payments`
3. Test the following:
   - View current subscription
   - Change subscription plans
   - Add payment methods
   - View billing history
   - Cancel/reactivate subscription

## 🚦 Step 7: Production Deployment

### 7.1 Switch to Live Mode
1. In Stripe Dashboard, toggle from **Test mode** to **Live mode**
2. Get your live API keys
3. Update environment variables with live keys

### 7.2 Domain Verification
1. Add your production domain to Stripe's allowed domains
2. Update webhook endpoints to use production URLs

### 7.3 Security Checklist
- ✅ Never expose secret keys in frontend code
- ✅ Validate webhook signatures
- ✅ Use HTTPS in production
- ✅ Implement proper error handling
- ✅ Log important events

## 🔧 Step 8: Advanced Configuration

### 8.1 Custom Pricing Models
For usage-based billing, update the service to include:

```typescript
// In PaymentsService
async reportUsage(subscriptionItemId: string, quantity: number) {
  return await this.stripeService.createUsageRecord(
    subscriptionItemId,
    quantity
  );
}
```

### 8.2 Promotional Codes
Add coupon support:

```typescript
// In subscription creation
const subscription = await this.stripeService.createSubscription(
  customerId,
  priceId,
  paymentMethodId,
  { coupon: 'DISCOUNT20' } // Optional coupon
);
```

### 8.3 Tax Calculation
Enable automatic tax calculation in Stripe Dashboard:
1. Go to **Settings** → **Tax**
2. Enable tax collection for your regions

## 📊 Step 9: Monitoring & Analytics

### 9.1 Stripe Dashboard
Monitor your business metrics:
- Revenue and growth
- Customer churn
- Failed payments
- Popular plans

### 9.2 Custom Analytics
Implement custom tracking in your app:

```typescript
// Track subscription events
await analytics.track('subscription_created', {
  userId: user.id,
  planId: subscription.plan.id,
  amount: subscription.plan.price,
});
```

## 🆘 Troubleshooting

### Common Issues

#### 1. "No such customer" Error
- **Cause**: Customer not created in Stripe
- **Solution**: Check customer creation in `getOrCreateStripeCustomer()`

#### 2. Webhook Signature Validation Fails
- **Cause**: Wrong webhook secret or payload modification
- **Solution**: Verify webhook secret and raw body handling

#### 3. Payment Method Not Appearing
- **Cause**: SetupIntent not confirmed properly
- **Solution**: Check Stripe Elements integration and confirm flow

#### 4. Subscription Not Creating
- **Cause**: Invalid price ID or payment method
- **Solution**: Verify price IDs in Stripe Dashboard

### Getting Help
- 📚 [Stripe Documentation](https://stripe.com/docs)
- 💬 [Stripe Support](https://support.stripe.com)
- 🐛 [GitHub Issues](https://github.com/your-repo/issues)

## 🎉 You're Ready!

Your VendorFlow application now has full Stripe integration with:
- ✅ Subscription management
- ✅ Payment method handling
- ✅ Billing history
- ✅ Usage tracking
- ✅ Webhook processing
- ✅ Production-ready security

Happy building! 🚀 