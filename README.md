# UnMenu - AI Menu Scanner

An AI-powered mobile app that scans restaurant menus and provides translations, descriptions, taste profiles, similar dishes, and allergen information with generated food images.

## Features

- 📸 **Menu Scanning**: Take photos or upload images of menus
- 🌍 **Translation**: Automatic translation to your preferred language
- 🖼️ **Professional Food Images**: High-quality images from curated libraries
- 👅 **Taste Profiles**: Detailed descriptions of flavors and textures
- 🔄 **Similar Dishes**: Comparisons to familiar foods
- ⚠️ **Allergen Detection**: Common allergens in typical ingredients
- 📍 **Location-Based**: Save and view scans by restaurant location
- 🔒 **Social Login**: Google and Apple authentication
- 💎 **Subscription Tiers**: Free (10 scans/month) and Pro (100 scans/month)
- ⚡ **Aggressive Caching**: Fast results for previously scanned menus
- 🛡️ **Rate Limiting**: Built-in abuse prevention

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI Services**: 
  - OpenAI GPT-4o Vision (menu analysis)
  - Pexels/Unsplash APIs (food images)
  - Curated image database (30+ common dishes)
- **Authentication**: Supabase Auth with Google/Apple OAuth
- **Database**: PostgreSQL with PostGIS for location queries
- **Storage**: Supabase Storage for menu images

## Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- OpenAI API account
- Google Cloud Console account (for OAuth)
- Apple Developer account (for Apple Sign In, iOS only)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd unmenu
npm install
```

### 2. Supabase Setup

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings > API

#### Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Or manually run the SQL from `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor.

#### Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `menu-images`
3. Set it to **public** (or configure appropriate policies)

#### Deploy Edge Function

```bash
# Deploy the scan-menu function
supabase functions deploy scan-menu

# Set environment variables for the function
supabase secrets set OPENAI_API_KEY=your-openai-api-key
supabase secrets set FREE_TIER_SCANS=10
supabase secrets set PRO_TIER_SCANS=100

# Optional: Add image library API keys for better coverage
# (Function works with curated images if these aren't provided)
supabase secrets set PEXELS_API_KEY=your-pexels-key
supabase secrets set UNSPLASH_ACCESS_KEY=your-unsplash-key
```

#### Set up Scheduled Jobs (Optional)

In Supabase Dashboard > Database > Cron Jobs:

```sql
-- Reset monthly scans on the 1st of each month
SELECT cron.schedule(
  'reset-monthly-scans',
  '0 0 1 * *',
  $$SELECT reset_monthly_scans()$$
);

-- Clean expired cache daily
SELECT cron.schedule(
  'clean-expired-cache',
  '0 2 * * *',
  $$SELECT clean_expired_cache()$$
);
```

### 3. OpenAI Setup

1. Create an account at [platform.openai.com](https://platform.openai.com)
2. Generate an API key from API Keys section
3. Add credits to your account (GPT-4o Vision is a paid API)

### 3a. Image Library Setup (Optional but Recommended)

The app uses a curated database of 30+ common dishes by default. For better coverage, add these free API keys:

**Pexels (Recommended - No attribution required)**
1. Go to [pexels.com/api](https://www.pexels.com/api/)
2. Sign up for free
3. Get your API key (unlimited requests)
4. Add to Supabase secrets: `supabase secrets set PEXELS_API_KEY=your-key`

**Unsplash (Optional - Requires attribution)**
1. Go to [unsplash.com/developers](https://unsplash.com/developers)
2. Create an application
3. Get your Access Key (50 requests/hour free)
4. Add to Supabase secrets: `supabase secrets set UNSPLASH_ACCESS_KEY=your-key`

**Note**: The app works perfectly fine without these keys using the curated image database!

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Create three client IDs:
   - **Web application** (for Supabase)
   - **iOS** (bundle ID: `com.unmenu.app`)
   - **Android** (package name: `com.unmenu.app`)
6. In Supabase Dashboard > Authentication > Providers:
   - Enable Google provider
   - Add your Web Client ID and Secret
7. Note all three client IDs for your `.env` file

### 5. Apple Sign In Setup (iOS Only)

1. Go to [Apple Developer](https://developer.apple.com)
2. Certificates, Identifiers & Profiles > Identifiers
3. Create a new App ID with Sign In with Apple capability
4. Create a Service ID for web authentication
5. In Supabase Dashboard > Authentication > Providers:
   - Enable Apple provider
   - Add your Service ID and key details
6. Note your Service ID for `.env` file

### 6. Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in all the values:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Google OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id

# Apple OAuth
EXPO_PUBLIC_APPLE_SERVICE_ID=your-apple-service-id

# App Config
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_FREE_TIER_SCANS=5
EXPO_PUBLIC_PRO_TIER_SCANS=100
```

### 7. Update app.json

Update the `extra.eas.projectId` in `app.json` with your EAS project ID:

```bash
# Create EAS project
eas init
```

## Running the App

### Development

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web (limited functionality)
npm run web
```

### Testing

1. **Test Authentication**: Try logging in with Google/Apple
2. **Test Scanning**: Take a photo of a menu (use a sample menu image)
3. **Check Database**: Verify data is being saved in Supabase
4. **Test Rate Limiting**: Make multiple rapid requests
5. **Test Caching**: Scan the same menu twice

## Deployment

### Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure builds
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

### Environment Variables for Production

Set production environment variables in EAS:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value your-value
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-value
# ... repeat for all env vars
```

## Cost Estimates

### API Costs (per scan)

- **GPT-4o Vision**: ~$0.01-0.02 per menu scan
- **Food Images**: $0 (free from Pexels/Unsplash/curated database)
- **Average cost per scan**: ~$0.02 (94% cheaper than DALL-E approach!)

### Supabase Costs

- **Free tier**: Up to 500MB database, 1GB storage, 2GB bandwidth
- **Pro tier**: $25/month for more resources
- **Edge Functions**: Included in Pro tier

### Recommended Pricing

- **Free Tier**: 10 scans/month (cost: $0.20/month per user)
- **Pro Tier**: $4.99/month for 100 scans (cost: $2/month per user, 60% margin)

## Architecture

### Database Schema

- `profiles`: User profiles and subscription info
- `locations`: Restaurant locations with PostGIS support
- `menu_scans`: Scan records with original images
- `menu_items`: Individual menu items with AI-generated data
- `rate_limits`: Rate limiting tracking
- `scan_cache`: Cached scan results (30-day TTL)

### Caching Strategy

1. **Image Hash**: MD5 hash of uploaded image
2. **Location Match**: Cache key includes location_id
3. **30-Day TTL**: Cached results expire after 30 days
4. **Hit Counter**: Track cache effectiveness

### Rate Limiting

- **Free Tier**: 5 requests/hour
- **Pro Tier**: 20 requests/hour
- **Sliding Window**: 60-minute windows
- **Database-Backed**: Persistent across restarts

## Security Considerations

1. **Row Level Security (RLS)**: Enabled on all tables
2. **API Keys**: Never exposed to client (Edge Functions only)
3. **Rate Limiting**: Prevents abuse
4. **OAuth Only**: No password authentication
5. **Secure Storage**: Expo SecureStore for tokens

## Troubleshooting

### Common Issues

**"Scan limit reached"**
- Check `scans_used_this_month` in profiles table
- Verify monthly reset cron job is running

**"Rate limit exceeded"**
- Wait 60 minutes or upgrade to Pro
- Check `rate_limits` table for debugging

**Images not generating**
- Verify OpenAI API key has credits
- Check Edge Function logs in Supabase

**Location not working**
- Ensure location permissions are granted
- Check device location services are enabled

**Authentication failing**
- Verify OAuth credentials in Supabase
- Check redirect URLs are configured correctly

### Logs and Debugging

```bash
# View Edge Function logs
supabase functions logs scan-menu

# View database logs
# Go to Supabase Dashboard > Logs

# Debug Expo app
# Use React Native Debugger or Expo Dev Tools
```

## Future Enhancements

- [ ] Multi-language support (currently English only)
- [ ] Dietary preference filtering (vegan, vegetarian, etc.)
- [ ] Nutrition information
- [ ] Price comparison across restaurants
- [ ] Social features (share scans, reviews)
- [ ] Offline mode with local caching
- [ ] AR menu overlay
- [ ] Voice-based menu navigation

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [your-repo/issues]
- Email: support@unmenu.app
