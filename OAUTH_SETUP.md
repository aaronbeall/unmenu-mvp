# OAuth Setup for Development

## Current Issue

Google OAuth is hanging in Expo Go because `WebBrowser.openAuthSessionAsync` doesn't properly handle the redirect back to the app in development mode.

## Quick Fix for Testing

For now, you can test the app without OAuth by temporarily bypassing authentication:

### Option 1: Skip Auth for Development

In `app/_layout.tsx`, temporarily comment out the auth redirect:

```typescript
useEffect(() => {
  if (loading) return;

  const inAuthGroup = segments[0] === '(auth)';

  // Temporarily disabled for testing
  // if (!session && !inAuthGroup) {
  //   router.replace('/(auth)/login');
  // } else if (session && inAuthGroup) {
  //   router.replace('/(tabs)');
  // }
}, [session, segments, loading]);
```

Then you can navigate directly to the tabs to test the menu scanning functionality.

### Option 2: Use Development Build (Recommended)

The OAuth flow works properly in a development build (not Expo Go):

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure the project
eas build:configure

# Build development client for your device
eas build --profile development --platform android
# or
eas build --profile development --platform ios

# Install the built app on your device
# Then run:
npx expo start --dev-client
```

With a development build, the OAuth flow will work correctly because it's a standalone app with proper deep linking.

## Why This Happens

1. **Expo Go limitations**: Expo Go uses the `exp://` scheme which doesn't work well with OAuth redirects
2. **Browser session**: `WebBrowser.openAuthSessionAsync` expects the browser to redirect back, but the redirect URL (`exp://192.168.1.183:8081`) isn't recognized as a valid app link by the system
3. **Deep linking**: Standalone apps (development builds or production) have proper deep linking registered with the OS

## Production OAuth Will Work

The current OAuth implementation is correct for production. Once you build a standalone app:

1. The app will use the `unmenu://` scheme
2. iOS/Android will recognize it as a valid app link
3. OAuth will redirect properly
4. The URL listener in `_layout.tsx` will catch the tokens
5. Login will complete successfully

## Next Steps

**For immediate testing:**
- Use Option 1 above to bypass auth temporarily
- Test the menu scanning features

**For proper OAuth testing:**
- Use Option 2 to create a development build
- This gives you a standalone app that works like production

**For production:**
- The current implementation is ready to go
- Just build with `eas build --profile production`
