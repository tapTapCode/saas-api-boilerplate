# SaaS API Boilerplate - Frontend

Next.js frontend application for the multi-tenant SaaS API platform.

## Features

- Modern React with Next.js 14 and TypeScript
- Authentication with JWT
- Dashboard with usage analytics
- API key management
- Subscription management
- Responsive design with Tailwind CSS
- State management with Zustand
- Data fetching with React Query
- Form validation with React Hook Form and Zod

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **React Query** - Server state management
- **Zustand** - Client state management
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **Recharts** - Charts and visualizations

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (see backend README)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Configure environment variables in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run start
```

## Project Structure

```
frontend/
├── public/               # Static files
├── src/
│   ├── components/      # Reusable React components
│   │   └── Layout.tsx   # Main layout wrapper
│   ├── hooks/           # Custom React hooks
│   │   └── useAuth.ts   # Authentication hook
│   ├── lib/             # Utility libraries
│   │   ├── api.ts       # API client and endpoints
│   │   └── store.ts     # Zustand state store
│   ├── pages/           # Next.js pages
│   │   ├── index.tsx    # Landing page
│   │   ├── login.tsx    # Login page
│   │   ├── register.tsx # Registration page
│   │   ├── dashboard.tsx # Dashboard
│   │   ├── api-keys.tsx # API key management
│   │   ├── usage.tsx    # Usage analytics
│   │   └── settings.tsx # Settings
│   ├── styles/          # Global styles
│   │   └── globals.css  # Tailwind and custom CSS
│   └── types/           # TypeScript types
│       └── index.ts     # Shared type definitions
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Pages

### Public Pages
- **/** - Landing page with features and pricing
- **/login** - User login
- **/register** - User registration

### Protected Pages (require authentication)
- **/dashboard** - Overview with stats and quick actions
- **/api-keys** - Create and manage API keys
- **/usage** - View API usage analytics
- **/settings** - Account and subscription settings

## Authentication

The app uses JWT token authentication:
- Tokens are stored in localStorage
- Automatically attached to API requests via Axios interceptors
- Expired tokens redirect to login page
- Protected routes check authentication status

## State Management

### Zustand Store
- User authentication state
- Global UI state

### React Query
- Server state caching
- Automatic refetching
- Optimistic updates
- Error handling

## API Integration

All API calls are centralized in `src/lib/api.ts`:
- **authApi** - Authentication endpoints
- **userApi** - User management
- **organizationApi** - Organization and usage data
- **subscriptionApi** - Stripe checkout and subscriptions

## Styling

- **Tailwind CSS** for utility-first styling
- Custom button and input components
- Responsive design (mobile-first)
- Custom color palette with primary blue theme

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000/api/v1` |

## License

MIT

## Author

Jumar Juaton
