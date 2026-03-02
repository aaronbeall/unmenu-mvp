# UnMenu Setup Guide

This guide will walk you through setting up UnMenu for development and deployment.

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

**Option A: Use Supabase Cloud (Recommended for production)**

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy `.env.example` to `.env`
4. Add your Supabase URL and anon key to `.env`
5. Run the migration SQL in Supabase SQL Editor

**Option B: Use Local Supabase (For development)**

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase
supabase start

# Apply migrations
supabase db reset
```

### 3. Set Up OpenAI

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Add to `.env`: `OPENAI_API_KEY=sk-...`
3. Add credits to your OpenAI account

### 4. Configure OAuth (Optional for testing)

**For testing without OAuth:**
- You can skip Google/Apple setup initially
- Comment out OAuth buttons in `app/(auth)/login.tsx`
- Use email auth instead (requires additional setup)

**For production:**
- Follow Google OAuth setup in main README
- Follow Apple Sign In setup in main README

### 5. Start the App

```bash
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web (limited functionality)

## Detailed Setup Steps

### Supabase Database Setup

#### 1. Create Tables

Run this SQL in Supabase SQL Editor:

```sql
-- Copy content from supabase/migrations/001_initial_schema.sql
```

#### 2. Create Storage Bucket

1. Go to Storage in Supabase Dashboard
2. Click "New bucket"
3. Name: `menu-images`
4. Public bucket: Yes
5. Create bucket

#### 3. Set Up Storage Policies

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload menu images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images');

-- Allow public read access
CREATE POLICY "Public can view menu images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu-images');
```

### Edge Function Deployment

#### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

#### 2. Login and Link Project

```bash
supabase login
supabase link --project-ref your-project-ref
```

#### 3. Deploy Function

```bash
cd supabase/functions
supabase functions deploy scan-menu
```

#### 4. Set Secrets

```bash
supabase secrets set OPENAI_API_KEY=your-key
supabase secrets set FREE_TIER_SCANS=5
supabase secrets set PRO_TIER_SCANS=100
```

### Google OAuth Setup (Detailed)

#### 1. Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable APIs: Google+ API

#### 2. Create OAuth Credentials

**Web Client (for Supabase):**
1. Credentials > Create Credentials > OAuth 2.0 Client ID
2. Application type: Web application
3. Authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
4. Save Client ID and Secret

**iOS Client:**
1. Create new OAuth 2.0 Client ID
2. Application type: iOS
3. Bundle ID: `com.unmenu.app`
4. Save Client ID

**Android Client:**
1. Create new OAuth 2.0 Client ID
2. Application type: Android
3. Package name: `com.unmenu.app`
4. Get SHA-1 fingerprint:
   ```bash
   # For debug
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
5. Save Client ID

#### 3. Configure Supabase

1. Supabase Dashboard > Authentication > Providers
2. Enable Google
3. Add Web Client ID and Secret
4. Save

#### 4. Update .env

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxx.apps.googleusercontent.com
```

### Apple Sign In Setup (iOS)

#### 1. Apple Developer Account

1. Go to [developer.apple.com](https://developer.apple.com)
2. Certificates, Identifiers & Profiles

#### 2. Create App ID

1. Identifiers > App IDs > Register
2. Description: UnMenu
3. Bundle ID: `com.unmenu.app`
4. Capabilities: Sign In with Apple (enabled)
5. Register

#### 3. Create Service ID

1. Identifiers > Services IDs > Register
2. Description: UnMenu Web
3. Identifier: `com.unmenu.app.web`
4. Enable Sign In with Apple
5. Configure:
   - Primary App ID: `com.unmenu.app`
   - Domains: `your-project.supabase.co`
   - Return URLs: `https://your-project.supabase.co/auth/v1/callback`
6. Save

#### 4. Create Key

1. Keys > Register a New Key
2. Key Name: UnMenu Sign In Key
3. Enable Sign In with Apple
4. Configure > Primary App ID: `com.unmenu.app`
5. Download .p8 file (save securely!)
6. Note Key ID and Team ID

#### 5. Configure Supabase

1. Supabase Dashboard > Authentication > Providers
2. Enable Apple
3. Add:
   - Service ID: `com.unmenu.app.web`
   - Team ID: (from Apple Developer)
   - Key ID: (from Apple Developer)
   - Private Key: (contents of .p8 file)
4. Save

### Testing the App

#### 1. Test Authentication

```bash
# Start app
npm start

# Open in iOS simulator
i
```

1. Click "Continue with Google"
2. Sign in with Google account
3. Should redirect to main app

#### 2. Test Menu Scanning

1. Use a sample menu image (search "restaurant menu" online)
2. Click "Choose from Library"
3. Select image
4. Wait for processing (30-60 seconds)
5. View results with generated images

#### 3. Test Database

```sql
-- Check if user was created
SELECT * FROM profiles;

-- Check if scan was saved
SELECT * FROM menu_scans;

-- Check menu items
SELECT * FROM menu_items;
```

#### 4. Test Caching

1. Scan the same menu twice
2. Second scan should be instant
3. Check cache table:
   ```sql
   SELECT * FROM scan_cache;
   ```

#### 5. Test Rate Limiting

1. Make 6 rapid scan attempts (free tier limit is 5/hour)
2. Should see "Rate limit exceeded" error
3. Check rate limits:
   ```sql
   SELECT * FROM rate_limits;
   ```

### Common Setup Issues

#### Issue: "Supabase URL is not defined"

**Solution:**
```bash
# Make sure .env file exists
cp .env.example .env

# Add your Supabase credentials
# Restart Expo server
```

#### Issue: "OpenAI API error"

**Solution:**
- Check API key is correct
- Verify you have credits in OpenAI account
- Check Edge Function logs:
  ```bash
  supabase functions logs scan-menu
  ```

#### Issue: "Google Sign In not working"

**Solution:**
- Verify all three client IDs are in `.env`
- Check OAuth consent screen is configured
- Ensure redirect URIs match exactly
- Try clearing Expo cache: `expo start -c`

#### Issue: "Images not generating"

**Solution:**
- DALL-E 3 is expensive (~$0.04/image)
- Check OpenAI account has sufficient credits
- Reduce image quality in Edge Function if needed
- Consider using placeholder images for development

#### Issue: "Location not working"

**Solution:**
- iOS Simulator: Features > Location > Custom Location
- Android Emulator: Extended controls > Location
- Real device: Enable location services

### Development Tips

#### 1. Use Local Supabase for Development

```bash
# Start local instance
supabase start

# Get local credentials
supabase status

# Update .env with local URLs
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
```

#### 2. Mock AI Responses for Testing

Create `lib/services/scanner.mock.ts`:

```typescript
export async function scanMenuMock() {
  return {
    scan_id: 'mock-id',
    items: [
      {
        name: 'Pad Thai',
        description: 'Stir-fried rice noodles',
        taste_profile: 'Sweet, sour, and savory',
        similar_dishes: ['Singapore Noodles'],
        allergens: ['peanuts', 'shellfish'],
        price: '$12.99',
        category: 'Main Course',
      },
    ],
    original_image_url: 'https://via.placeholder.com/400',
  };
}
```

#### 3. Reduce Costs During Development

- Comment out DALL-E image generation
- Use smaller GPT model for testing
- Implement request caching aggressively
- Use mock data when possible

#### 4. Debug Edge Functions Locally

```bash
# Serve function locally
supabase functions serve scan-menu

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/scan-menu' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"image_base64":"...","language":"en"}'
```

### Production Deployment

#### 1. Build with EAS

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build iOS
eas build --platform ios --profile production

# Build Android
eas build --platform android --profile production
```

#### 2. Set Production Secrets

```bash
# Set all environment variables
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://your-project.supabase.co
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-anon-key
# ... etc
```

#### 3. Submit to App Stores

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

### Monitoring and Maintenance

#### 1. Monitor Costs

- **OpenAI Dashboard**: Check API usage and costs
- **Supabase Dashboard**: Monitor database size and bandwidth
- Set up billing alerts in both platforms

#### 2. Database Maintenance

```sql
-- Check cache hit rate
SELECT 
  COUNT(*) as total_cached,
  SUM(hit_count) as total_hits,
  AVG(hit_count) as avg_hits_per_cache
FROM scan_cache;

-- Check scan usage by tier
SELECT 
  subscription_tier,
  COUNT(*) as user_count,
  AVG(scans_used_this_month) as avg_scans
FROM profiles
GROUP BY subscription_tier;

-- Clean old data (optional)
DELETE FROM menu_scans WHERE created_at < NOW() - INTERVAL '90 days';
```

#### 3. Performance Optimization

- Enable Supabase connection pooling
- Add database indexes for slow queries
- Implement CDN for generated images
- Use image compression for uploads

## Next Steps

1. ✅ Complete basic setup
2. ✅ Test all features locally
3. 📱 Build and test on real devices
4. 💰 Set up payment processing (Stripe/RevenueCat)
5. 📊 Add analytics (Mixpanel/Amplitude)
6. 🐛 Set up error tracking (Sentry)
7. 🚀 Deploy to production
8. 📈 Monitor and optimize

## Support

- **Documentation**: See main README.md
- **Issues**: Create GitHub issue
- **Community**: Join Discord (coming soon)
