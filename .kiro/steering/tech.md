# Technology Stack

## Framework & Runtime
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development throughout
- **Node.js 18+** - Runtime environment
- **React 19** - UI library

## Database & Storage
- **PostgreSQL** - Primary database (via pg driver)
- **Connection pooling** - Built-in pool management with configurable limits
- **UUID primary keys** - All tables use UUID for scalability
- **JSONB fields** - Flexible data storage for DNS records, email arrays, etc.

## External Services
- **Amazon SES** - Email delivery service
- **Digital Ocean API** - Automatic DNS management (optional)
- **AWS SDK v3** - Modern AWS client library

## Authentication & Security
- **JWT tokens** - Session management with jose library
- **bcryptjs** - Password and API key hashing
- **Zod** - Runtime validation and type safety
- **API key authentication** - Bearer token format: `frs_keyId_secretPart`

## Styling & UI
- **Tailwind CSS v4** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Responsive design** - Mobile-first approach

## Testing
- **Jest** - Test runner with Next.js integration
- **Testing Library** - React component testing
- **jsdom** - Browser environment simulation
- **Coverage reporting** - Built-in coverage collection

## Development Tools
- **ESLint** - Code linting with Next.js config
- **TypeScript strict mode** - Enhanced type checking
- **Path aliases** - `@/*` mapping to `src/*`

## Build & Deployment
- **Standalone output** - Self-contained deployment bundle
- **Docker support** - Containerized deployment ready
- **Vercel compatible** - Serverless deployment option
- **External packages** - pg marked as server-external

## Common Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm start           # Start production server

# Code Quality
npm run lint        # ESLint checking
npm run test        # Run Jest tests
npm run test:watch  # Watch mode testing
npm run test:coverage # Coverage reports

# Database
# Run database.sql in PostgreSQL to initialize schema
```

## Environment Configuration

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - JWT signing secret
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` - SES credentials
- `DO_API_TOKEN` - Digital Ocean API token (optional)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` - Initial admin credentials