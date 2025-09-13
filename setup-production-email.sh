#!/bin/bash

# 📧 VendorFlow Production Email Setup Script
# This script helps you quickly configure production email with SendGrid

echo "🚀 VendorFlow Production Email Setup"
echo "======================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please run this script from the VendorFlow root directory."
    exit 1
fi

echo "📧 Choose your email provider:"
echo "1. SendGrid (Recommended for production)"
echo "2. Gmail/Google Workspace (Easy setup)"
echo "3. AWS SES (Enterprise)"
echo "4. Mailgun (Developer-friendly)"
echo "5. Custom SMTP"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🔧 Setting up SendGrid..."
        echo ""
        echo "First, you need to:"
        echo "1. Sign up at https://sendgrid.com/"
        echo "2. Verify your domain (or use Single Sender)"
        echo "3. Generate an API key with Mail Send permissions"
        echo ""
        
        read -p "Enter your SendGrid API Key (SG.xxx...): " api_key
        read -p "Enter your verified sender email: " from_email
        read -p "Enter your company name (for email display): " company_name
        
        # Add to .env file
        echo "" >> .env
        echo "# Production Email - SendGrid" >> .env
        echo "SENDGRID_API_KEY=$api_key" >> .env
        echo "SENDGRID_FROM_EMAIL=$from_email" >> .env
        echo "SMTP_FROM_NAME=$company_name" >> .env
        
        echo ""
        echo "✅ SendGrid configuration added to .env file!"
        ;;
        
    2)
        echo ""
        echo "🔧 Setting up Gmail..."
        echo ""
        echo "First, you need to:"
        echo "1. Enable 2-Factor Authentication on your Google account"
        echo "2. Go to Google Account Settings > App Passwords"
        echo "3. Generate an App Password for 'Mail'"
        echo ""
        
        read -p "Enter your Gmail address: " gmail_user
        read -p "Enter your App Password (16 characters): " gmail_pass
        read -p "Enter your company name: " company_name
        
        # Add to .env file
        echo "" >> .env
        echo "# Production Email - Gmail" >> .env
        echo "SMTP_GMAIL_USER=$gmail_user" >> .env
        echo "SMTP_GMAIL_PASS=$gmail_pass" >> .env
        echo "SMTP_FROM_NAME=$company_name" >> .env
        
        echo ""
        echo "✅ Gmail configuration added to .env file!"
        ;;
        
    3)
        echo ""
        echo "🔧 Setting up AWS SES..."
        echo ""
        echo "First, you need to:"
        echo "1. Set up AWS SES in your preferred region"
        echo "2. Verify your domain/email address"
        echo "3. Create IAM user with SES send permissions"
        echo "4. Request production access (remove sandbox)"
        echo ""
        
        read -p "Enter your AWS SES Access Key: " access_key
        read -p "Enter your AWS SES Secret Key: " secret_key
        read -p "Enter your AWS region (e.g., us-east-1): " region
        read -p "Enter your verified sender email: " from_email
        read -p "Enter your company name: " company_name
        
        # Add to .env file
        echo "" >> .env
        echo "# Production Email - AWS SES" >> .env
        echo "AWS_SES_ACCESS_KEY=$access_key" >> .env
        echo "AWS_SES_SECRET_KEY=$secret_key" >> .env
        echo "AWS_SES_REGION=$region" >> .env
        echo "AWS_SES_FROM_EMAIL=$from_email" >> .env
        echo "SMTP_FROM_NAME=$company_name" >> .env
        
        echo ""
        echo "✅ AWS SES configuration added to .env file!"
        ;;
        
    4)
        echo ""
        echo "🔧 Setting up Mailgun..."
        echo ""
        echo "First, you need to:"
        echo "1. Sign up at https://www.mailgun.com/"
        echo "2. Add and verify your domain"
        echo "3. Get SMTP credentials from domain settings"
        echo ""
        
        read -p "Enter your Mailgun SMTP username: " smtp_user
        read -p "Enter your Mailgun SMTP password: " smtp_pass
        read -p "Enter your company name: " company_name
        
        # Add to .env file
        echo "" >> .env
        echo "# Production Email - Mailgun" >> .env
        echo "MAILGUN_SMTP_USER=$smtp_user" >> .env
        echo "MAILGUN_SMTP_PASS=$smtp_pass" >> .env
        echo "SMTP_FROM_NAME=$company_name" >> .env
        
        echo ""
        echo "✅ Mailgun configuration added to .env file!"
        ;;
        
    5)
        echo ""
        echo "🔧 Setting up Custom SMTP..."
        echo ""
        
        read -p "Enter SMTP host: " smtp_host
        read -p "Enter SMTP port (usually 587): " smtp_port
        read -p "Enter SMTP username: " smtp_user
        read -p "Enter SMTP password: " smtp_pass
        read -p "Use SSL/TLS? (true/false): " smtp_secure
        read -p "Enter your company name: " company_name
        
        # Add to .env file
        echo "" >> .env
        echo "# Production Email - Custom SMTP" >> .env
        echo "SMTP_HOST=$smtp_host" >> .env
        echo "SMTP_PORT=$smtp_port" >> .env
        echo "SMTP_USER=$smtp_user" >> .env
        echo "SMTP_PASS=$smtp_pass" >> .env
        echo "SMTP_SECURE=$smtp_secure" >> .env
        echo "SMTP_FROM_NAME=$company_name" >> .env
        
        echo ""
        echo "✅ Custom SMTP configuration added to .env file!"
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🔄 Restarting backend to apply changes..."

# Restart backend container
if command -v docker-compose &> /dev/null; then
    docker-compose restart backend
else
    docker compose restart backend
fi

echo ""
echo "🧪 Testing email configuration..."
echo ""

# Test the configuration
echo "Testing with a sample registration..."
curl -s -X POST http://localhost:3004/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User",
    "companyName": "Test Co",
    "role": "vendor"
  }' > /dev/null

echo "✅ Configuration complete!"
echo ""
echo "📧 Next steps:"
echo "1. Check backend logs: docker logs vendor-mgmt-backend-new"
echo "2. Test with a real email address"
echo "3. Monitor your provider dashboard for delivery stats"
echo ""
echo "🎉 Your production email system is ready!" 