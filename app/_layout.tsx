import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { useStore } from '@/lib/store/useStore';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
  },
});

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const setSession = useStore((state) => state.setSession);

  useEffect(() => {
    setSession(session);
  }, [session, setSession]);

  // Handle OAuth callbacks
  useEffect(() => {
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      console.log('Received URL:', url);
      
      // Handle both exp:// (development) and unmenu:// (production) schemes
      if (url.includes('access_token') || url.includes('refresh_token')) {
        try {
          const urlParts = url.split('#');
          const hash = urlParts.length > 1 ? urlParts[1] : urlParts[0].split('?')[1];
          const params = new URLSearchParams(hash);
          
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          console.log('Tokens found:', { 
            hasAccess: !!accessToken, 
            hasRefresh: !!refreshToken 
          });

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Error setting session:', error);
              return;
            }

            console.log('Session set successfully:', data.user?.email);
          }
        } catch (error) {
          console.error('Error processing OAuth callback:', error);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments, loading]);

  return (
    <>
      <StatusBar style="auto" />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
