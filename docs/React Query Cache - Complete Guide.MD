# 🚀 React Query Cache - Complete Guide

## ✅ What's Cached Now

After the updates, **YES - we are now using cache!** Here's what's cached:

### 1. **User Authentication** ✅
- Current user data
- User restaurants
- User status
- 5 minute fresh time
- 30 minute cache time

### 2. **Restaurant Data** ✅
- Restaurant list
- Individual restaurants
- Restaurant stats
- Automatic refetch on mutations

---

## 🎯 How the Cache Works

### Before (No Cache)
```typescript
// Old way - no caching
async function handleSubmit() {
  const result = await signIn({ email, password });
  if (result.success) {
    window.location.href = '/setup';
  }
}

// Problem: Every time you need user data, you make a new API call
// No optimization, slower performance
```

### After (With Cache) ✅
```typescript
// New way - with React Query caching
const signInMutation = useSignIn();

async function handleSubmit() {
  await signInMutation.mutateAsync({ email, password });
  // User data is now cached!
  // Redirect happens automatically
}

// Benefit: User data is cached for 5 minutes
// No unnecessary API calls!
```

---

## 🔍 Cache Lifecycle Example

Let's trace what happens when you sign in:

### Step 1: User Signs In
```typescript
// User fills form and submits
await signInMutation.mutateAsync({ email, password });

// What happens:
// 1. Server action called: signIn()
// 2. Database query executed
// 3. User authenticated
// 4. Response returned
```

### Step 2: Cache is Invalidated
```typescript
// Inside useSignIn hook:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['currentUser'] });
  // This marks the cache as stale
}
```

### Step 3: User Data is Cached
```typescript
// When dashboard loads:
const { data: user } = useCurrentUser();

// What happens:
// 1. React Query checks cache
// 2. No cache exists (first time)
// 3. Calls getCurrentUser()
// 4. Stores result in cache for 5 minutes
// 5. Returns user data
```

### Step 4: Subsequent Requests Use Cache
```typescript
// User navigates to different page
const { data: user } = useCurrentUser();

// What happens:
// 1. React Query checks cache
// 2. Cache exists and is fresh (<5 min old)
// 3. Returns cached data immediately
// 4. NO API call made! ⚡
```

### Step 5: Background Refetch (Optional)
```typescript
// After 5 minutes (staleTime elapsed):
const { data: user } = useCurrentUser();

// What happens:
// 1. Returns cached data immediately (still in 30 min window)
// 2. Triggers background refetch
// 3. Updates cache silently if data changed
// 4. No loading spinner needed!
```

---

## 📊 Cache Configuration

### Current Settings (lib/queryClient.ts)
```typescript
{
  staleTime: 1000 * 60 * 5,      // 5 minutes - data considered "fresh"
  gcTime: 1000 * 60 * 30,         // 30 minutes - cache kept in memory
  refetchOnWindowFocus: false,    // Don't refetch when tab regains focus
  retry: 1,                       // Retry failed requests once
}
```

### What Each Setting Means

**staleTime (5 minutes)**
- Data is considered "fresh" for 5 minutes
- During this time, NO API calls are made
- Returns cached data instantly

**gcTime (30 minutes)**
- Cache is kept in memory for 30 minutes
- Even if stale, can still return cached data
- After 30 minutes, cache is garbage collected

**refetchOnWindowFocus (false)**
- Don't refetch when switching browser tabs
- Good for auth data (doesn't change often)
- Can be enabled for real-time data

**retry (1)**
- If request fails, retry once
- Then show error
- Prevents infinite retry loops

---

## 💡 Real-World Examples

### Example 1: User Profile Page
```typescript
// components/profile/ProfilePage.tsx
export default function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>
      {/* Data from cache - instant! */}
    </div>
  );
}
```

### Example 2: Navigation Bar
```typescript
// components/Navbar.tsx
export default function Navbar() {
  const { isAuthenticated, user } = useIsAuthenticated();
  
  return (
    <nav>
      {isAuthenticated ? (
        <div>Welcome, {user?.name}</div>
      ) : (
        <Link href="/auth">Sign In</Link>
      )}
    </nav>
  );
}
```

### Example 3: Restaurant Dashboard
```typescript
// components/dashboard/RestaurantDashboard.tsx
export default function RestaurantDashboard() {
  const { data: restaurants } = useRestaurants();
  const { data: stats } = useRestaurantStats('restaurant-id');
  
  // Both queries use cache!
  // If data is fresh, no API calls made
  
  return (
    <div>
      <h2>Your Restaurants</h2>
      {restaurants?.map(r => <RestaurantCard key={r.id} {...r} />)}
      
      <h2>Statistics</h2>
      <StatsDisplay stats={stats} />
    </div>
  );
}
```

---

## 🎯 Cache Strategies

### Strategy 1: Optimistic Updates
```typescript
// Update UI immediately, then sync with server
const mutation = useMutation({
  mutationFn: updateRestaurant,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['restaurant', id] });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['restaurant', id]);
    
    // Optimistically update
    queryClient.setQueryData(['restaurant', id], newData);
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['restaurant', id], context?.previous);
  },
});
```

### Strategy 2: Polling (Real-time Updates)
```typescript
// Fetch new data every 30 seconds
const { data: orders } = useQuery({
  queryKey: ['orders'],
  queryFn: fetchOrders,
  refetchInterval: 30000, // 30 seconds
});
```

### Strategy 3: Prefetching
```typescript
// Load data before user navigates
const queryClient = useQueryClient();

function prefetchRestaurant(id: string) {
  queryClient.prefetchQuery({
    queryKey: ['restaurant', id],
    queryFn: () => getRestaurant(id),
  });
}

// Usage: Prefetch on hover
<Link 
  href={`/restaurant/${id}`}
  onMouseEnter={() => prefetchRestaurant(id)}
>
  View Restaurant
</Link>
```

---

## 📈 Benefits You Get

### 1. **Speed** ⚡
- Instant data loading from cache
- No waiting for API calls
- Smooth user experience

### 2. **Reduced Server Load** 🎯
- Fewer database queries
- Lower bandwidth usage
- Better scalability

### 3. **Better UX** 💎
- No loading spinners for cached data
- Background refetching
- Optimistic updates

### 4. **Developer Experience** 🛠️
- Simple hooks API
- Automatic refetching
- Built-in loading/error states

---

## 🔧 Debugging Cache

### Using React Query DevTools
```typescript
// Add to your app
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### View Cache Contents
```typescript
// In browser console
window.queryClient = queryClient;

// Then use:
queryClient.getQueryData(['currentUser']);
queryClient.getQueryState(['currentUser']);
```

---

## 📝 When to Use Cache vs Direct Calls

### ✅ Use Cache (React Query) For:
- User authentication state
- Restaurant data
- Menu items
- Orders
- Any data that's read multiple times

### ❌ Direct Server Actions For:
- One-time operations (sign out)
- File uploads
- Critical transactions (payments)
- Actions that shouldn't be retried

---

## 🎓 Summary

**Before**: Server actions called directly → No caching → Slow

**After**: React Query hooks → Smart caching → Fast! 🚀

**What's Cached**:
- ✅ User authentication (5 min fresh)
- ✅ Restaurant data (5 min fresh)
- ✅ Restaurant stats (5 min fresh)

**Benefits**:
- ⚡ Instant data loading
- 🎯 Reduced server load
- 💎 Better user experience
- 🛠️ Easier to maintain

**Next Steps**:
1. Add more cached hooks (menus, orders)
2. Implement optimistic updates
3. Add real-time polling where needed
4. Use React Query DevTools for debugging

You're now using a production-ready caching system! 🎉