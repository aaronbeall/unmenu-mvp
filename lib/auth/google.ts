import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../supabase';

WebBrowser.maybeCompleteAuthSession();

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: googleWebClientId,
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
  });

  const signInWithGoogle = async () => {
    try {
      const result = await promptAsync();
      
      if (result.type === 'success') {
        const { id_token } = result.params;
        
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: id_token,
        });

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: data.user.email!,
              full_name: data.user.user_metadata.full_name,
              avatar_url: data.user.user_metadata.avatar_url,
            });

          if (profileError) console.error('Error creating profile:', profileError);
        }

        return data;
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  return {
    signInWithGoogle,
    request,
  };
}
