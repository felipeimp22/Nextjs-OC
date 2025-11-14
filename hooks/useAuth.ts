'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getCurrentUser, 
  signIn as serverSignIn, 
  signUp as serverSignUp,
  signOut as serverSignOut 
} from '@/lib/serverActions/auth.actions';

// Query key for current user
const CURRENT_USER_KEY = ['currentUser'];

/**
 * Hook to get current authenticated user with caching
 * 
 * Benefits:
 * - Automatic caching (5 min fresh, 30 min cache)
 * - Background refetching
 * - Loading states
 * - Error handling
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: async () => {
      const result = await getCurrentUser();
      if (!result.success) {
        throw new Error(result.user ? 'Failed to fetch user' : 'Not authenticated');
      }
      return result.user;
    },
    retry: false, // Don't retry on 401/403
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  });
}

/**
 * Hook to sign in with cache invalidation
 * 
 * After successful sign in:
 * - Invalidates current user cache
 * - Refetches user data
 * - Redirects to dashboard
 */
export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const result = await serverSignIn(credentials);
      if (!result.success) {
        throw new Error(result.error || 'Failed to sign in');
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });

      // Check for pending invitation
      const pendingInvitation = localStorage.getItem('pendingInvitation');
      if (pendingInvitation) {
        localStorage.removeItem('pendingInvitation');
        window.location.href = `/invitations/${pendingInvitation}`;
      } else {
        // Redirect to setup
        window.location.href = '/setup';
      }
    },
  });
}

/**
 * Hook to sign up with cache invalidation
 * 
 * After successful sign up:
 * - Invalidates current user cache
 * - Refetches user data
 * - Redirects to dashboard
 */
export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const result = await serverSignUp(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to sign up');
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });

      // Check for pending invitation
      const pendingInvitation = localStorage.getItem('pendingInvitation');
      if (pendingInvitation) {
        localStorage.removeItem('pendingInvitation');
        window.location.href = `/invitations/${pendingInvitation}`;
      } else {
        // Redirect to setup
        window.location.href = '/setup';
      }
    },
  });
}

/**
 * Hook to sign out with cache clearing
 * 
 * After sign out:
 * - Clears all cached data
 * - Redirects to home
 */
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await serverSignOut();
      if (!result.success) {
        throw new Error('Failed to sign out');
      }
      return result;
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      // Redirect to home
      window.location.href = '/';
    },
  });
}

/**
 * Hook to check if user is authenticated
 * Uses cached data without making API call
 */
export function useIsAuthenticated() {
  const { data: user, isLoading } = useCurrentUser();
  
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}