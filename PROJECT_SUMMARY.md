# FreeResend - Project Summary

## Overview

FreeResend is a complete, self-hosted email service that provides a Resend-compatible API. Built with Next.js, it integrates with Amazon SES for email delivery and optionally with Digital Ocean for automatic DNS management.

## Architecture

### Backend Services

- **Next.js API Routes**: RESTful API endpoints
- **Supabase**: PostgreSQL database with RLS
- **Amazon SES**: Email delivery service
- **Digital Ocean**: Automatic DNS management
- **JWT Authentication**: Secure user sessions

### Frontend

- **Next.js 15**: React-based dashboard
- **Tailwind CSS**: Modern UI styling
- **TypeScript**: Type-safe development

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # Authentication endpoints
│   │   ├── domains/        # Domain management
│   │   ├── api-keys/       # API key management
│   │   ├── emails/         # Email sending & logs
│   │   ├── webhooks/       # SES webhook handler
│   │   ├── health/         # Health check
│   │   └── setup/          # Initial setup
│   ├── layout.tsx          # Root layout with AuthProvider
│   └── page.tsx            # Main app entry point
├── components/
│   ├── Dashboard.tsx       # Main dashboard container
│   ├── LoginForm.tsx       # Authentication form
│   ├── DomainsTab.tsx      # Domain management UI
│   ├── ApiKeysTab.tsx      # API key management UI
│   └── EmailLogsTab.tsx    # Email logs & monitoring
├── contexts/
│   └── AuthContext.tsx     # React context for auth state
└── lib/
    ├── api.ts              # Frontend API client
    ├── auth.ts             # User authentication logic
    ├── api-keys.ts         # API key management
    ├── domains.ts          # Domain operations
    ├── ses.ts              # Amazon SES integration
    ├── digitalocean.ts     # DO DNS management
    ├── supabase.ts         # Database client & types
    └── middleware.ts       # API middleware functions
```

## Database Schema

### Tables

- **users**: Admin user accounts
- **domains**: Email sending domains
- **api_keys**: API keys for authentication
- **email_logs**: All sent email records
- **webhook_events**: SES delivery events

### Key Features

- Row Level Security (RLS) enabled
- UUID primary keys
- Comprehensive indexing
- JSON fields for flexible data

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Domain Management

- `GET /api/domains` - List domains
- `POST /api/domains` - Add new domain
- `DELETE /api/domains/{id}` - Remove domain
- `POST /api/domains/{id}/verify` - Check verification

### API Keys

- `GET /api/api-keys` - List API keys
- `POST /api/api-keys` - Create new key
- `DELETE /api/api-keys/{id}` - Delete key

### Email Operations (Resend Compatible)

- `POST /api/emails` - Send email
- `GET /api/emails/logs` - Email history
- `GET /api/emails/{id}` - Email details

### System

- `GET /api/health` - Health check
- `POST /api/setup` - Initialize admin user
- `POST /api/webhooks/ses` - SES events

## Key Integrations

### Amazon SES

- Domain verification
- Email sending (simple & raw)
- Configuration sets
- Webhook events
- Bounce/complaint handling

### Digital Ocean DNS

- Automatic record creation
- Domain validation
- DNS management API
- Error handling & fallback

### Supabase

- PostgreSQL database
- Real-time subscriptions
- Row Level Security
- Admin/anon key separation

## Security Features

- JWT-based authentication
- API key hashing (bcrypt)
- Row Level Security policies
- CORS handling
- Input validation (Zod)
- Environment variable separation

## Deployment Options

1. **Vercel**: Serverless deployment
2. **Docker**: Containerized deployment
3. **Traditional**: Node.js server
4. **Docker Compose**: Local development

## Environment Variables

Essential configuration:

- Database: Supabase credentials
- AWS: SES access keys
- Digital Ocean: API token (optional)
- Security: JWT secret
- Admin: Default user credentials

## Getting Started

1. **Setup Services**: Supabase + AWS SES + (optional) Digital Ocean
2. **Configure Environment**: Copy .env.local.example
3. **Initialize Database**: Run database.sql in Supabase
4. **Install & Run**: npm install && npm run dev
5. **Create Admin**: POST /api/setup
6. **Add Domain**: Use dashboard to add first domain
7. **Verify Domain**: Check DNS records and verify
8. **Create API Key**: Generate key for sending
9. **Send Emails**: Use Resend SDK with new endpoint

## Resend Compatibility

FreeResend implements the same API contract as Resend:

```javascript
// Just change the baseURL - everything else works the same
const resend = new Resend("your-api-key", {
  baseURL: "https://your-freeresend.com/api",
});
```

## Future Enhancements

- Email templates
- Campaign management
- Advanced analytics
- Multi-user support
- SMTP server
- Email scheduling
- Enhanced webhooks
