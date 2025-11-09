# Restaurant Platform - Architecture Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Patterns](#core-patterns)
5. [Data Flow](#data-flow)
6. [Key Systems](#key-systems)
7. [Security & Authentication](#security--authentication)

---

## System Overview

This is a multi-tenant restaurant management platform built with Next.js 14, featuring:
- Multi-language support (English, Portuguese)
- Restaurant management with menu, orders, and settings
- Complex menu modifiers with dynamic pricing
- Payment processing (Stripe, MercadoPago)
- Delivery integration (Shipday)
- File storage (Wasabi S3-compatible)
- Role-based access control

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth UI    │  │  Restaurant  │  │    Menu      │      │
│  │              │  │    Setup     │  │  Management  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Settings   │  │    Orders    │  │  Dashboard   │      │
│  │     UI       │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                     Server Actions Layer                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐ │
│  │   Auth    │  │Restaurant │  │   Menu    │  │ Settings │ │
│  │  Actions  │  │  Actions  │  │  Actions  │  │ Actions  │ │
│  └───────────┘  └───────────┘  └───────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │Provider Factories│  │  Utility Services │  │Calculators │ │
│  ├─────────────────┤  ├──────────────────┤  ├────────────┤ │
│  │  • Payment      │  │  • Distance      │  │  • Tax     │ │
│  │  • Delivery     │  │  • Geocoding     │  │  • Order   │ │
│  │  • Storage      │  │  • Validation    │  │  • Pricing │ │
│  └─────────────────┘  └──────────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                       Data Access Layer                      │
│                    Prisma ORM + MongoDB                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Users   │  │Restaurant│  │   Menu   │  │ Settings │   │
│  │  Roles   │  │  Orders  │  │Modifiers │  │  Hours   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                     External Services                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Stripe  │  │ Shipday  │  │  Mapbox  │  │  Wasabi  │   │
│  │MercadoPago│  │ Delivery │  │Geocoding │  │ Storage  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI (via shadcn/ui)
- **i18n**: next-intl (English, Portuguese)
- **State Management**: React hooks + Server Actions
- **Forms**: React Hook Form + Zod validation
- **Notifications**: Sonner (toast notifications)

### Backend
- **Runtime**: Node.js
- **API**: Next.js Server Actions
- **Authentication**: NextAuth.js v5
- **Database**: MongoDB (via Prisma)
- **ORM**: Prisma
- **File Upload**: Wasabi S3-compatible storage

### External Integrations
- **Payment**: Stripe, MercadoPago (via Factory pattern)
- **Delivery**: Shipday (via Factory pattern)
- **Geocoding**: Mapbox
- **Storage**: Wasabi

---

## Project Structure

```
Nextjs-OC/
├── app/                          # Next.js App Router
│   ├── (private)/                # Protected routes
│   │   └── [id]/                 # Restaurant-specific pages
│   │       ├── dashboard/        # Dashboard pages
│   │       ├── menu/             # Menu management
│   │       └── settings/         # Settings pages
│   ├── (public)/                 # Public routes
│   │   ├── auth/                 # Authentication pages
│   │   └── setup/                # Restaurant setup
│   └── api/                      # API routes (webhooks, etc.)
│
├── components/                   # React components
│   ├── ui/                       # Base UI components (buttons, inputs, etc.)
│   ├── shared/                   # Shared complex components
│   ├── auth/                     # Auth-specific components
│   ├── menu/                     # Menu management components
│   ├── settings/                 # Settings components
│   │   ├── financial/
│   │   ├── delivery/
│   │   ├── hours/
│   │   └── users/
│   └── layout/                   # Layout components
│
├── lib/                          # Business logic & utilities
│   ├── serverActions/            # Next.js Server Actions
│   │   ├── auth.actions.ts
│   │   ├── menu.actions.ts
│   │   ├── restaurant.actions.ts
│   │   └── settings.actions.ts
│   ├── payment/                  # Payment provider system
│   │   ├── interfaces/
│   │   ├── providers/
│   │   └── PaymentFactory.ts
│   ├── delivery/                 # Delivery provider system
│   │   ├── interfaces/
│   │   ├── providers/
│   │   └── DeliveryFactory.ts
│   ├── storage/                  # Storage provider system
│   │   ├── interfaces/
│   │   ├── providers/
│   │   └── StorageFactory.ts
│   ├── utils/                    # Utility functions
│   │   ├── taxCalculator.ts
│   │   ├── distance.ts
│   │   ├── orderDraftCalculator.ts
│   │   └── modifierPricingCalculator.ts
│   ├── auth.ts                   # NextAuth configuration
│   └── prisma.ts                 # Prisma client instance
│
├── prisma/                       # Database schemas
│   ├── user.prisma               # User models
│   ├── restaurant.prisma         # Restaurant model
│   ├── menu.prisma               # Menu models
│   ├── settings.prisma           # Settings models
│   └── schema.prisma             # Combined schema (auto-generated)
│
├── i18n/                         # Internationalization
│   ├── messages/
│   │   ├── en.json               # English translations
│   │   └── pt.json               # Portuguese translations
│   └── request.ts                # i18n configuration
│
├── hooks/                        # Custom React hooks
│   ├── use-mobile.tsx            # Mobile detection hook
│   └── use-toast.ts              # Toast notification hook
│
└── docs/                         # Documentation
    ├── ARCHITECTURE.md           # This file
    ├── QUICK_START.md            # Quick start guide
    ├── MENU_SYSTEM_GUIDE.md      # Menu system documentation
    ├── SETTINGS_SYSTEM_GUIDE.md  # Settings documentation
    └── ...
```

---

## Core Patterns

### 1. Factory Pattern (Provider System)

The application uses the Factory pattern for external service integrations, making it easy to switch providers without changing business logic.

**Example: Payment Provider**

```typescript
// Interface
interface IPaymentProvider {
  initialize(config: any): Promise<void>;
  createPaymentIntent(options: PaymentIntentOptions): Promise<PaymentIntentResult>;
  // ... other methods
}

// Concrete implementations
class StripePaymentProvider implements IPaymentProvider { ... }
class MercadoPagoPaymentProvider implements IPaymentProvider { ... }

// Factory
class PaymentFactory {
  static async getProvider(provider?: string): Promise<IPaymentProvider> {
    const selectedProvider = provider || process.env.PAYMENT_PROVIDER || 'stripe';

    switch (selectedProvider.toLowerCase()) {
      case 'stripe': return new StripePaymentProvider();
      case 'mercadopago': return new MercadoPagoPaymentProvider();
      default: throw new Error(`Unsupported provider: ${selectedProvider}`);
    }
  }
}

// Usage
const payment = await PaymentFactory.getProvider();
const result = await payment.createPaymentIntent({...});
```

### 2. Server Actions Pattern

All data mutations use Next.js Server Actions for type safety and performance.

```typescript
'use server';

export async function createRestaurant(data: CreateRestaurantData) {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized", data: null };
  }

  const restaurant = await prisma.restaurant.create({ data });
  revalidatePath('/');

  return { success: true, data: restaurant, error: null };
}
```

### 3. Component Composition

Components follow a clear hierarchy:
- `ui/` - Atomic components (Button, Input, etc.)
- `shared/` - Composed components (Forms, Headers, etc.)
- Page-specific components in respective folders

### 4. Error Handling Pattern

Consistent error handling across the application:

```typescript
try {
  const result = await someAction(data);
  if (result.success) {
    toast.success('Operation successful');
  } else {
    toast.error(result.error);
  }
} catch (error) {
  toast.error('Unexpected error occurred');
}
```

---

## Data Flow

### 1. User Action → Server Action → Database

```
User clicks "Save"
    ↓
Component calls Server Action
    ↓
Server Action validates session
    ↓
Server Action updates database
    ↓
Server Action revalidates cache
    ↓
Component receives result
    ↓
UI updates with new data
```

### 2. Order Calculation Flow

```
User selects menu items + modifiers
    ↓
Frontend calls orderDraftCalculator
    ↓
Calculator processes:
  - Base prices
  - Modifier prices
  - Cross-modifier adjustments
  - Tax calculation (via taxCalculator)
  - Delivery fee (via distance calculator)
  - Platform fee
    ↓
Returns complete order preview
    ↓
UI displays itemized pricing
```

---

## Key Systems

### 1. Authentication System

- **Provider**: NextAuth.js v5
- **Strategies**: Credentials, Google OAuth, Facebook OAuth
- **Session**: JWT-based
- **Protection**: Middleware + auth() function

```typescript
// Protecting a server action
export async function protectedAction() {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized" };
  }
  // ... proceed with action
}
```

### 2. Multi-Tenant System

- Restaurants are isolated by ID
- Users can have multiple restaurants with different roles
- Role-based permissions per restaurant

```prisma
model UserRestaurant {
  userId       String
  restaurantId String
  role         String  // owner, manager, kitchen, staff

  @@unique([userId, restaurantId])
}
```

### 3. Menu & Modifier System

- Reusable options across menu items
- Complex price adjustments (multiplier, addition, fixed)
- Cross-option dependencies
- Real-time price calculation

### 4. i18n System

- Server and client component support
- Nested translation keys
- Automatic locale detection
- SEO-friendly URLs

```typescript
import { useTranslations } from 'next-intl';

const t = useTranslations('menu.items');
<h1>{t('title')}</h1>
```

---

## Security & Authentication

### Session Management
- Secure JWT tokens
- HTTP-only cookies
- CSRF protection

### Authorization Levels
1. **Public**: Landing pages, auth pages
2. **Authenticated**: User must be signed in
3. **Restaurant Access**: User must belong to restaurant
4. **Role-Based**: Owner/Manager only actions

### Data Validation
- Zod schemas for runtime validation
- TypeScript for compile-time safety
- Prisma for database-level constraints

---

## Performance Optimizations

1. **Server Components**: Default to server components
2. **Caching**: Next.js automatic caching + revalidation
3. **Image Optimization**: Next.js Image component
4. **Code Splitting**: Dynamic imports for large components
5. **Database Indexing**: Strategic indexes on Prisma models

---

## Development Workflow

```bash
# Setup
npm install
npm run db:generate
npm run db:push

# Development
npm run dev

# Build
npm run build
npm start
```

---

## Extensibility

### Adding a New Payment Provider

1. Create provider class implementing `IPaymentProvider`
2. Add case to `PaymentFactory`
3. Add environment variables
4. Test integration

### Adding a New Language

1. Create `i18n/messages/xx.json`
2. Add locale to `i18n/request.ts`
3. Translate all keys
4. Test UI in new language

---

## Further Reading

- [Quick Start Guide](./QUICK_START.md)
- [Menu System Guide](./MENU_SYSTEM_GUIDE.md)
- [Settings System Guide](./SETTINGS_SYSTEM_GUIDE.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
