# Next.js OrderChop Codebase - Comprehensive Pattern Analysis

## 1. LIB/ DIRECTORY STRUCTURE & PATTERNS

### 1.1 Provider Factory Pattern
**Location:** `/home/user/Nextjs-OC/lib/payment/`, `/lib/delivery/`, `/lib/storage/`

#### Pattern Overview:
The codebase implements a **Factory Pattern** with singleton instances for third-party integrations:

**Files:**
- `/lib/payment/PaymentFactory.ts` - Singleton factory for payment providers
- `/lib/delivery/DeliveryFactory.ts` - Singleton factory for delivery providers
- `/lib/storage/StorageFactory.ts` - Singleton factory for storage providers

**Key Characteristics:**
```typescript
// Pattern: Static factory with caching
export class PaymentFactory {
  private static instance: IPaymentProvider | null = null;
  private static currentProvider: string | null = null;

  static async getProvider(provider?: string): Promise<IPaymentProvider> {
    const selectedProvider = provider || process.env.PAYMENT_PROVIDER || 'stripe';
    
    if (this.instance && this.currentProvider !== selectedProvider) {
      this.instance = null; // Reset if provider changed
    }

    if (!this.instance) {
      // Initialize provider based on environment
      switch (selectedProvider.toLowerCase()) {
        case 'stripe':
          this.instance = new StripePaymentProvider();
          await this.instance.initialize(config);
          break;
        // ... other providers
      }
    }
    return this.instance;
  }

  static resetInstance(): void {
    this.instance = null;
    this.currentProvider = null;
  }
}
```

**For Email Implementation:**
Should follow the same pattern:
```typescript
// lib/email/EmailFactory.ts
export class EmailFactory {
  private static instance: IEmailProvider | null = null;
  
  static async getProvider(): Promise<IEmailProvider> {
    if (!this.instance) {
      const provider = process.env.EMAIL_PROVIDER || 'mailgun';
      switch (provider.toLowerCase()) {
        case 'mailgun':
          this.instance = new MailgunEmailProvider();
          await this.instance.initialize({
            apiKey: process.env.MAILGUN_API_KEY!,
            domain: process.env.MAILGUN_DOMAIN!,
          });
          break;
      }
    }
    return this.instance;
  }
}
```

### 1.2 Server Actions Pattern
**Location:** `/lib/serverActions/`

**Key Files:**
- `/lib/serverActions/auth.actions.ts` - Authentication actions
- `/lib/serverActions/restaurant.actions.ts` - Restaurant CRUD with auth checks
- `/lib/serverActions/menu.actions.ts` - Menu management

**Pattern Overview:**
```typescript
'use server'; // Required directive

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Standard return type: { success, data, error }
export async function createRestaurant(data: CreateRestaurantData) {
  try {
    // 1. Auth check
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    // 2. Validation
    if (!data.name?.trim()) {
      return { success: false, error: 'Name is required', data: null };
    }

    // 3. Database operation
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    // 4. Create related records (e.g., default settings)
    await prisma.financialSettings.create({...});

    // 5. Revalidate cache
    revalidatePath(`/${restaurant.id}/dashboard`);

    return { success: true, data: restaurant, error: null };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'Failed to create', data: null };
  }
}
```

**Standard Response Pattern:**
```typescript
{
  success: boolean;
  data: T | null;
  error: string | null;
}
```

### 1.3 i18n/Translation Pattern
**Location:** `/i18n/request.ts`, `/i18n/messages/`

**Implementation:**
- Uses `next-intl` library
- Supports: English (en), Portuguese (pt), Spanish (es)
- Locale detection: Cookie first → Accept-Language header → Default to English
- Message files: JSON format with nested keys

**Pattern Usage in Components:**
```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function AuthForm() {
  const t = useTranslations('auth');
  
  return <h1>{t('signIn')}</h1>; // Translates 'auth.signIn'
}
```

**Message Structure:**
```json
{
  "auth": {
    "signIn": "SignIn",
    "email": "Email",
    "password": "Password"
  }
}
```

### 1.4 Utility Functions & Hooks
**Location:** `/lib/utils/`, `/hooks/`

**Utility Functions:**
- `/lib/utils/validation.ts` - Email/phone validation via Clearout API
- `/lib/utils/taxCalculator.ts` - Tax calculation utilities
- `/lib/utils/currencyConverter.ts` - Currency conversion
- `/lib/utils/dateFormatter.ts` - Date formatting
- `/lib/utils.ts` - `cn()` function for Tailwind class merging

**Custom Hooks:**
- `/hooks/useAuth.ts` - Authentication with React Query caching
- `/hooks/useRestaurants.ts` - Restaurant operations
- `/hooks/useOrders.ts` - Order management
- `/hooks/useMenu.ts` - Menu operations
- `/hooks/useKitchen.ts` - Kitchen display system

**Hook Pattern Example:**
```typescript
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const result = await getCurrentUser();
      if (!result.success) throw new Error('Not authenticated');
      return result.user;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials) => {
      const result = await serverSignIn(credentials);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      window.location.href = '/setup';
    },
  });
}
```

### 1.5 Authentication Setup
**Location:** `/lib/auth.ts`

**Key Features:**
- NextAuth v5 with JWT strategy
- Multiple providers: Google, Facebook, Credentials
- MongoDB integration via Prisma adapter
- Automatic user creation for social logins
- Password hashing with bcryptjs

**Configuration:**
```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Google({...}),
    Facebook({...}),
    Credentials({
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        const valid = await bcrypt.compare(credentials.password, user.password);
        return valid ? { id: user.id, email: user.email, ... } : null;
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Create user if social login
      if (account?.provider !== "credentials") {
        const existing = await prisma.user.findUnique({...});
        if (!existing) {
          await prisma.user.create({
            data: { email: user.email, status: "active", ... }
          });
        }
      }
      return true;
    }
  }
});
```

### 1.6 Database & ORM
**Location:** `/lib/prisma.ts`, `/prisma/`

**Pattern:**
```typescript
// Singleton pattern for serverless environments
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  });
};

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Graceful shutdown for serverless
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}
```

### 1.7 React Query Setup
**Location:** `/lib/queryClient.ts`, `/components/providers/QueryProvider.tsx`

**Configuration:**
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minutes
      gcTime: 1000 * 60 * 30,          // 30 minutes (cache)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

**Provider Setup:**
```typescript
'use client';
import { QueryClientProvider } from '@tanstack/react-query';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

## 2. PRISMA MODELS & DATA STRUCTURE

### 2.1 User & Authentication Models
**File:** `/prisma/user.prisma`

```prisma
model User {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  email     String    @unique
  password  String?   // Optional for social login
  image     String    @default("")
  status    String    @default("pending") // active, pending, inactive
  
  restaurants UserRestaurant[]
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  @@map("users")
}

model UserRestaurant {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  userId       String   @db.ObjectId
  restaurantId String   @db.ObjectId
  role         String   @default("staff") // admin, manager, kitchen, staff
  
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  restaurant Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, restaurantId])
  @@map("user_restaurants")
}
```

**Key Relationships:**
- User can have multiple restaurants (many-to-many via UserRestaurant)
- Each association has a role (staff, manager, kitchen, admin)
- Status field for account management (pending, active, inactive)

### 2.2 Restaurant Model & Role Permissions
**File:** `/prisma/restaurant.prisma`

```prisma
model Restaurant {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  description String?
  
  street      String
  city        String
  state       String
  zipCode     String
  country     String   @default("US")
  geoLat      Float?
  geoLng      Float?
  
  phone       String
  email       String
  
  logo            String?
  primaryColor    String   @default("#282e59")
  secondaryColor  String   @default("#f03e42")
  accentColor     String   @default("#ffffff")
  
  // Relations
  users UserRestaurant[]
  rolePermissions   RolePermissions[]
  
  // Settings relations
  financialSettings FinancialSettings?
  deliverySettings  DeliverySettings?
  storeHours        StoreHours?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("restaurants")
}

model RolePermissions {
  id String @id @default(auto()) @map("_id") @db.ObjectId
  
  restaurantId String @db.ObjectId
  restaurant Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  role String // owner, manager, kitchen, staff
  
  dashboard Boolean @default(true)
  menuManagement Boolean @default(false)
  orders Boolean @default(false)
  kitchen Boolean @default(false)
  customers Boolean @default(false)
  marketing Boolean @default(false)
  analytics Boolean @default(false)
  settings Boolean @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([restaurantId, role])
  @@map("role_permissions")
}
```

### 2.3 User Invitation & Request Models (Not Yet Implemented)
**Recommended Schema Addition:**

```prisma
model UserInvitation {
  id String @id @default(auto()) @map("_id") @db.ObjectId
  
  restaurantId String @db.ObjectId
  restaurant Restaurant @relation("Invitations", fields: [restaurantId], references: [id], onDelete: Cascade)
  
  invitedEmail String
  role String // staff, manager, kitchen
  
  token String @unique // For invitation link
  tokenExpiresAt DateTime
  
  status String @default("pending") // pending, accepted, declined, expired
  
  invitedBy String @db.ObjectId // User who sent invitation
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([restaurantId])
  @@index([invitedEmail])
  @@map("user_invitations")
}

model AccessRequest {
  id String @id @default(auto()) @map("_id") @db.ObjectId
  
  userId String @db.ObjectId
  user User @relation("AccessRequests", fields: [userId], references: [id], onDelete: Cascade)
  
  restaurantId String @db.ObjectId
  restaurant Restaurant @relation("AccessRequests", fields: [restaurantId], references: [id], onDelete: Cascade)
  
  requestedRole String @default("staff") // What role they're requesting
  message String? // Optional message from requester
  
  status String @default("pending") // pending, approved, rejected
  reviewedBy String? @db.ObjectId // Admin who reviewed
  reviewedAt DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, restaurantId])
  @@index([restaurantId])
  @@map("access_requests")
}
```

---

## 3. COMPONENTS STRUCTURE

### 3.1 UI Components (Primitive)
**Location:** `/components/ui/`

**Available Components:**
- `Button.tsx` - With variants: primary, secondary, ghost, danger
- `Input.tsx` - Text input with error states
- `Card.tsx` - Container with variants: default, bordered, elevated
- `Modal.tsx` - Dialog with backdrop and keyboard support
- `Toast.tsx` - Notification component
- `FormField.tsx` - Label + input wrapper with error/description
- `DropdownMenu.tsx` - Menu with positioning
- `Select.tsx` - Dropdown select
- `Avatar.tsx` - User avatar display
- `Toggle.tsx` - Toggle switch
- `NumberInput.tsx` - Numeric input
- `Container.tsx` - Layout container
- `Typography.tsx` - Text components
- `ColorPicker.tsx` - Color selection

**Button Component Example:**
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

// Usage:
<Button variant="primary" size="md">Submit</Button>
```

### 3.2 Shared Components (Composite)
**Location:** `/components/shared/`

**Available Components:**
- `FormField.tsx` - Form label with error display
- `FormSection.tsx` - Section wrapper for form groups
- `ValidationInput.tsx` - Input with validation
- `ImageUpload.tsx` - File upload component
- `LocationAutocomplete.tsx` - Location picker with Mapbox
- `SearchFilter.tsx` - Search with filters
- `Pagination.tsx` - Pagination controls
- `Tabs.tsx` - Tab navigation
- `OrderModal.tsx` - Order display modal
- `Badge.tsx` - Status badge
- `InfoCard.tsx` - Information card

### 3.3 Toast/Notification System
**Location:** `/components/ui/Toast.tsx`, `/components/ui/ToastContainer.tsx`

**Pattern:**
```typescript
// Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

// Usage
const { showToast } = useToast();
showToast('success', 'Invitation sent successfully!');
showToast('error', 'Failed to send invitation');
```

**Toast Types:** success | error | info | warning

### 3.4 Form Patterns
**FormField Component:**
```typescript
<FormField
  label="Email"
  description="The email address of the person to invite"
  error={errors.email}
  required
>
  <Input
    name="email"
    type="email"
    placeholder="user@example.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</FormField>
```

### 3.5 Modal Pattern
**Modal Component:**
```typescript
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Invite Team Member"
  size="md"
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="primary" onClick={handleSubmit}>Send Invite</Button>
    </>
  }
>
  {/* Form content here */}
</Modal>
```

---

## 4. EXISTING PATTERNS FOR KEY FEATURES

### 4.1 Error Handling Pattern

**Server Actions:**
```typescript
export async function someAction(data: any) {
  try {
    // Check auth
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized", data: null };
    }

    // Validate input
    if (!data.field?.trim()) {
      return { success: false, error: 'Field is required', data: null };
    }

    // Database operation
    const result = await prisma.model.create({...});

    // Revalidate cache
    revalidatePath('/path');

    return { success: true, data: result, error: null };
  } catch (error) {
    console.error('Error context:', error);
    return { success: false, error: 'User-friendly message', data: null };
  }
}
```

**Hook/Component:**
```typescript
const mutation = useMutation({
  mutationFn: async (data) => {
    const result = await serverAction(data);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  },
  onSuccess: () => {
    showToast('success', 'Action completed!');
    queryClient.invalidateQueries({...});
  },
  onError: (error) => {
    showToast('error', error.message);
  },
});
```

### 4.2 React Query Cache Invalidation Pattern

**Standard Pattern:**
```typescript
export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const result = await serverAction(data);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (newData) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      
      // Optional: Update cache directly (optimistic)
      queryClient.setQueryData(['items'], (old: any[]) => [...old, newData]);
    },
  });
}
```

### 4.3 Server Action Success Response Pattern

**Consistent Across Codebase:**
```typescript
type ActionResponse<T> = {
  success: boolean;
  error: string | null;
  data: T | null;
};

// Usage
const result = await createRestaurant(data);
if (result.success) {
  // Use result.data
} else {
  // Show result.error
}
```

### 4.4 Authentication & Authorization Pattern

**In Server Actions:**
```typescript
const session = await auth();
if (!session?.user?.email) {
  return { success: false, error: "Unauthorized" };
}

const user = await prisma.user.findUnique({
  where: { email: session.user.email },
  include: {
    restaurants: {
      where: { restaurantId: id, role: { in: ['owner', 'manager'] } }
    }
  }
});

if (!user || user.restaurants.length === 0) {
  return { success: false, error: 'Access denied' };
}
```

### 4.5 i18n Usage Pattern

**In Components:**
```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function Component() {
  const t = useTranslations('section');
  const commonT = useTranslations('common');
  
  return <h1>{t('title')}</h1>;
}
```

**Add to i18n/messages/en.json:**
```json
{
  "invitations": {
    "title": "Send Invitation",
    "emailLabel": "Email Address",
    "roleLabel": "Role",
    "buttonSend": "Send Invitation",
    "successMessage": "Invitation sent successfully!",
    "errorMessage": "Failed to send invitation"
  }
}
```

---

## 5. PROVIDER INTERFACES (For Email Implementation)

### 5.1 Payment Provider Interface (Reference)
**Location:** `/lib/payment/interfaces/IPaymentProvider.ts`

```typescript
export interface IPaymentProvider {
  initialize(config: any): Promise<void>;
  createPaymentIntent(options: PaymentIntentOptions): Promise<PaymentIntentResult>;
  confirmPayment(options: PaymentConfirmOptions): Promise<PaymentConfirmResult>;
  getPaymentStatus(paymentIntentId: string): Promise<PaymentStatusResult>;
  processRefund(options: RefundOptions): Promise<RefundResult>;
  verifyWebhook(options: WebhookVerificationOptions): any;
  getProviderName(): string;
}
```

### 5.2 Email Provider Interface (To Create)

```typescript
// lib/email/interfaces/IEmailProvider.ts
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  metadata?: Record<string, any>;
}

export interface SendEmailResult {
  messageId: string;
  status: string;
  timestamp: Date;
}

export interface IEmailProvider {
  initialize(config: any): Promise<void>;
  sendEmail(options: EmailOptions): Promise<SendEmailResult>;
  sendBulkEmail(options: EmailOptions[]): Promise<SendEmailResult[]>;
  getProviderName(): string;
}
```

### 5.3 Storage Provider Interface (Reference)
**Location:** `/lib/storage/interfaces/IStorageProvider.ts`

```typescript
export interface UploadOptions {
  file: Buffer;
  fileName: string;
  mimeType: string;
  folder: string;
}

export interface UploadResult {
  url: string;
  key: string;
}

export interface IStorageProvider {
  upload(options: UploadOptions): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
```

---

## 6. ENVIRONMENT VARIABLES

**File:** `/.env.example`

Current Structure:
```env
# DATABASE
NEXT_DATABASE_URL=mongodb+srv://...

# AUTHENTICATION (NextAuth v5)
AUTH_SECRET="..."
AUTH_URL="https://..."

# OAUTH
GOOGLE_CLIENT_ID="..."
FACEBOOK_CLIENT_ID="..."

# PAYMENT
PAYMENT_PROVIDER="stripe"
STRIPE_TEST_SECRET_KEY="..."

# DELIVERY
DRIVER_PROVIDER="shipday"
SHIPDAY_API_KEY="..."

# FILE STORAGE
STORAGE_PROVIDER="wasabi"
WASABI_ACCESS_KEY="..."

# DEVELOPMENT
NODE_ENV="development"
```

**For Email, Add:**
```env
# EMAIL PROVIDER
EMAIL_PROVIDER="mailgun"
MAILGUN_API_KEY="..."
MAILGUN_DOMAIN="..."
EMAIL_FROM="noreply@orderchop.com"
```

---

## 7. PACKAGE DEPENDENCIES

**Key Libraries:**
- `@tanstack/react-query: ^5.90.8` - Data fetching & caching
- `next-auth: ^5.0.0-beta.30` - Authentication
- `prisma: ^6.18.0` - ORM
- `@prisma/client: ^6.18.0` - Prisma client
- `bcryptjs: ^3.0.2` - Password hashing
- `next-intl: ^4.4.0` - Internationalization
- `lucide-react: ^0.548.0` - Icons
- `tailwindcss: ^3.4.17` - Styling
- `date-fns: ^4.1.0` - Date utilities
- `axios: ^1.13.2` - HTTP client
- `zustand: ^5.0.8` - State management

---

## 8. RECOMMENDATIONS FOR YOUR FEATURES

### 8.1 Email Provider Factory (Mailgun)

**Create:** `/lib/email/providers/MailgunEmailProvider.ts`

```typescript
import { IEmailProvider, EmailOptions, SendEmailResult } from '../interfaces/IEmailProvider';
import axios from 'axios';

export class MailgunEmailProvider implements IEmailProvider {
  private apiKey: string = '';
  private domain: string = '';
  private baseUrl: string = '';

  async initialize(config: {
    apiKey: string;
    domain: string;
  }): Promise<void> {
    this.apiKey = config.apiKey;
    this.domain = config.domain;
    this.baseUrl = `https://api.mailgun.net/v3/${this.domain}`;
    console.log(`✅ Mailgun initialized for domain: ${this.domain}`);
  }

  async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
    try {
      const formData = new FormData();
      formData.append('from', options.from || `noreply@${this.domain}`);
      formData.append('to', Array.isArray(options.to) ? options.to.join(',') : options.to);
      formData.append('subject', options.subject);
      formData.append('html', options.html);
      if (options.text) formData.append('text', options.text);
      if (options.replyTo) formData.append('h:Reply-To', options.replyTo);

      const response = await axios.post(
        `${this.baseUrl}/messages`,
        formData,
        {
          auth: {
            username: 'api',
            password: this.apiKey,
          },
        }
      );

      return {
        messageId: response.data.id,
        status: 'sent',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendBulkEmail(options: EmailOptions[]): Promise<SendEmailResult[]> {
    return Promise.all(options.map(opt => this.sendEmail(opt)));
  }

  getProviderName(): string {
    return 'mailgun';
  }
}
```

**Create:** `/lib/email/EmailFactory.ts`

```typescript
import { IEmailProvider } from './interfaces/IEmailProvider';
import { MailgunEmailProvider } from './providers/MailgunEmailProvider';

export class EmailFactory {
  private static instance: IEmailProvider | null = null;

  static async getProvider(): Promise<IEmailProvider> {
    if (!this.instance) {
      const provider = process.env.EMAIL_PROVIDER || 'mailgun';

      switch (provider.toLowerCase()) {
        case 'mailgun': {
          const mailgunProvider = new MailgunEmailProvider();
          await mailgunProvider.initialize({
            apiKey: process.env.MAILGUN_API_KEY!,
            domain: process.env.MAILGUN_DOMAIN!,
          });
          this.instance = mailgunProvider;
          break;
        }
        default:
          throw new Error(`Unsupported email provider: ${provider}`);
      }

      console.log(`✅ Email provider initialized: ${provider}`);
    }

    return this.instance;
  }

  static resetInstance(): void {
    this.instance = null;
  }
}
```

### 8.2 User Invitation System

**Create:** `/lib/serverActions/invitation.actions.ts`

```typescript
'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { EmailFactory } from '@/lib/email/EmailFactory';
import crypto from 'crypto';

export async function sendRestaurantInvitation(data: {
  restaurantId: string;
  email: string;
  role: 'staff' | 'manager' | 'kitchen';
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify user owns/manages restaurant
    const userAccess = await prisma.userRestaurant.findFirst({
      where: {
        restaurantId: data.restaurantId,
        user: { email: session.user.email },
        role: { in: ['owner', 'manager'] }
      }
    });

    if (!userAccess) {
      return { success: false, error: 'Access denied' };
    }

    // Get restaurant details
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' };
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation record
    const invitation = await prisma.userInvitation.create({
      data: {
        restaurantId: data.restaurantId,
        invitedEmail: data.email,
        role: data.role,
        token,
        tokenExpiresAt,
        invitedBy: session.user.id || '',
      }
    });

    // Send email
    const emailProvider = await EmailFactory.getProvider();
    const inviteLink = `${process.env.AUTH_URL}/invitations/${token}`;

    await emailProvider.sendEmail({
      to: data.email,
      subject: `You're invited to join ${restaurant.name} on OrderChop`,
      html: `
        <h2>You're invited!</h2>
        <p>${restaurant.name} has invited you to join as a ${data.role}.</p>
        <a href="${inviteLink}" style="background: #282e59; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Accept Invitation
        </a>
        <p>This invitation expires in 7 days.</p>
      `,
      from: process.env.EMAIL_FROM,
    });

    revalidatePath(`/${data.restaurantId}/settings`);
    return { success: true, data: invitation, error: null };
  } catch (error) {
    console.error('Error sending invitation:', error);
    return { success: false, error: 'Failed to send invitation' };
  }
}

export async function acceptInvitation(token: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    // Find invitation
    const invitation = await prisma.userInvitation.findUnique({
      where: { token },
      include: { restaurant: true }
    });

    if (!invitation) {
      return { success: false, error: 'Invitation not found' };
    }

    if (new Date() > invitation.tokenExpiresAt) {
      return { success: false, error: 'Invitation has expired' };
    }

    if (invitation.status !== 'pending') {
      return { success: false, error: 'Invitation already processed' };
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || '',
          status: 'active'
        }
      });
    }

    // Check if user already has access
    const existing = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: user.id,
          restaurantId: invitation.restaurantId
        }
      }
    });

    if (existing) {
      return { success: false, error: 'You already have access to this restaurant' };
    }

    // Grant access
    await prisma.userRestaurant.create({
      data: {
        userId: user.id,
        restaurantId: invitation.restaurantId,
        role: invitation.role
      }
    });

    // Mark invitation as accepted
    await prisma.userInvitation.update({
      where: { id: invitation.id },
      data: { status: 'accepted' }
    });

    revalidatePath('/setup');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return { success: false, error: 'Failed to accept invitation' };
  }
}
```

### 8.3 Role Management

**Use existing RolePermissions model** - Already defined in schema.prisma

Create server action:
```typescript
'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function updateUserRole(data: {
  restaurantId: string;
  userId: string;
  newRole: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify user is owner/manager
    const managerAccess = await prisma.userRestaurant.findFirst({
      where: {
        restaurantId: data.restaurantId,
        user: { email: session.user.email },
        role: { in: ['owner', 'manager'] }
      }
    });

    if (!managerAccess) {
      return { success: false, error: 'Access denied' };
    }

    // Update role
    const updated = await prisma.userRestaurant.update({
      where: {
        userId_restaurantId: {
          userId: data.userId,
          restaurantId: data.restaurantId
        }
      },
      data: { role: data.newRole }
    });

    revalidatePath(`/${data.restaurantId}/settings`);
    return { success: true, data: updated, error: null };
  } catch (error) {
    return { success: false, error: 'Failed to update role' };
  }
}
```

### 8.4 Request to Join Restaurant

**Create Prisma Model** (add to schema):
```prisma
model AccessRequest {
  id String @id @default(auto()) @map("_id") @db.ObjectId
  
  userId String @db.ObjectId
  user User @relation("AccessRequests", fields: [userId], references: [id], onDelete: Cascade)
  
  restaurantId String @db.ObjectId
  restaurant Restaurant @relation("AccessRequests", fields: [restaurantId], references: [id], onDelete: Cascade)
  
  requestedRole String @default("staff")
  message String?
  
  status String @default("pending") // pending, approved, rejected
  reviewedBy String? @db.ObjectId
  reviewedAt DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, restaurantId])
  @@map("access_requests")
}
```

**Create Server Actions:**
```typescript
'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { EmailFactory } from '@/lib/email/EmailFactory';

export async function requestRestaurantAccess(data: {
  restaurantId: string;
  message?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if already has access or pending request
    const existing = await prisma.accessRequest.findUnique({
      where: {
        userId_restaurantId: {
          userId: user.id,
          restaurantId: data.restaurantId
        }
      }
    });

    if (existing && existing.status === 'pending') {
      return { success: false, error: 'Request already pending' };
    }

    // Create request
    const request = await prisma.accessRequest.create({
      data: {
        userId: user.id,
        restaurantId: data.restaurantId,
        message: data.message
      }
    });

    // Notify owners/managers
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: data.restaurantId },
      include: {
        users: {
          where: { role: { in: ['owner', 'manager'] } },
          include: { user: true }
        }
      }
    });

    if (restaurant?.users.length) {
      const emailProvider = await EmailFactory.getProvider();
      
      for (const ur of restaurant.users) {
        await emailProvider.sendEmail({
          to: ur.user.email,
          subject: `New access request for ${restaurant.name}`,
          html: `
            <h2>Access Request</h2>
            <p>${user.name} (${user.email}) has requested access to ${restaurant.name}</p>
            <p>Message: ${data.message || 'No message provided'}</p>
            <a href="${process.env.AUTH_URL}/${data.restaurantId}/settings/team">
              Review Request
            </a>
          `,
          from: process.env.EMAIL_FROM,
        });
      }
    }

    return { success: true, data: request, error: null };
  } catch (error) {
    return { success: false, error: 'Failed to create request' };
  }
}

export async function approveAccessRequest(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    const request = await prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: { user: true, restaurant: true }
    });

    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    // Grant access
    await prisma.userRestaurant.create({
      data: {
        userId: request.userId,
        restaurantId: request.restaurantId,
        role: request.requestedRole
      }
    });

    // Update request
    await prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        reviewedBy: session.user.id,
        reviewedAt: new Date()
      }
    });

    // Notify user
    const emailProvider = await EmailFactory.getProvider();
    await emailProvider.sendEmail({
      to: request.user.email,
      subject: `Access approved for ${request.restaurant.name}`,
      html: `
        <h2>Access Approved</h2>
        <p>Your request to join ${request.restaurant.name} has been approved!</p>
      `,
      from: process.env.EMAIL_FROM,
    });

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: 'Failed to approve request' };
  }
}
```

---

## 9. TYPESCRIPT PATTERNS

### 9.1 Type Patterns

**Server Action Response Type:**
```typescript
type ServerActionResponse<T> = {
  success: boolean;
  error: string | null;
  data: T | null;
};
```

**Hook Hook Type:**
```typescript
type UseQueryOptions = {
  queryKey: string[];
  queryFn: () => Promise<T>;
  staleTime?: number;
  enabled?: boolean;
};
```

### 9.2 Form Data Pattern

```typescript
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  
  const formData = new FormData(e.currentTarget);
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  // Use mutation
  await mutation.mutateAsync({ email, password });
}
```

---

## 10. FILE STRUCTURE SUMMARY

```
/home/user/Nextjs-OC/
├── lib/
│   ├── auth.ts                     # NextAuth configuration
│   ├── prisma.ts                   # Prisma client singleton
│   ├── queryClient.ts              # React Query setup
│   ├── utils.ts                    # Utility functions
│   ├── constants/
│   │   └── currencies.ts
│   ├── payment/
│   │   ├── PaymentFactory.ts
│   │   ├── index.ts
│   │   ├── interfaces/
│   │   │   └── IPaymentProvider.ts
│   │   └── providers/
│   │       ├── StripePaymentProvider.ts
│   │       └── MercadoPagoPaymentProvider.ts
│   ├── delivery/
│   │   ├── DeliveryFactory.ts
│   │   ├── interfaces/
│   │   │   └── IDeliveryProvider.ts
│   │   └── providers/
│   ├── storage/
│   │   ├── StorageFactory.ts
│   │   ├── interfaces/
│   │   │   └── IStorageProvider.ts
│   │   └── providers/
│   ├── email/                      # TO CREATE
│   │   ├── EmailFactory.ts
│   │   ├── interfaces/
│   │   │   └── IEmailProvider.ts
│   │   └── providers/
│   │       └── MailgunEmailProvider.ts
│   ├── utils/
│   │   ├── validation.ts           # Email/phone validation
│   │   ├── taxCalculator.ts
│   │   ├── currencyConverter.ts
│   │   ├── dateFormatter.ts
│   │   └── ...
│   └── serverActions/
│       ├── auth.actions.ts
│       ├── restaurant.actions.ts
│       ├── menu.actions.ts
│       ├── order.actions.ts
│       └── invitation.actions.ts   # TO CREATE
├── prisma/
│   ├── schema.prisma
│   ├── user.prisma
│   ├── restaurant.prisma
│   ├── menu.prisma
│   ├── kitchen.prisma
│   └── settings.prisma
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── FormField.tsx
│   │   └── index.ts
│   ├── shared/
│   │   ├── FormField.tsx
│   │   ├── ValidationInput.tsx
│   │   └── ...
│   ├── providers/
│   │   └── QueryProvider.tsx
│   ├── auth/
│   │   └── AuthForm.tsx
│   └── ...
├── hooks/
│   ├── useAuth.ts
│   ├── useRestaurants.ts
│   ├── useOrders.ts
│   ├── useMenu.ts
│   └── ...
├── i18n/
│   ├── request.ts
│   └── messages/
│       ├── en.json
│       ├── pt.json
│       └── es.json
├── app/
│   ├── layout.tsx
│   ├── auth/
│   ├── (private)/
│   └── api/
├── types/
├── stores/                         # Zustand state
├── middleware.ts
├── package.json
└── tailwind.config.ts
```

---

## 11. KEY TAKEAWAYS FOR IMPLEMENTATION

1. **Factory Pattern**: Follow the same pattern for EmailProvider - singleton with async initialization

2. **Server Actions**: Always include auth check, validation, and revalidation

3. **Error Handling**: Use consistent response format: `{ success, data, error }`

4. **React Query**: Leverage for caching and mutations with proper invalidation

5. **Toast Notifications**: Use `useToast()` hook for user feedback

6. **i18n**: Add translation keys to all JSON files for multiLanguage support

7. **Prisma Models**: Create invitation and access request models as shown above

8. **Email**: Implement via factory pattern with Mailgun provider

9. **Type Safety**: Use TypeScript interfaces for all data structures

10. **Environment Variables**: Add email provider config to .env

