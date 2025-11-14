# Complete File Path Reference

## Absolute Paths to Key Files in Codebase

### Configuration & Setup Files
- **Database/Prisma:** `/home/user/Nextjs-OC/prisma/`
- **Prisma Config:** `/home/user/Nextjs-OC/prisma.config.ts`
- **Authentication:** `/home/user/Nextjs-OC/lib/auth.ts`
- **Next.js Config:** `/home/user/Nextjs-OC/next.config.ts`
- **Tailwind Config:** `/home/user/Nextjs-OC/tailwind.config.ts`
- **Package.json:** `/home/user/Nextjs-OC/package.json`
- **Environment Example:** `/home/user/Nextjs-OC/.env.example`
- **Middleware:** `/home/user/Nextjs-OC/middleware.ts`

### Database Models
- **Schema Master:** `/home/user/Nextjs-OC/prisma/schema.prisma`
- **User Models:** `/home/user/Nextjs-OC/prisma/user.prisma` (EXISTING - User, UserRestaurant)
- **Restaurant Model:** `/home/user/Nextjs-OC/prisma/restaurant.prisma` (EXISTING - Restaurant, RolePermissions)
- **Menu Models:** `/home/user/Nextjs-OC/prisma/menu.prisma`
- **Kitchen Models:** `/home/user/Nextjs-OC/prisma/kitchen.prisma`
- **Settings Models:** `/home/user/Nextjs-OC/prisma/settings.prisma`
- **Invitations Models:** `/home/user/Nextjs-OC/prisma/invitations.prisma` (NEW - to create)

### Library - Core Patterns

#### Authentication & Authorization
- **NextAuth Config:** `/home/user/Nextjs-OC/lib/auth.ts`
- **Prisma Client:** `/home/user/Nextjs-OC/lib/prisma.ts`

#### Factory Patterns (Reference for Email Implementation)
- **Payment Factory:** `/home/user/Nextjs-OC/lib/payment/PaymentFactory.ts`
- **Delivery Factory:** `/home/user/Nextjs-OC/lib/delivery/DeliveryFactory.ts`
- **Storage Factory:** `/home/user/Nextjs-OC/lib/storage/StorageFactory.ts`
- **Email Factory:** `/home/user/Nextjs-OC/lib/email/EmailFactory.ts` (NEW - to create)

#### Provider Interfaces
- **Payment Interface:** `/home/user/Nextjs-OC/lib/payment/interfaces/IPaymentProvider.ts`
- **Delivery Interface:** `/home/user/Nextjs-OC/lib/delivery/interfaces/IDeliveryProvider.ts`
- **Storage Interface:** `/home/user/Nextjs-OC/lib/storage/interfaces/IStorageProvider.ts`
- **Email Interface:** `/home/user/Nextjs-OC/lib/email/interfaces/IEmailProvider.ts` (NEW - to create)

#### Provider Implementations
- **Stripe Provider:** `/home/user/Nextjs-OC/lib/payment/providers/StripePaymentProvider.ts`
- **Mailgun Provider:** `/home/user/Nextjs-OC/lib/email/providers/MailgunEmailProvider.ts` (NEW - to create)

#### React Query
- **Query Client Config:** `/home/user/Nextjs-OC/lib/queryClient.ts`
- **Query Provider Component:** `/home/user/Nextjs-OC/components/providers/QueryProvider.tsx`

#### Utilities
- **Main Utils:** `/home/user/Nextjs-OC/lib/utils.ts` (cn() function)
- **Validation Utils:** `/home/user/Nextjs-OC/lib/utils/validation.ts` (Email/Phone validation)
- **Tax Calculator:** `/home/user/Nextjs-OC/lib/utils/taxCalculator.ts`
- **Currency Converter:** `/home/user/Nextjs-OC/lib/utils/currencyConverter.ts`
- **Date Formatter:** `/home/user/Nextjs-OC/lib/utils/dateFormatter.ts`

#### Server Actions (3096 lines total)
- **Auth Actions:** `/home/user/Nextjs-OC/lib/serverActions/auth.actions.ts` (signUp, signIn, signOut, getCurrentUser)
- **Restaurant Actions:** `/home/user/Nextjs-OC/lib/serverActions/restaurant.actions.ts` (CRUD operations)
- **Menu Actions:** `/home/user/Nextjs-OC/lib/serverActions/menu.actions.ts`
- **Order Actions:** `/home/user/Nextjs-OC/lib/serverActions/order.actions.ts`
- **Kitchen Actions:** `/home/user/Nextjs-OC/lib/serverActions/kitchen.actions.ts`
- **Settings Actions:** `/home/user/Nextjs-OC/lib/serverActions/settings.actions.ts`
- **Validation Actions:** `/home/user/Nextjs-OC/lib/serverActions/validation.actions.ts`
- **Address Actions:** `/home/user/Nextjs-OC/lib/serverActions/address.actions.ts`
- **Invitation Actions:** `/home/user/Nextjs-OC/lib/serverActions/invitation.actions.ts` (NEW - to create)
- **Role Actions:** `/home/user/Nextjs-OC/lib/serverActions/roles.actions.ts` (NEW - to create)
- **Access Request Actions:** `/home/user/Nextjs-OC/lib/serverActions/access-requests.actions.ts` (NEW - to create)

### Components - UI Primitives

**Location:** `/home/user/Nextjs-OC/components/ui/`

- **Button:** `/home/user/Nextjs-OC/components/ui/Button.tsx` (variants: primary, secondary, ghost, danger)
- **Input:** `/home/user/Nextjs-OC/components/ui/Input.tsx` (text input with error state)
- **Card:** `/home/user/Nextjs-OC/components/ui/Card.tsx` (container with variants)
- **Modal:** `/home/user/Nextjs-OC/components/ui/Modal.tsx` (dialog component)
- **Toast:** `/home/user/Nextjs-OC/components/ui/Toast.tsx` (notification)
- **ToastContainer:** `/home/user/Nextjs-OC/components/ui/ToastContainer.tsx` (Toast provider)
- **FormField:** `/home/user/Nextjs-OC/components/ui/FormField.tsx` (label wrapper)
- **Select:** `/home/user/Nextjs-OC/components/ui/Select.tsx`
- **Avatar:** `/home/user/Nextjs-OC/components/ui/Avatar.tsx`
- **DropdownMenu:** `/home/user/Nextjs-OC/components/ui/DropdownMenu.tsx`
- **Toggle:** `/home/user/Nextjs-OC/components/ui/Toggle.tsx`
- **NumberInput:** `/home/user/Nextjs-OC/components/ui/NumberInput.tsx`
- **Container:** `/home/user/Nextjs-OC/components/ui/Container.tsx`
- **Typography:** `/home/user/Nextjs-OC/components/ui/Typography.tsx`
- **ColorPicker:** `/home/user/Nextjs-OC/components/ui/ColorPicker.tsx`
- **Index/Exports:** `/home/user/Nextjs-OC/components/ui/index.ts`

### Components - Shared/Composite

**Location:** `/home/user/Nextjs-OC/components/shared/`

- **FormField:** `/home/user/Nextjs-OC/components/shared/FormField.tsx`
- **FormSection:** `/home/user/Nextjs-OC/components/shared/FormSection.tsx`
- **ValidationInput:** `/home/user/Nextjs-OC/components/shared/ValidationInput.tsx`
- **ImageUpload:** `/home/user/Nextjs-OC/components/shared/ImageUpload.tsx`
- **LocationAutocomplete:** `/home/user/Nextjs-OC/components/shared/LocationAutocomplete.tsx`
- **SearchFilter:** `/home/user/Nextjs-OC/components/shared/SearchFilter.tsx`
- **Pagination:** `/home/user/Nextjs-OC/components/shared/Pagination.tsx`
- **Tabs:** `/home/user/Nextjs-OC/components/shared/Tabs.tsx`
- **OrderModal:** `/home/user/Nextjs-OC/components/shared/OrderModal.tsx`
- **Badge:** `/home/user/Nextjs-OC/components/shared/Badge.tsx`
- **InfoCard:** `/home/user/Nextjs-OC/components/shared/InfoCard.tsx`

### Components - Feature Specific

**Auth Components:** `/home/user/Nextjs-OC/components/auth/`
- **AuthForm:** `/home/user/Nextjs-OC/components/auth/AuthForm.tsx`

**Invitations (NEW):** `/home/user/Nextjs-OC/components/invitations/` (to create)
- **InviteModal.tsx**
- **InvitationCard.tsx**

**Access Requests (NEW):** `/home/user/Nextjs-OC/components/access/` (to create)
- **RequestAccessModal.tsx**
- **AccessRequestsList.tsx**

**Other Feature Components:**
- `/home/user/Nextjs-OC/components/kitchen/`
- `/home/user/Nextjs-OC/components/menu/`
- `/home/user/Nextjs-OC/components/settings/`
- `/home/user/Nextjs-OC/components/layout/`
- `/home/user/Nextjs-OC/components/landing/`
- `/home/user/Nextjs-OC/components/store/`
- `/home/user/Nextjs-OC/components/setup/`

### Hooks

**Location:** `/home/user/Nextjs-OC/hooks/`

- **useAuth.ts:** `/home/user/Nextjs-OC/hooks/useAuth.ts` (useCurrentUser, useSignIn, useSignUp, useSignOut, useIsAuthenticated)
- **useRestaurants.ts:** `/home/user/Nextjs-OC/hooks/useRestaurants.ts` (useUserRestaurants, useRestaurant, useCreateRestaurant, etc.)
- **useOrders.ts:** `/home/user/Nextjs-OC/hooks/useOrders.ts`
- **useMenu.ts:** `/home/user/Nextjs-OC/hooks/useMenu.ts`
- **useKitchen.ts:** `/home/user/Nextjs-OC/hooks/useKitchen.ts`
- **useDebounce.ts:** `/home/user/Nextjs-OC/hooks/useDebounce.ts`
- **use-mobile.ts:** `/home/user/Nextjs-OC/hooks/use-mobile.ts`
- **useInvitations.ts:** `/home/user/Nextjs-OC/hooks/useInvitations.ts` (NEW - to create)
- **useAccessRequests.ts:** `/home/user/Nextjs-OC/hooks/useAccessRequests.ts` (NEW - to create)
- **useRoles.ts:** `/home/user/Nextjs-OC/hooks/useRoles.ts` (NEW - to create)

### Internationalization (i18n)

**Location:** `/home/user/Nextjs-OC/i18n/`

- **i18n Config:** `/home/user/Nextjs-OC/i18n/request.ts` (Locale detection)
- **English Messages:** `/home/user/Nextjs-OC/i18n/messages/en.json` (33KB)
- **Portuguese Messages:** `/home/user/Nextjs-OC/i18n/messages/pt.json` (36KB)
- **Spanish Messages:** `/home/user/Nextjs-OC/i18n/messages/es.json` (35KB)

### App Routes

**Location:** `/home/user/Nextjs-OC/app/`

- **Root Layout:** `/home/user/Nextjs-OC/app/layout.tsx` (Provider setup)
- **Auth Routes:** `/home/user/Nextjs-OC/app/auth/`
- **Private Routes:** `/home/user/Nextjs-OC/app/(private)/`
- **Restaurant Routes:** `/home/user/Nextjs-OC/app/(private)/[id]/`
- **Order Routes:** `/home/user/Nextjs-OC/app/order/`
- **Dynamic Routes:** `/home/user/Nextjs-OC/app/[id]/`
- **API Routes:** `/home/user/Nextjs-OC/app/api/`

### TypeScript Types

**Location:** `/home/user/Nextjs-OC/types/`

### State Management (Zustand)

**Location:** `/home/user/Nextjs-OC/stores/`

### Documentation

- **Main README:** `/home/user/Nextjs-OC/README.md`
- **Vercel Deployment:** `/home/user/Nextjs-OC/VERCEL_DEPLOYMENT.md`
- **Patterns Analysis:** `/home/user/Nextjs-OC/PATTERNS_ANALYSIS.md` (NEW - created)
- **Quick Reference:** `/home/user/Nextjs-OC/IMPLEMENTATION_QUICK_REFERENCE.md` (NEW - created)
- **This File:** `/home/user/Nextjs-OC/FILE_PATHS_REFERENCE.md` (NEW - created)

---

## Files to Create for Implementation

### For Email Integration
```
/home/user/Nextjs-OC/lib/email/
├── interfaces/
│   └── IEmailProvider.ts
├── providers/
│   └── MailgunEmailProvider.ts
└── EmailFactory.ts
```

### For User Invitations
```
/home/user/Nextjs-OC/lib/serverActions/
└── invitation.actions.ts

/home/user/Nextjs-OC/hooks/
└── useInvitations.ts

/home/user/Nextjs-OC/components/invitations/
├── InviteModal.tsx
└── InvitationCard.tsx

/home/user/Nextjs-OC/prisma/
└── invitations.prisma
```

### For Role Management & Access Requests
```
/home/user/Nextjs-OC/lib/serverActions/
├── roles.actions.ts
└── access-requests.actions.ts

/home/user/Nextjs-OC/hooks/
├── useRoles.ts
└── useAccessRequests.ts

/home/user/Nextjs-OC/components/access/
├── RequestAccessModal.tsx
└── AccessRequestsList.tsx
```

---

## File Dependencies Quick Map

### When updating `/prisma/user.prisma`:
Also update:
- `/prisma/schema.prisma` (main file)
- `/prisma/invitations.prisma` (relations to UserInvitation, AccessRequest)

### When creating EmailFactory:
Also create:
- `/lib/email/interfaces/IEmailProvider.ts`
- `/lib/email/providers/MailgunEmailProvider.ts`
- Update `.env.example`

### When creating invitation.actions.ts:
Also create:
- `/hooks/useInvitations.ts`
- `/components/invitations/InviteModal.tsx`
- Add i18n keys to all 3 message files

### When creating Toast system:
Already exists:
- `/components/ui/Toast.tsx`
- `/components/ui/ToastContainer.tsx`
- Already wrapped in root layout at `/app/layout.tsx`

Just import and use: `import { useToast } from '@/components/ui/ToastContainer';`

---

## Build & Runtime Commands

Development:
```bash
cd /home/user/Nextjs-OC
npm run dev
```

Database:
```bash
# Generate Prisma types
npm run db:generate

# Combine schema files into schema.prisma
npm run schema:combine

# Push changes to database
npm run db:push

# Open Prisma Studio
npm run db:studio
```

Production:
```bash
npm run build    # Builds and generates schema
npm start        # Run production server
```

