# FreeResend

**A self-hosted, open-source alternative to Resend for sending transactional emails.**

FreeResend allows you to host your own email service using Amazon SES and optionally Digital Ocean for DNS management. It provides a Resend-compatible API so you can use it as a drop-in replacement.

## Features

- 🚀 **Resend-compatible API** - Use existing Resend SDKs by just changing the endpoint
- 🏠 **Self-hosted** - Full control over your email infrastructure
- 📧 **Amazon SES integration** - Reliable email delivery through AWS
- 🌐 **Automatic DNS setup** - Integration with Digital Ocean for automatic DNS record creation
- 🔑 **API key management** - Generate and manage multiple API keys per domain
- 📊 **Email logging** - Track all sent emails with delivery status
- 🎯 **Domain verification** - Automated domain verification process
- 🔒 **Secure** - JWT-based authentication and API key validation

## Quick Start

### Prerequisites

- Node.js 18+
- A Supabase project (for database)
- Amazon AWS account with SES access
- Digital Ocean account (optional, for automatic DNS management)

### Installation

1. **Clone and install dependencies:**

```bash
git clone <your-repo>
cd freeresend
npm install
```

2. **Set up environment variables:**

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-jwt-key-here

# Database Configuration (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Digital Ocean API Configuration (optional)
DO_API_TOKEN=your-digitalocean-api-token

# Application Configuration
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-admin-password
```

3. **Set up the database:**

In your Supabase SQL editor, run the contents of `database.sql` to create all necessary tables.

4. **Start the development server:**

```bash
npm run dev
```

Visit `http://localhost:3000` and log in with your admin credentials.

## AWS SES Setup

1. **Verify your AWS account for SES:**

   - Go to AWS SES console
   - Move out of sandbox mode if needed
   - Configure sending limits

2. **Create IAM user with SES permissions:**

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
        "ses:CreateConfigurationSet"
      ],
      "Resource": "*"
    }
  ]
}
```

## Digital Ocean DNS Setup (Optional)

If you want automatic DNS record creation:

1. Create a Digital Ocean API token with read/write access
2. Add your domains to Digital Ocean's DNS management
3. Set the `DO_API_TOKEN` environment variable

## Using FreeResend with Resend SDK

FreeResend is compatible with the Resend SDK. Just change the base URL:

```javascript
import { Resend } from "resend";

const resend = new Resend("your-freeresend-api-key", {
  baseURL: "https://your-freeresend-domain.com/api",
});

const { data, error } = await resend.emails.send({
  from: "onboarding@yourdomain.com",
  to: ["user@example.com"],
  subject: "Hello World",
  html: "<strong>it works!</strong>",
});
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user info

### Domains

- `GET /api/domains` - List all domains
- `POST /api/domains` - Add new domain
- `DELETE /api/domains/{id}` - Delete domain
- `POST /api/domains/{id}/verify` - Check domain verification

### API Keys

- `GET /api/api-keys` - List API keys
- `POST /api/api-keys` - Create new API key
- `DELETE /api/api-keys/{id}` - Delete API key

### Emails (Resend-compatible)

- `POST /api/emails` - Send email
- `GET /api/emails/logs` - Get email logs
- `GET /api/emails/{id}` - Get specific email

### Webhooks

- `POST /api/webhooks/ses` - SES webhook endpoint

## Domain Setup Process

1. **Add domain** in the FreeResend dashboard
2. **DNS Records** will be automatically created (if Digital Ocean is configured) or displayed for manual setup:

   - TXT record for domain verification
   - MX record for receiving emails
   - SPF record for sender authentication
   - DMARC record for email policy

3. **Verify domain** - Click "Check Verification" once DNS records are live
4. **Create API key** - Generate API keys for the verified domain
5. **Start sending emails** using your API key

## Production Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup

- Use a production database (Supabase Pro or self-hosted PostgreSQL)
- Set up proper SSL certificates
- Configure firewall rules
- Set up monitoring and logging
- Configure SES with proper sending limits

### Vercel Deployment

FreeResend can be deployed on Vercel with some configuration:

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

Note: Webhook endpoints might need special configuration for Vercel's serverless environment.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## License

MIT License - see LICENSE file for details.

## Support

- 📖 Documentation: [Your docs URL]
- 🐛 Issues: [GitHub Issues]
- 💬 Discussions: [GitHub Discussions]

## Roadmap

- [ ] Email templates support
- [ ] Webhook retry mechanism
- [ ] Email analytics dashboard
- [ ] Multi-user support
- [ ] Email scheduling
- [ ] SMTP server support
- [ ] Email campaign management
