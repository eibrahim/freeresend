# FreeResend Setup Guide

This guide will help you set up FreeResend from scratch.

## 1. Prerequisites Setup

### Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key
3. Go to SQL Editor and run the contents of `database.sql`

### AWS SES Setup

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Request production access (move out of sandbox)
3. Create an IAM user with SES permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "ses:VerifyDomainIdentity",
        "ses:GetIdentityVerificationAttributes",
        "ses:DeleteIdentity",
        "ses:CreateConfigurationSet",
        "ses:VerifyDomainDkim",
        "ses:GetIdentityDkimAttributes"
      ],
      "Resource": "*"
    }
  ]
}
```

### Digital Ocean (Optional)

1. Create an API token at [Digital Ocean](https://cloud.digitalocean.com/account/api/tokens)
2. Add your domains to DO's DNS management

## 2. Environment Configuration

1. Copy the example environment file:

```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` with your actual values:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Digital Ocean (optional)
DO_API_TOKEN=your-do-token

# Admin User
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-password

# Security
NEXTAUTH_SECRET=generate-a-long-random-string-here
```

## 3. Installation

```bash
# Install dependencies
npm install

# Initialize default admin user
curl -X POST http://localhost:3000/api/setup

# Start development server
npm run dev
```

## 4. First Steps

1. Visit `http://localhost:3000`
2. Login with your admin credentials
3. Add your first domain
4. Set up DNS records (automatic with DO, or manual)
5. Verify your domain
6. Create an API key
7. Start sending emails!

## 5. Testing the API

Test with curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Send an email (replace with your API key)
curl -X POST http://localhost:3000/api/emails \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@yourdomain.com",
    "to": ["recipient@example.com"],
    "subject": "Test Email",
    "html": "<h1>Hello from FreeResend!</h1>"
  }'
```

## 6. Production Deployment

### Option 1: Vercel

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

### Option 2: Docker

```bash
# Build image
docker build -t freeresend .

# Run container
docker run -p 3000:3000 --env-file .env.local freeresend
```

### Option 3: Traditional Server

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 7. Domain DNS Records

When you add a domain, you'll need these DNS records:

### For Amazon SES Verification

```
Type: TXT
Name: _amazonses.yourdomain.com
Value: [verification-token-from-ses]
```

### For Email Receiving (if needed)

```
Type: MX
Name: yourdomain.com
Value: 10 inbound-smtp.us-east-1.amazonaws.com
```

### For SPF

```
Type: TXT
Name: yourdomain.com
Value: v=spf1 include:amazonses.com ~all
```

### For DMARC

```
Type: TXT
Name: _dmarc.yourdomain.com
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

## 8. Troubleshooting

### Common Issues

1. **Database connection fails**

   - Check Supabase credentials
   - Ensure database schema is created

2. **AWS SES errors**

   - Verify AWS credentials
   - Check SES account status (sandbox vs production)
   - Confirm IAM permissions

3. **Domain verification fails**

   - Check DNS records are properly set
   - Wait for DNS propagation (up to 48 hours)
   - Verify domain ownership in DNS provider

4. **API key authentication fails**
   - Ensure domain is verified before creating keys
   - Check API key format: `frs_[id]_[secret]`

## 9. Support

- Check the main README.md for API documentation
- Review the database.sql for schema details
- Look at the code in `/src/lib/` for implementation details
