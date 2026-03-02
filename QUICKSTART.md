# UnMenu - Quick Start Guide

Get up and running in 10 minutes!

## Prerequisites

- Node.js 18+ installed
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator
- Supabase account (free tier is fine)
- OpenAI API account with credits

## Step-by-Step Setup

### 1. Install Dependencies (2 min)

```bash
cd unmenu
npm install
```

### 2. Set Up Supabase (3 min)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project to be ready (~2 minutes)
3. Go to **Settings > API** and copy:
   - Project URL
   - Anon/Public key

### 3. Configure Environment (1 min)

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
OPENAI_API_KEY=sk-...
```

### 4. Set Up Database (2 min)

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click **Run**

### 5. Create Storage Bucket (1 min)

1. In Supabase Dashboard, go to **Storage**
2. Click **New bucket**
3. Name: `menu-images`
4. **Public bucket**: Toggle ON
5. Click **Create bucket**

### 6. Deploy Edge Function! (2 min)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project (get ref from Supabase dashboard URL)
supabase link --project-ref your-project-ref

# Deploy function
supabase functions deploy scan-menu

# Set secrets
supabase secrets set OPENAI_API_KEY=sk-your-key
supabase secrets set FREE_TIER_SCANS=10
supabase secrets set PRO_TIER_SCANS=100

# Optional: Add free image library API keys for better coverage
# Get free key from pexels.com/api (recommended)
supabase secrets set PEXELS_API_KEY=your-pexels-key
```

### 7. Start the App! (1 min)

```bash
npm start
```

Press `i` for iOS or `a` for Android.

## Testing Without OAuth (Optional)

If you want to test quickly without setting up Google/Apple OAuth:

1. Open `app/(auth)/login.tsx`
2. Temporarily add a test button:

```typescript
// Add this to the login screen for quick testing
<TouchableOpacity
  style={[styles.button, styles.googleButton]}
  onPress={async () => {
    // Sign in with email for testing
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123',
    });
  }}
>
  <Text style={styles.buttonText}>Test Login</Text>
</TouchableOpacity>
```

3. Create test user in Supabase Dashboard > Authentication > Users

## First Scan

1. Find a menu image online (search "restaurant menu")
2. Save to your device/simulator
3. In the app, tap **Choose from Library**
4. Select the menu image
5. Wait 30-60 seconds for AI processing
6. View your results with generated images!

## What's Next?

- **Set up OAuth**: See `SETUP_GUIDE.md` for Google/Apple setup
- **Customize**: Modify colors, add features
- **Deploy**: Use EAS to build for production
- **Monitor**: Check Supabase dashboard for usage

## Troubleshooting

**App won't start?**
```bash
# Clear cache and restart
expo start -c
```

**"Supabase URL is not defined"?**
- Make sure `.env` file exists
- Restart Expo server after editing `.env`

**Edge function not working?**
```bash
# Check function logs
supabase functions logs scan-menu --tail
```

**Images not showing?**
- App uses curated images by default (works offline!)
- For better coverage, add free Pexels API key
- Check Edge Function logs: `supabase functions logs scan-menu`

## Cost Estimates

Per scan (with free image libraries):
- GPT-4o Vision: ~$0.02
- Food Images: $0 (free from Pexels/Unsplash/curated DB)
- **Total**: ~$0.02 per menu scan

Free tier allows 10 scans/month = ~$0.20/month per user
Pro tier (100 scans) = ~$2/month cost vs $4.99 revenue = 60% margin!

## Support

- 📖 Full docs: `README.md`
- 🔧 Detailed setup: `SETUP_GUIDE.md`
- 🐛 Issues: Create GitHub issue
