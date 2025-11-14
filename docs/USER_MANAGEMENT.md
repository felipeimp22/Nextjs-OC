# OrderChop User Management System

## Overview

The OrderChop platform includes a comprehensive user management system that allows restaurant owners and managers to invite team members, manage roles, and handle access requests. The system is built with email notifications, role-based permissions, and a factory-patterned email provider for easy swapping.

## Table of Contents

1. [Architecture](#architecture)
2. [Database Models](#database-models)
3. [User Roles](#user-roles)
4. [Features](#features)
5. [Email Integration](#email-integration)
6. [API Reference](#api-reference)
7. [UI Components](#ui-components)
8. [Workflows](#workflows)

---

## Architecture

The user management system follows these established patterns:

- **Factory Pattern**: Email provider (Mailgun) using factory pattern for easy swapping
- **Server Actions**: All mutations use Next.js server actions with standard `{ success, data, error }` response
- **React Query**: Client-side caching and state management
- **i18n**: Multilingual support using next-intl
- **Role-Based Access Control (RBAC)**: Permission system tied to restaurant roles

---

## Database Models

### User Model
```prisma
model User {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  email     String    @unique
  password  String?   // Optional for social login
  image     String    @default("")
  status    String    @default("pending") // active, pending, inactive

  restaurants UserRestaurant[]
  accessRequests AccessRequest[]

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

### UserRestaurant Model (Junction Table)
```prisma
model UserRestaurant {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  userId       String   @db.ObjectId
  restaurantId String   @db.ObjectId
  role         String   @default("staff") // owner, manager, kitchen, staff

  user       User       @relation(fields: [userId], references: [id])
  restaurant Restaurant @relation(fields: [restaurantId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, restaurantId])
}
```

### UserInvitation Model
```prisma
model UserInvitation {
  id String @id @default(auto()) @map("_id") @db.ObjectId

  restaurantId String @db.ObjectId
  restaurant Restaurant @relation("Invitations", fields: [restaurantId], references: [id])

  invitedEmail String
  role String

  token String @unique
  tokenExpiresAt DateTime

  status String @default("pending") // pending, accepted, cancelled, expired

  invitedBy String @db.ObjectId

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([restaurantId])
  @@index([invitedEmail])
  @@index([token])
}
```

### AccessRequest Model
```prisma
model AccessRequest {
  id String @id @default(auto()) @map("_id") @db.ObjectId

  userId String @db.ObjectId
  user User @relation("AccessRequests", fields: [userId], references: [id])

  restaurantId String @db.ObjectId
  restaurant Restaurant @relation("AccessRequests", fields: [restaurantId], references: [id])

  requestedRole String @default("staff")
  message String?

  status String @default("pending") // pending, approved, rejected
  reviewedBy String? @db.ObjectId
  reviewedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, restaurantId])
  @@index([restaurantId])
  @@index([status])
}
```

---

## User Roles

### Available Roles

1. **Owner** (`owner`)
   - Full access to all restaurant features
   - Can assign/remove the owner role
   - Can manage all team members
   - Cannot be removed by others

2. **Manager** (`manager`)
   - Can invite and manage team members (except owners)
   - Access to most restaurant features
   - Cannot change owner roles

3. **Kitchen** (`kitchen`)
   - Access to kitchen display system
   - View orders and update order status
   - Limited access to other features

4. **Staff** (`staff`)
   - Basic access to orders and customer information
   - Cannot manage settings or team members
   - Default role for new users

### Role Permissions

Permissions are managed in the `RolePermissions` model and can be customized per restaurant. Default permissions:

- **dashboard**: View main dashboard (all roles)
- **menuManagement**: Create/edit menu items (owner, manager)
- **orders**: View and manage orders (all roles)
- **kitchen**: Access kitchen display (owner, manager, kitchen)
- **customers**: View customer data (owner, manager, staff)
- **marketing**: Manage promotions (owner, manager)
- **analytics**: View reports (owner, manager)
- **settings**: Modify restaurant settings (owner, manager)

---

## Features

### 1. Team Management

**Location**: Settings > Users Tab

Features:
- View all team members with their roles
- Change user roles (owner/manager only)
- Remove team members (owner/manager only)
- Protection against self-removal
- Protection for owner roles (only owners can modify)

**Components**:
- `TeamManagementSection.tsx` - Main team management UI
- Server Actions: `team.actions.ts`

### 2. User Invitations

**Location**: Settings > Users Tab > Invitations Section

Features:
- Send email invitations to new team members
- Specify role during invitation
- Track invitation status (pending, accepted, cancelled)
- Cancel pending invitations
- 7-day expiration for invitation tokens
- Email notifications with acceptance link

**Components**:
- `InvitationsSection.tsx` - Invitation management UI
- Server Actions: `invitation.actions.ts`

**Workflow**:
1. Owner/Manager enters email and selects role
2. System creates invitation record with unique token
3. Email sent to invitee with acceptance link
4. Invitee clicks link and is redirected to acceptance page
5. System creates UserRestaurant entry and grants access

### 3. Access Requests

**Location**: Settings > Users Tab > Access Requests Section (for admins)
**Location**: Setup Page > Search Restaurant (for users)

Features:
- Users can search for restaurants and request access
- Optional message when requesting access
- Email notifications to restaurant owners/managers
- Approve/reject requests
- Email notifications to requesters on approval

**Components**:
- `AccessRequestsSection.tsx` - Admin UI for reviewing requests
- `RestaurantSearch.tsx` - User UI for requesting access
- Server Actions: `access.actions.ts`

**Workflow**:
1. User searches for restaurant on /setup page
2. User sends access request with optional message
3. Email sent to all restaurant owners/managers
4. Owner/Manager reviews request in Settings > Users
5. Upon approval:
   - UserRestaurant entry created
   - Email sent to requester confirming access
6. Upon rejection:
   - Request status updated to 'rejected'

---

## Email Integration

### Email Provider Architecture

The system uses a factory pattern for email providers, making it easy to swap between different services (Mailgun, SendGrid, etc.).

**Files**:
- `lib/email/interfaces/IEmailProvider.ts` - Email provider interface
- `lib/email/providers/MailgunEmailProvider.ts` - Mailgun implementation
- `lib/email/EmailFactory.ts` - Factory for getting email provider

### Email Provider Interface

```typescript
export interface IEmailProvider {
  initialize(config: any): Promise<void>;
  sendEmail(options: EmailOptions): Promise<SendEmailResult>;
  sendBulkEmail(options: EmailOptions[]): Promise<SendEmailResult[]>;
  getProviderName(): string;
}
```

### Mailgun Configuration

**Environment Variables**:
```env
NEXT_EMAIL_PROVIDER=api.mailgun.net
NEXT_EMAIL_DOMAIN=go.orderchop.co
NEXT_EMAIL_API_KEY=your-mailgun-api-key
```

### Email Templates

1. **Invitation Email**
   - Subject: "You're invited to join [Restaurant Name] on OrderChop"
   - Contains: Restaurant name, role, acceptance link, expiration notice
   - Template: HTML with inline styles

2. **Access Request Email (to Admin)**
   - Subject: "New access request for [Restaurant Name]"
   - Contains: Requester name/email, optional message, review link
   - Template: HTML with inline styles

3. **Access Approved Email**
   - Subject: "Access approved for [Restaurant Name]"
   - Contains: Restaurant name, role, dashboard link
   - Template: HTML with inline styles

---

## API Reference

### Invitation Server Actions

**File**: `lib/serverActions/invitation.actions.ts`

#### sendRestaurantInvitation
```typescript
async function sendRestaurantInvitation(data: {
  restaurantId: string;
  email: string;
  role: 'staff' | 'manager' | 'kitchen';
}): Promise<{ success: boolean; data: Invitation | null; error: string | null }>
```

#### acceptInvitation
```typescript
async function acceptInvitation(token: string): Promise<{
  success: boolean;
  data: Restaurant | null;
  error: string | null;
}>
```

#### getRestaurantInvitations
```typescript
async function getRestaurantInvitations(restaurantId: string): Promise<{
  success: boolean;
  data: Invitation[] | null;
  error: string | null;
}>
```

#### cancelInvitation
```typescript
async function cancelInvitation(invitationId: string): Promise<{
  success: boolean;
  data: null;
  error: string | null;
}>
```

### Team Management Server Actions

**File**: `lib/serverActions/team.actions.ts`

#### getRestaurantTeam
```typescript
async function getRestaurantTeam(restaurantId: string): Promise<{
  success: boolean;
  data: TeamMember[] | null;
  error: string | null;
}>
```

#### updateUserRole
```typescript
async function updateUserRole(data: {
  restaurantId: string;
  userId: string;
  newRole: string;
}): Promise<{ success: boolean; data: UserRestaurant | null; error: string | null }>
```

#### removeTeamMember
```typescript
async function removeTeamMember(data: {
  restaurantId: string;
  userId: string;
}): Promise<{ success: boolean; data: null; error: string | null }>
```

### Access Request Server Actions

**File**: `lib/serverActions/access.actions.ts`

#### requestRestaurantAccess
```typescript
async function requestRestaurantAccess(data: {
  restaurantId: string;
  message?: string;
}): Promise<{ success: boolean; data: AccessRequest | null; error: string | null }>
```

#### getRestaurantAccessRequests
```typescript
async function getRestaurantAccessRequests(restaurantId: string): Promise<{
  success: boolean;
  data: AccessRequest[] | null;
  error: string | null;
}>
```

#### approveAccessRequest
```typescript
async function approveAccessRequest(requestId: string): Promise<{
  success: boolean;
  data: null;
  error: string | null;
}>
```

#### rejectAccessRequest
```typescript
async function rejectAccessRequest(requestId: string): Promise<{
  success: boolean;
  data: null;
  error: string | null;
}>
```

---

## UI Components

### Settings Page Components

**Location**: `app/(private)/[id]/settings/page.tsx`

The settings page includes a tabbed interface with the Users tab containing all user management features.

#### TeamManagementSection
**File**: `components/settings/users/TeamManagementSection.tsx`

Features:
- Table display of all team members
- Change role modal
- Remove member modal with confirmation
- Role-based button visibility

#### InvitationsSection
**File**: `components/settings/users/InvitationsSection.tsx`

Features:
- Send invitation modal
- Pending invitations table
- Cancel invitation button
- Status indicators

#### AccessRequestsSection
**File**: `components/settings/users/AccessRequestsSection.tsx`

Features:
- Pending requests table
- Approve/Reject buttons
- User information display
- Request message display

### Setup Page Component

#### RestaurantSearch
**File**: `components/setup/RestaurantSearch.tsx`

Features:
- Search restaurants by name
- Request access with optional message
- Request status tracking
- Message modal for personalization

### Invitation Acceptance Page

**Location**: `app/(private)/invitations/[token]/page.tsx`

Features:
- Automatic invitation acceptance
- Loading state
- Success/error states
- Auto-redirect to dashboard

---

## Workflows

### Workflow 1: Inviting a Team Member

```
1. Owner/Manager navigates to Settings > Users
2. Clicks "Invite User" button
3. Enters email address and selects role
4. System validates and creates invitation
5. Email sent to invitee with token link
6. Invitee receives email and clicks link
7. System validates token and creates access
8. Invitee redirected to restaurant dashboard
```

### Workflow 2: Requesting Restaurant Access

```
1. User navigates to /setup page
2. Clicks "Search Restaurant" option
3. Searches for restaurant by name
4. Clicks "Request Access" on desired restaurant
5. Optionally adds a message
6. System creates access request
7. Email sent to restaurant owners/managers
8. Owner/Manager reviews request in Settings > Users
9. Owner/Manager approves or rejects
10. Email sent to requester with result
```

### Workflow 3: Changing User Role

```
1. Owner/Manager navigates to Settings > Users
2. Finds team member in list
3. Clicks "Change Role" button
4. Selects new role from modal
5. Confirms change
6. System updates UserRestaurant record
7. Changes reflected immediately
```

### Workflow 4: Removing Team Member

```
1. Owner/Manager navigates to Settings > Users
2. Finds team member in list
3. Clicks remove (trash) icon
4. Confirms removal in modal
5. System deletes UserRestaurant record
6. User loses access to restaurant
```

---

## Security Considerations

1. **Authentication**: All actions require valid session
2. **Authorization**: Role checks prevent unauthorized actions
3. **Token Expiration**: Invitation tokens expire after 7 days
4. **Email Verification**: Invitations tied to email addresses
5. **Owner Protection**: Only owners can modify owner roles
6. **Self-Protection**: Users cannot remove themselves
7. **Input Validation**: All inputs validated on server side

---

## Future Enhancements

Potential improvements for the user management system:

1. **Invitation Analytics**: Track invitation acceptance rates
2. **Bulk Invitations**: Send multiple invitations at once
3. **Custom Permissions**: Per-user permission customization
4. **Activity Logs**: Track user management actions
5. **Email Templates**: Customizable email templates per restaurant
6. **Invitation History**: View all past invitations
7. **Request Expiration**: Auto-expire old access requests
8. **Role Hierarchies**: More granular role structures

---

## Troubleshooting

### Common Issues

1. **Invitation emails not sending**
   - Check NEXT_EMAIL_* environment variables
   - Verify Mailgun API key is valid
   - Check Mailgun domain configuration

2. **Invitation link expired**
   - Tokens expire after 7 days
   - Owner/Manager must resend invitation

3. **Cannot change role**
   - Only owners can assign owner role
   - Only owner/manager can change roles
   - Cannot change own role

4. **Access request not appearing**
   - User must be authenticated
   - Restaurant must exist in database
   - No existing access or pending request

### Debug Mode

Enable detailed logging by checking server action console outputs. All errors are logged with descriptive messages.

---

## Changing Email Providers

To swap from Mailgun to another provider:

1. Create new provider class implementing `IEmailProvider`
2. Add provider to `EmailFactory.ts` switch statement
3. Update environment variables
4. Test email functionality

Example for SendGrid:

```typescript
// lib/email/providers/SendGridEmailProvider.ts
import { IEmailProvider, EmailOptions, SendEmailResult } from '../interfaces/IEmailProvider';

export class SendGridEmailProvider implements IEmailProvider {
  // Implementation here
}

// lib/email/EmailFactory.ts
case 'sendgrid': {
  const sendGridProvider = new SendGridEmailProvider();
  await sendGridProvider.initialize({
    apiKey: process.env.SENDGRID_API_KEY!,
  });
  this.instance = sendGridProvider;
  break;
}
```

---

## License

This user management system is part of the OrderChop platform and follows the same license as the main application.

---

## Support

For issues or questions about the user management system:
- Check this documentation first
- Review server action logs
- Contact the development team
