# Implementation Quick Reference Guide

## Core Patterns to Follow

### 1. Provider Factory Pattern
All third-party integrations use a factory singleton pattern:
- Path: `/lib/[service]/[Service]Factory.ts`
- Pattern: Static class with async `getProvider()` method
- Usage: Import factory, call `getProvider()`, use returned interface

```typescript
// Usage example
import { EmailFactory } from '@/lib/email/EmailFactory';

const emailProvider = await EmailFactory.getProvider();
await emailProvider.sendEmail({...});
```

### 2. Server Actions
- Must start with `'use server'` directive
- Auth check → Input validation → DB operation → Revalidate
- Standard response: `{ success: boolean, data: T | null, error: string | null }`
- Located in: `/lib/serverActions/*.ts`

### 3. React Query + Hooks Pattern
- Create hooks in `/hooks/` folder
- Use `useQuery` for fetching, `useMutation` for mutations
- Invalidate related caches in `onSuccess` callback
- Standard staleTime: 5 minutes

### 4. Toast Notifications
```typescript
import { useToast } from '@/components/ui/ToastContainer';

const { showToast } = useToast();
showToast('success', 'Operation successful!');
showToast('error', 'Something went wrong');
```

### 5. i18n Translations
```typescript
const t = useTranslations('section');
// Access i18n/messages/[lang].json -> section -> key
return <h1>{t('title')}</h1>;
```

---

## Implementation Checklist for Your Features

### Email Provider (Mailgun)

Files to create:
- [ ] `/lib/email/interfaces/IEmailProvider.ts` - Interface definition
- [ ] `/lib/email/providers/MailgunEmailProvider.ts` - Implementation
- [ ] `/lib/email/EmailFactory.ts` - Factory class
- [ ] Add to `.env.example`: `EMAIL_PROVIDER`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `EMAIL_FROM`
- [ ] Add to package.json dependencies if needed

### Prisma Models

Files to update:
- [ ] `/prisma/restaurant.prisma` - Add relations to Invitation & AccessRequest models
- [ ] `/prisma/user.prisma` - Add relations to Invitation & AccessRequest models
- [ ] Create `/prisma/invitations.prisma` - New file with models:
  - [ ] `UserInvitation` model
  - [ ] `AccessRequest` model

Run after schema updates:
```bash
npm run db:generate
npm run db:push
```

### User Invitation System

Files to create:
- [ ] `/lib/serverActions/invitation.actions.ts` with functions:
  - `sendRestaurantInvitation()`
  - `acceptInvitation()`
  - `declineInvitation()`
  - `listPendingInvitations()`

Files to create (UI):
- [ ] `/components/invitations/InviteModal.tsx`
- [ ] `/components/invitations/InvitationCard.tsx`
- [ ] Create hook: `/hooks/useInvitations.ts`

### Role Management

Use existing:
- [ ] `RolePermissions` model (already in schema)
- [ ] Create server action: `/lib/serverActions/roles.actions.ts`
- [ ] Create hook: `/hooks/useRoles.ts`

### Request to Join Feature

Files to create:
- [ ] `/lib/serverActions/access-requests.actions.ts` with:
  - `submitAccessRequest()`
  - `getAccessRequests()`
  - `approveAccessRequest()`
  - `rejectAccessRequest()`

Files to create (UI):
- [ ] `/components/access/RequestAccessModal.tsx`
- [ ] `/components/access/AccessRequestsList.tsx`
- [ ] Create hook: `/hooks/useAccessRequests.ts`

---

## Translation Keys to Add

Add to `i18n/messages/en.json`, `pt.json`, and `es.json`:

```json
{
  "invitations": {
    "title": "Send Invitation",
    "description": "Invite team members to manage your restaurant",
    "emailLabel": "Email Address",
    "roleLabel": "Role",
    "messageLabel": "Message (optional)",
    "roleTips": {
      "staff": "Can view orders and customer information",
      "manager": "Can manage menu and access settings",
      "kitchen": "Can view orders and kitchen display"
    },
    "buttonSend": "Send Invitation",
    "buttonCancel": "Cancel",
    "successMessage": "Invitation sent successfully!",
    "errorMessage": "Failed to send invitation",
    "invalidEmail": "Invalid email address",
    "alreadyExists": "This person is already a team member"
  },
  "accessRequests": {
    "title": "Request Access",
    "description": "Request access to manage this restaurant",
    "messageLabel": "Why do you want to join?",
    "buttonSubmit": "Submit Request",
    "successMessage": "Access request submitted",
    "pendingMessage": "Your request is pending approval"
  },
  "roleManagement": {
    "title": "Team Members",
    "owner": "Owner",
    "manager": "Manager",
    "kitchen": "Kitchen Staff",
    "staff": "Staff",
    "changeRole": "Change Role",
    "removeAccess": "Remove Access",
    "confirmRemove": "Are you sure?"
  }
}
```

---

## Environment Variables Setup

Add to `.env.local`:

```env
# Email Configuration
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-xxx...
MAILGUN_DOMAIN=mg.yourdomain.com
EMAIL_FROM=noreply@yourdomain.com

# API URLs
AUTH_URL=http://localhost:3000  # Production: https://yourdomain.com
```

---

## File Structure Reference

```
/lib
├── email/
│   ├── interfaces/
│   │   └── IEmailProvider.ts      (NEW)
│   ├── providers/
│   │   └── MailgunEmailProvider.ts (NEW)
│   └── EmailFactory.ts             (NEW)
└── serverActions/
    ├── auth.actions.ts             (EXISTING)
    ├── restaurant.actions.ts        (EXISTING)
    ├── invitation.actions.ts        (NEW)
    ├── access-requests.actions.ts   (NEW)
    └── roles.actions.ts             (NEW)

/hooks
├── useAuth.ts                      (EXISTING)
├── useRestaurants.ts               (EXISTING)
├── useInvitations.ts               (NEW)
├── useAccessRequests.ts            (NEW)
└── useRoles.ts                     (NEW)

/components
└── [features]/
    ├── invitations/                (NEW)
    │   ├── InviteModal.tsx
    │   └── InvitationCard.tsx
    └── access/                     (NEW)
        ├── RequestAccessModal.tsx
        └── AccessRequestsList.tsx

/prisma
├── schema.prisma                   (UPDATE)
├── restaurant.prisma               (UPDATE - add relations)
├── user.prisma                     (UPDATE - add relations)
└── invitations.prisma              (NEW)
```

---

## Testing Patterns

When implementing features, follow these test patterns:

### Server Action Test
```typescript
const result = await sendRestaurantInvitation({
  restaurantId: 'xxx',
  email: 'user@example.com',
  role: 'manager'
});

expect(result.success).toBe(true);
expect(result.data).toBeDefined();
expect(result.error).toBeNull();
```

### Hook Test
```typescript
const { data, isLoading, error } = useInvitations(restaurantId);
expect(data).toBeDefined();
expect(isLoading).toBe(false);
```

---

## Common Mistakes to Avoid

1. ❌ Forgetting `'use server'` directive in server actions
2. ❌ Not checking auth before DB operations
3. ❌ Forgetting to revalidate cache with `revalidatePath()`
4. ❌ Not handling error states in UI components
5. ❌ Missing toast notifications for user feedback
6. ❌ Not adding translations for new features
7. ❌ Forgetting to add environment variables to `.env.example`
8. ❌ Not validating input data in server actions
9. ❌ Missing error boundaries in components
10. ❌ Not using consistent naming conventions

---

## Performance Tips

1. Use `enabled: !!id` to conditionally enable React Query
2. Set appropriate `staleTime` values (5-10 min for user data, 1 min for real-time)
3. Use `useCallback` to memoize mutation functions
4. Implement pagination for large lists
5. Use `gcTime` (cache time) of 30 minutes for better performance

---

## Database Relationship Reference

User → Restaurant (Many-to-Many through UserRestaurant)
User → UserInvitation (One-to-Many)
User → AccessRequest (One-to-Many)
Restaurant → UserInvitation (One-to-Many)
Restaurant → AccessRequest (One-to-Many)
Restaurant → RolePermissions (One-to-Many)

---

## Deployment Checklist

Before deploying:
- [ ] All env variables set in production
- [ ] Database migrations run (`prisma db push`)
- [ ] Types generated (`prisma generate`)
- [ ] Build succeeds (`npm run build`)
- [ ] All 3 languages have translations
- [ ] Email templates tested
- [ ] Auth flow tested end-to-end
- [ ] Cache invalidation working correctly

