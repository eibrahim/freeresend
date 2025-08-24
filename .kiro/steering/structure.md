# Project Structure & Organization

## Directory Layout

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (RESTful endpoints)
│   │   ├── auth/          # Authentication endpoints
│   │   ├── domains/       # Domain management CRUD
│   │   ├── api-keys/      # API key management CRUD
│   │   ├── emails/        # Email sending & logs (Resend-compatible)
│   │   ├── webhooks/      # SES webhook handlers
│   │   ├── health/        # Health check endpoint
│   │   └── setup/         # Initial admin setup
│   ├── globals.css        # Global Tailwind styles
│   ├── layout.tsx         # Root layout with AuthProvider
│   ├── page.tsx           # Main dashboard entry point
│   └── [feature]/         # Feature-specific pages
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard container
│   ├── *Tab.tsx          # Tab-based UI components
│   ├── *Form.tsx         # Form components
│   └── __tests__/        # Component tests
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication state management
└── lib/                  # Core business logic & utilities
    ├── database.ts       # PostgreSQL client & types
    ├── auth.ts          # User authentication logic
    ├── api-keys.ts      # API key management
    ├── domains.ts       # Domain operations
    ├── ses.ts           # Amazon SES integration
    ├── digitalocean.ts  # DNS automation
    ├── api.ts           # Frontend API client
    ├── middleware.ts    # API middleware functions
    └── __tests__/       # Unit tests
```

## Architectural Patterns

### API Routes Structure
- **RESTful design** - Standard HTTP methods (GET, POST, DELETE)
- **Resource-based URLs** - `/api/domains`, `/api/api-keys`, `/api/emails`
- **Nested resources** - `/api/domains/[id]/verify`
- **CORS handling** - Consistent CORS headers across all endpoints
- **Error handling** - Standardized error responses with proper HTTP status codes

### Database Layer
- **Connection pooling** - Single pool instance exported from `database.ts`
- **Helper functions** - `query()` for single queries, `transaction()` for multi-step operations
- **Type definitions** - All database types defined in `database.ts`
- **UUID primary keys** - Consistent across all tables
- **JSONB for flexibility** - Arrays, objects stored as JSONB

### Component Organization
- **Feature-based tabs** - `DomainsTab`, `ApiKeysTab`, `EmailLogsTab`
- **Single responsibility** - Each component handles one feature area
- **Consistent naming** - `*Tab.tsx` for main feature components
- **Test co-location** - Tests in `__tests__/` subdirectories

### Business Logic Separation
- **lib/ directory** - Pure business logic, no UI concerns
- **Service layer pattern** - Each external service gets its own module
- **Utility functions** - Reusable helpers in dedicated modules
- **Type safety** - Comprehensive TypeScript interfaces

## File Naming Conventions

- **Components** - PascalCase (e.g., `Dashboard.tsx`, `LoginForm.tsx`)
- **API routes** - lowercase with `route.ts` (e.g., `route.ts`, `[id]/route.ts`)
- **Utilities** - kebab-case (e.g., `api-keys.ts`, `pricing-calculator.ts`)
- **Tests** - Match source file name with `.test.ts` suffix
- **Types** - Defined in the module they belong to, not separate files

## Code Organization Principles

### API Endpoints
- **Input validation** - Zod schemas for all request bodies
- **Authentication** - Consistent API key verification
- **Error handling** - Try-catch with proper HTTP status codes
- **CORS support** - All endpoints handle preflight requests
- **Database transactions** - Use transaction helper for multi-step operations

### React Components
- **Client components** - Use `"use client"` directive when needed
- **State management** - React Context for global state (auth)
- **Event handling** - Async/await for API calls
- **Loading states** - Proper loading and error states
- **Accessibility** - Semantic HTML and ARIA attributes

### Database Operations
- **Parameterized queries** - Always use parameter placeholders
- **Connection management** - Automatic connection release
- **Error handling** - Proper error propagation
- **Type safety** - Return types match interface definitions

## Testing Strategy

### Unit Tests
- **Business logic** - All functions in `lib/` should have unit tests
- **Pure functions** - Focus on input/output testing
- **Edge cases** - Test boundary conditions and error cases
- **Mocking** - Mock external services (SES, Digital Ocean)

### Component Tests
- **User interactions** - Test user flows and form submissions
- **State changes** - Verify component state updates
- **API integration** - Mock API calls and test responses
- **Accessibility** - Test keyboard navigation and screen readers

### Integration Tests
- **API endpoints** - Test full request/response cycles
- **Database operations** - Test with real database connections
- **External services** - Test with service mocks or test environments

## Configuration Management

### Environment Variables
- **Validation** - Check required variables at startup
- **Defaults** - Provide sensible defaults where possible
- **Security** - Never commit secrets to version control
- **Documentation** - Document all variables in `.env.example`

### Database Schema
- **Migrations** - Use `database.sql` for schema initialization
- **Indexes** - Proper indexing for query performance
- **Constraints** - Foreign keys and data validation
- **Triggers** - Automatic timestamp updates