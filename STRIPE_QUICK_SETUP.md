# 🚀 Quick Stripe Setup (Fix 404 Errors)

## 🔴 Current Issue
The payment endpoints are returning 404 errors because Stripe environment variables are missing.

## ⚡ Quick Fix (5 minutes)

### Step 1: Get Stripe Test Keys
1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Sign up for a free account
3. Go to **Developers** → **API Keys**
4. Copy your **Publishable key** (starts with `pk_test_`)
5. Copy your **Secret key** (starts with `sk_test_`)

### Step 2: Backend Environment Variables
Create or update `apps/backend/.env`:

```bash
# Add these lines to your .env file
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_temp_for_now
```

### Step 3: Frontend Environment Variables  
Create or update `apps/frontend/.env.local`:

```bash
# Add this line to your .env.local file
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
```

### Step 4: Restart Servers
```bash
# Terminal 1: Restart Backend
cd apps/backend
npm run start:dev

# Terminal 2: Restart Frontend  
cd apps/frontend
npm run dev
```

## 🧪 Test It Works

1. Go to `/dashboard/vendor/payments`
2. You should now see:
   ✅ Available subscription plans
   ✅ Current subscription info
   ✅ "Add Payment Method" button works

## 🎯 What You Get

- **Real Stripe Integration**: Production-ready payment processing
- **Subscription Management**: Plan changes, cancellations, reactivations
- **Payment Methods**: Add/remove cards securely
- **Billing History**: View and download invoices
- **Usage Tracking**: Monitor plan limits

## 🔧 For Production

### Create Products in Stripe Dashboard
1. Go to **Products** → **Add product**
2. Create three subscription products:

#### Basic Plan
- Name: "Basic Plan"
- Price: $19/month
- Copy the Price ID (e.g., `price_1234567890`)

#### Professional Plan  
- Name: "Professional Plan"
- Price: $49/month
- Copy the Price ID

#### Enterprise Plan
- Name: "Enterprise Plan" 
- Price: $149/month
- Copy the Price ID

### Set Up Webhooks
1. Go to **Developers** → **Webhooks**
2. Add endpoint: `https://your-domain.com/api/payments/webhooks/stripe`
3. Select events:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the signing secret and add to `.env` as `STRIPE_WEBHOOK_SECRET`

## 🆘 Still Having Issues?

### Check Common Problems:
1. **Environment variables not loaded**: Restart both servers after adding .env files
2. **Wrong API keys**: Make sure you're using the correct test keys from Stripe
3. **Missing .env files**: Ensure files are in the correct directories
4. **Port conflicts**: Make sure backend is running on port 3004

### Test with These Cards:
- **Valid**: `4242424242424242`
- **Declined**: `4000000000000002`  
- **Requires 3D Secure**: `4000002500003155`

---

**Once this is working, you'll have a fully functional payment system! 🎉** 