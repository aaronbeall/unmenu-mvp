import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../supabase';
import { Platform } from 'react-native';

export async function signInWithApple() {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign In is only available on iOS');
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (credential.identityToken) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;

      if (data.user) {
        const fullName = credential.fullName
          ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
          : null;

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName,
          });

        if (profileError) console.error('Error creating profile:', profileError);
      }

      return data;
    }
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return null;
    }
    console.error('Apple sign in error:', error);
    throw error;
  }
}

export async function isAppleAuthAvailable() {
  return await AppleAuthentication.isAvailableAsync();
}
