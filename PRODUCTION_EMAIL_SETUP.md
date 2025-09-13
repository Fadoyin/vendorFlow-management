# 📧 Production Email Setup Guide

Your VendorFlow system now supports **multiple production-ready email providers** with automatic failover and retry logic.

## 🚀 Quick Setup Options

### Option 1: Gmail/Google Workspace (Easiest)
**Best for:** Small to medium scale, quick setup

```bash
# Add to your .env file:
SMTP_GMAIL_USER=your-email@gmail.com
SMTP_GMAIL_PASS=your-app-password-here
SMTP_FROM_NAME=VendorFlow
```

**Setup Steps:**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable **2-Factor Authentication**
3. Go to **App Passwords** section
4. Generate new app password for "Mail"
5. Use the 16-character app password (not your regular password)

---

### Option 2: SendGrid (Recommended for Production)
**Best for:** High volume, professional setup, best deliverability

```bash
# Add to your .env file:
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=VendorFlow
```

**Setup Steps:**
1. Sign up at [SendGrid](https://sendgrid.com/)
2. **Verify your domain** (or use Single Sender for quick start)
3. Go to **Settings > API Keys**
4. Create new API key with **Mail Send** permissions
5. Add your verified sender email address

**Free tier:** 100 emails/day forever

---

### Option 3: Mailgun (Alternative Production)
**Best for:** Developers, good API, reliable delivery

```bash
# Add to your .env file:
MAILGUN_SMTP_USER=postmaster@mg.yourdomain.com
MAILGUN_SMTP_PASS=your-mailgun-smtp-password
SMTP_FROM_NAME=VendorFlow
```

**Setup Steps:**
1. Sign up at [Mailgun](https://www.mailgun.com/)
2. Add and verify your domain
3. Get SMTP credentials from domain settings
4. Use the provided SMTP username and password

**Free tier:** 5,000 emails/month for 3 months

---

### Option 4: AWS SES (Enterprise)
**Best for:** AWS infrastructure, enterprise scale, lowest cost

```bash
# Add to your .env file:
AWS_SES_ACCESS_KEY=your-ses-access-key
AWS_SES_SECRET_KEY=your-ses-secret-key
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=VendorFlow
```

**Setup Steps:**
1. Set up AWS SES in your preferred region
2. Verify your domain/email address
3. Create IAM user with SES send permissions
4. Generate access keys for the IAM user
5. **Request production access** (remove sandbox limits)

**Pricing:** $0.10 per 1,000 emails

---

### Option 5: Custom SMTP
**Best for:** Existing email infrastructure, custom providers

```bash
# Add to your .env file:
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM_NAME=VendorFlow
```

---

## 🔧 Advanced Features

### Automatic Failover
The system automatically tries providers in order:
1. Gmail (if configured)
2. SendGrid (if configured)  
3. Mailgun (if configured)
4. AWS SES (if configured)
5. Custom SMTP (if configured)

### Retry Logic
- **3 automatic retries** with exponential backoff
- **Connection pooling** for better performance
- **Rate limiting** (14 emails/second max)

### Production Monitoring
```typescript
// Health check endpoint
GET /api/health/email

// Response:
{
  "provider": "SendGrid",
  "healthy": true,
  "status": "Connected"
}
```

---

## 🚀 Quick Start (Copy & Paste)

### For Gmail Setup:
```bash
# 1. Copy this to your .env file:
echo 'SMTP_GMAIL_USER=your-email@gmail.com' >> .env
echo 'SMTP_GMAIL_PASS=your-app-password' >> .env
echo 'SMTP_FROM_NAME=VendorFlow' >> .env

# 2. Restart your backend:
docker-compose restart backend
```

### For SendGrid Setup:
```bash
# 1. Copy this to your .env file:
echo 'SENDGRID_API_KEY=SG.your-api-key-here' >> .env
echo 'SENDGRID_FROM_EMAIL=noreply@yourdomain.com' >> .env
echo 'SMTP_FROM_NAME=VendorFlow' >> .env

# 2. Restart your backend:
docker-compose restart backend
```

---

## 🧪 Test Your Setup

After configuration, test with a real registration:

```bash
# Test registration endpoint:
curl -X POST http://localhost:3004/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@yourdomain.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User",
    "companyName": "Test Co",
    "role": "vendor"
  }'
```

**Expected result:** Real email should arrive within 30 seconds!

---

## 📊 Email Templates

Your OTP emails include:
- ✅ **Professional HTML design** with your branding
- ✅ **Plain text fallback** for better deliverability  
- ✅ **Security warnings** and best practices
- ✅ **Mobile-responsive** design
- ✅ **5-minute expiration** clearly displayed

---

## 🔒 Security Best Practices

### Email Security:
- ✅ **SPF records** configured for your domain
- ✅ **DKIM signing** enabled (automatic with SendGrid/SES)
- ✅ **Rate limiting** prevents abuse
- ✅ **Retry logic** with exponential backoff

### Production Checklist:
- [ ] Domain verification completed
- [ ] SPF/DKIM records configured  
- [ ] Production API keys generated
- [ ] Bounce handling configured
- [ ] Monitoring alerts set up

---

## 🆘 Troubleshooting

### Common Issues:

**"Authentication failed"**
- Double-check your API key/password
- For Gmail: Use App Password, not regular password
- For SendGrid: Ensure API key has Mail Send permissions

**"Emails not arriving"**
- Check spam folder
- Verify sender email is properly configured
- Ensure domain verification is complete

**"Rate limited"**
- System automatically handles rate limits
- Check your provider's daily/monthly limits

### Getting Help:
1. Check backend logs: `docker logs vendor-mgmt-backend-new`
2. Test health endpoint: `GET /api/health/email`
3. Verify provider dashboard for delivery stats

---

## 📈 Monitoring & Analytics

### Provider Dashboards:
- **SendGrid:** Real-time delivery analytics
- **Mailgun:** Detailed logs and bounce tracking
- **AWS SES:** CloudWatch metrics integration
- **Gmail:** Basic sending quotas in Google Admin

### VendorFlow Logs:
```bash
# Watch email logs in real-time:
docker logs -f vendor-mgmt-backend-new | grep "Email"

# Expected success log:
# ✅ OTP email sent via SendGrid to user@domain.com (Message ID: abc123)
```

---

## 🎯 Production Deployment

### Environment Variables for Production:
```bash
# Copy to your production .env:
NODE_ENV=production
SENDGRID_API_KEY=SG.your-production-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=YourCompany
```

### Docker Production Build:
```bash
# Build production image:
docker build -t vendorflow-backend:prod apps/backend/

# Deploy with production env:
docker run -d --env-file .env.production vendorflow-backend:prod
```

---

Your **production-ready email system** is now configured! 🎉

**Next Steps:**
1. Choose your preferred provider above
2. Configure the environment variables  
3. Restart your backend
4. Test with a real email
5. Monitor delivery in your provider dashboard

**Need help?** Check the troubleshooting section or contact support. 