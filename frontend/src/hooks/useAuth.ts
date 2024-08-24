import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';

export function useAuth() {
  const { user, setUser, clearUser, isAuthenticated } = useAuthStore();

  const { isLoading } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      try {
        const profile = await authApi.getProfile();
        setUser(profile);
        return profile;
      } catch (error) {
        clearUser();
        throw error;
      }
    },
    enabled: !user && !!localStorage.getItem('access_token'),
    retry: false,
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    logout: () => {
      clearUser();
      authApi.logout();
    },
  };
}
