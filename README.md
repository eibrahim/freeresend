# FreeResend

**A self-hosted, open-source alternative to Resend for sending transactional emails.**

FreeResend allows you to host your own email service using Amazon SES and optionally Digital Ocean for DNS management. It provides a Resend-compatible API so you can use it as a drop-in replacement.

> 📰 **Stay updated**: Get the latest frontend development insights delivered weekly with [**Frontend Weekly**](https://www.frontendweekly.co/) - curated by the author of FreeResend!

## Features

- 🚀 **100% Resend-compatible** - True drop-in replacement using environment variables
- 🏠 **Self-hosted** - Full control over your email infrastructure
- 📧 **Amazon SES integration** - Reliable email delivery with DKIM support
- 🌐 **Automatic DNS setup** - Integration with Digital Ocean for DNS record creation
- 🔐 **DKIM authentication** - Automatic DKIM key generation and DNS record creation
- 🔑 **API key management** - Generate and manage multiple API keys per domain
- 📊 **Email logging** - Track all sent emails with delivery status and logs
- 🎯 **Domain verification** - Automated domain verification with SES
- 🔒 **Secure** - JWT-based authentication and robust API key validation
- 🐳 **Docker ready** - Containerized deployment with Docker Compose
- 📝 **Comprehensive logging** - Detailed email logs with webhook support

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted)
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

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://username:password@hostname:port/database

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
        "ses:CreateConfigurationSet",
        "ses:VerifyDomainDkim",
        "ses:GetIdentityDkimAttributes"
      ],
      "Resource": "*"
    }
  ]
}
```

> **Note**: The DKIM permissions (`ses:VerifyDomainDkim`, `ses:GetIdentityDkimAttributes`) are required for automatic DKIM setup.

## Digital Ocean DNS Setup (Optional)

If you want automatic DNS record creation:

1. Create a Digital Ocean API token with read/write access
2. Add your domains to Digital Ocean's DNS management
3. Set the `DO_API_TOKEN` environment variable

## Using FreeResend with Resend SDK

FreeResend is **100% compatible** with the [Resend Node.js SDK](https://github.com/resend/resend-node)!

### Method 1: Environment Variable (Recommended)

Set the `RESEND_BASE_URL` environment variable:

```bash
export RESEND_BASE_URL="https://your-freeresend-domain.com/api"
```

Then use Resend exactly as before:

```javascript
import { Resend } from "resend";

// No changes needed - FreeResend API key works with Resend SDK!
const resend = new Resend("your-freeresend-api-key");

const { data, error } = await resend.emails.send({
  from: "onboarding@yourdomain.com",
  to: ["user@example.com"],
  subject: "Hello World",
  html: "<strong>it works!</strong>",
});
```

### Method 2: Direct API

```javascript
const response = await fetch("https://your-freeresend-domain.com/api/emails", {
  method: "POST",
  headers: {
    Authorization: "Bearer your-freeresend-api-key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: "onboarding@yourdomain.com",
    to: ["user@example.com"],
    subject: "Hello World",
    html: "<strong>it works!</strong>",
  }),
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

   - **TXT record** - `_amazonses.yourdomain.com` for SES domain verification
   - **MX record** - `yourdomain.com` for receiving emails via SES
   - **SPF record** - `yourdomain.com` for sender policy framework
   - **DMARC record** - `_dmarc.yourdomain.com` for email authentication policy
   - **DKIM records** - 3 CNAME records for `*._domainkey.yourdomain.com` for email signing

3. **Verify domain** - Click "Check Verification" once DNS records are live
4. **Create API key** - Generate API keys for your verified domain
5. **Start sending** - Use the API key with FreeResend or Resend SDK

## Testing Your Setup

FreeResend includes test scripts to verify your installation:

### Quick Test

```bash
# Test with cURL (update variables in script first)
./test-curl.sh
```

### Comprehensive Test

```bash
# Test direct API + Resend SDK compatibility + Email logs
node test-email.js
```

Both scripts will:

- ✅ Send test emails using your API key
- ✅ Verify Resend SDK compatibility
- ✅ Check email logs functionality
- 📧 Send actual emails to your inbox for verification

## Troubleshooting

### Common Issues

**Q: Getting "Invalid API key" errors**

- ✅ Make sure you copied the **complete API key** from the green success message (not the masked version from the table)
- ✅ API keys have format: `frs_keyId_secretPart` (3 parts separated by underscores)

**Q: Digital Ocean DNS automation not working**

- ✅ Verify your DO API token has **Read & Write** access to **Domains** and **Domain Records**
- ✅ Ensure your domain is added to Digital Ocean's DNS management
- ✅ Test token: `curl -H "Authorization: Bearer YOUR_TOKEN" https://api.digitalocean.com/v2/domains`

**Q: Domain verification stuck at "pending"**

- ✅ DNS propagation takes 5-30 minutes - be patient!
- ✅ Check DNS records: `dig TXT _amazonses.yourdomain.com`
- ✅ Ensure all DNS records are created properly

**Q: AWS SES permissions error**

- ✅ Make sure your IAM policy includes **DKIM permissions**: `ses:VerifyDomainDkim` and `ses:GetIdentityDkimAttributes`
- ✅ Verify your AWS account is out of SES sandbox mode

**Q: Resend SDK not working with FreeResend**

- ✅ Set environment variable: `export RESEND_BASE_URL="https://your-domain.com/api"`
- ✅ Use FreeResend API key (starts with `frs_`), not Resend API key

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

## Repository Structure

```
freeresend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   │   ├── auth/       # Authentication endpoints
│   │   │   ├── domains/    # Domain management
│   │   │   ├── api-keys/   # API key management
│   │   │   ├── emails/     # Email sending & logs
│   │   │   └── webhooks/   # SES webhook handlers
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Main dashboard page
│   ├── components/         # React components
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── LoginForm.tsx   # Authentication
│   │   └── *Tab.tsx        # Tab components
│   ├── contexts/           # React contexts
│   └── lib/                # Core business logic
│       ├── supabase.ts     # Database client
│       ├── auth.ts         # Authentication logic
│       ├── ses.ts          # Amazon SES integration
│       ├── digitalocean.ts # DNS automation
│       ├── domains.ts      # Domain management
│       ├── api-keys.ts     # API key logic
│       └── middleware.ts   # API middleware
├── database.sql            # Database schema
├── docker-compose.yml      # Development setup
├── test-email.js          # Comprehensive test script
├── test-curl.sh           # Quick cURL test
└── README.md              # This file
```

## Contributing

We welcome contributions! Here's how to get started:

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**: `git clone https://github.com/eibrahim/freeresend.git`
3. **Install dependencies**: `npm install`
4. **Set up environment** following the Quick Start guide above
5. **Run tests**: `node test-email.js`
6. **Start development**: `npm run dev`

### Contributing Guidelines

- 🐛 **Bug fixes** - Always welcome with test cases
- ✨ **New features** - Open an issue first to discuss
- 📝 **Documentation** - Improvements always appreciated
- 🧪 **Tests** - Required for new features
- 💻 **Code style** - Follow existing patterns

### Pull Request Process

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes with clear, descriptive commits
3. Add tests for new functionality
4. Update documentation if needed
5. Submit a pull request with a clear description

### Reporting Issues

When reporting bugs, please include:

- Your environment (Node.js version, OS, etc.)
- Steps to reproduce the issue
- Expected vs actual behavior
- Relevant error messages or logs

## License

MIT License - see LICENSE file for details.

## Support

- 📖 **Documentation**: Check SETUP.md for detailed setup instructions
- 🐛 **Issues**: Report bugs via [GitHub Issues](https://github.com/eibrahim/freeresend/issues)
- 💡 **Feature Requests**: Suggest improvements via GitHub Issues
- 🚀 **Professional Support**: Custom development and enterprise support available via [EliteCoders](https://elitecoders.co/)

## Roadmap

- [ ] Email templates support
- [ ] Webhook retry mechanism
- [ ] Email analytics dashboard
- [ ] Multi-user support
- [ ] Email scheduling
- [ ] SMTP server support
- [ ] Email campaign management

---

## About the Author

FreeResend is built and maintained by **[Emad Ibrahim](https://x.com/eibrahim)** - a software engineer and entrepreneur passionate about creating developer tools and open-source solutions.

### 👨‍💻 **Connect with Emad**

- 🐦 **Twitter**: [@eibrahim](https://x.com/eibrahim) - Follow for updates on FreeResend and web development insights
- 📧 **Email**: [eibrahim@gmail.com](mailto:eibrahim@gmail.com)
- 📰 **Newsletter**: [Frontend Weekly](https://www.frontendweekly.co/) - The best frontend development articles delivered weekly
- 💼 **Professional Services**: Custom development and enterprise support via [EliteCoders](https://elitecoders.co/)

### 🚀 **Need Custom Development?**

If you need help with:

- 🏗️ **Custom email infrastructure** modifications
- 🚀 **Enterprise deployments** and scaling
- 🔧 **Integration** with your existing systems
- 🎯 **Feature development** beyond the roadmap

**[Get in touch with EliteCoders →](https://elitecoders.co/)**

_Building powerful software solutions for businesses worldwide_ 🌎
