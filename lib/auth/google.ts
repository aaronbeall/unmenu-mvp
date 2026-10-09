import { supabase } from '../supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {

  const signInWithGoogle = async () => {
    try {
      // Use makeRedirectUri to get the proper redirect URL
      const redirectUrl = makeRedirectUri({
        scheme: 'unmenu',
      });

      console.log('Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) throw error;

      console.log('OAuth URL:', data?.url);
      console.log('Opening browser...');

      if (data?.url) {
        // Use openAuthSessionAsync with createTask: false to prevent hanging
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
          {
            createTask: false,
          }
        );
        
        console.log('Browser result type:', result.type);
        
        if (result.type === 'success' && result.url) {
          console.log('Success! Redirect URL received');
          // The URL listener in _layout.tsx will handle the session
        } else if (result.type === 'dismiss') {
          console.log('Browser dismissed - checking for session...');
          // Sometimes the session is set even if browser is dismissed
          // The URL listener should have caught it
        }
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  return {
    signInWithGoogle,
  };
}
