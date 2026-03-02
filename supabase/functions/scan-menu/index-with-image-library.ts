import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from 'https://deno.land/std@0.168.0/hash/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MenuItem {
  name: string;
  original_name?: string;
  description?: string;
  taste_profile?: string;
  similar_dishes?: string[];
  allergens?: string[];
  price?: string;
  category?: string;
}

// Get food image from Pexels (free, no attribution required)
async function getPexelsFoodImage(dishName: string): Promise<string | null> {
  const apiKey = Deno.env.get('PEXELS_API_KEY');
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(dishName + ' food')}&per_page=1&orientation=landscape`,
      {
        headers: { Authorization: apiKey },
      }
    );

    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.large;
    }
  } catch (error) {
    console.error('Pexels API error:', error);
  }
  return null;
}

// Get food image from Unsplash (free, requires attribution)
async function getUnsplashFoodImage(dishName: string): Promise<string | null> {
  const accessKey = Deno.env.get('UNSPLASH_ACCESS_KEY');
  if (!accessKey) return null;

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(dishName + ' food')}&per_page=1&orientation=landscape`,
      {
        headers: { Authorization: `Client-ID ${accessKey}` },
      }
    );

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
  } catch (error) {
    console.error('Unsplash API error:', error);
  }
  return null;
}

// Curated food images (instant, free, no API calls)
const CURATED_IMAGES: Record<string, string[]> = {
  'sushi': ['https://images.unsplash.com/photo-1579584425555-c3ce17fd4351'],
  'ramen': ['https://images.unsplash.com/photo-1569718212165-3a8278d5f624'],
  'pizza': ['https://images.unsplash.com/photo-1513104890138-7c749659a591'],
  'pasta': ['https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9'],
  'burger': ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd'],
  'steak': ['https://images.unsplash.com/photo-1600891964092-4316c288032e'],
  'salad': ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd'],
  'soup': ['https://images.unsplash.com/photo-1547592166-23ac45744acd'],
  'chicken': ['https://images.unsplash.com/photo-1598103442097-8b74394b95c6'],
  'fish': ['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2'],
  'rice': ['https://images.unsplash.com/photo-1516684732162-798a0062be99'],
  'noodles': ['https://images.unsplash.com/photo-1612929633738-8fe44f7ec841'],
  'curry': ['https://images.unsplash.com/photo-1565557623262-b51c2513a641'],
  'taco': ['https://images.unsplash.com/photo-1565299585323-38d6b0865b47'],
  'sandwich': ['https://images.unsplash.com/photo-1528735602780-2552fd46c7af'],
  'dessert': ['https://images.unsplash.com/photo-1551024506-0bccd828d307'],
  'cake': ['https://images.unsplash.com/photo-1578985545062-69928b1d9587'],
  'ice cream': ['https://images.unsplash.com/photo-1563805042-7684c019e1cb'],
};

function getCuratedImage(dishName: string): string | null {
  const normalized = dishName.toLowerCase().trim();
  
  // Exact match
  if (CURATED_IMAGES[normalized]) {
    const images = CURATED_IMAGES[normalized];
    return images[Math.floor(Math.random() * images.length)];
  }
  
  // Partial match
  for (const [key, images] of Object.entries(CURATED_IMAGES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return images[Math.floor(Math.random() * images.length)];
    }
  }
  
  return null;
}

// Smart image fetching with fallbacks
async function getFoodImage(dishName: string): Promise<string> {
  // 1. Try curated database first (instant, free)
  const curatedImage = getCuratedImage(dishName);
  if (curatedImage) return curatedImage;
  
  // 2. Try Pexels API (free, no attribution)
  const pexelsImage = await getPexelsFoodImage(dishName);
  if (pexelsImage) return pexelsImage;
  
  // 3. Try Unsplash API (free, requires attribution)
  const unsplashImage = await getUnsplashFoodImage(dishName);
  if (unsplashImage) return unsplashImage;
  
  // 4. Fallback to placeholder
  return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800`; // Generic food image
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { image_base64, location_id, language = 'en' } = await req.json();

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('subscription_tier, scans_used_this_month')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    const scanLimit = profile.subscription_tier === 'pro' 
      ? parseInt(Deno.env.get('PRO_TIER_SCANS') || '100')
      : parseInt(Deno.env.get('FREE_TIER_SCANS') || '5');

    if (profile.scans_used_this_month >= scanLimit) {
      return new Response(
        JSON.stringify({ error: 'Scan limit reached for this month' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rateLimitOk = await supabaseClient.rpc('check_rate_limit', {
      user_uuid: user.id,
      endpoint_name: 'scan-menu',
      max_requests: profile.subscription_tier === 'pro' ? 20 : 5,
      window_minutes: 60,
    });

    if (!rateLimitOk.data) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageHash = createHash('md5').update(image_base64).toString();

    const { data: cachedScan } = await supabaseClient
      .from('scan_cache')
      .select('*')
      .eq('image_hash', imageHash)
      .eq('location_id', location_id || null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedScan) {
      await supabaseClient
        .from('scan_cache')
        .update({ hit_count: cachedScan.hit_count + 1 })
        .eq('id', cachedScan.id);

      return new Response(
        JSON.stringify({ 
          ...cachedScan.cached_result,
          cached: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this menu image and extract all menu items. For each item, provide:
1. Name (translated to ${language})
2. Original name (if different language)
3. Description of the dish
4. Taste profile (e.g., "sweet and savory with umami notes")
5. Similar dishes (e.g., "This dish is similar to Pad Thai or Singapore Noodles")
6. Common allergens in typical ingredients (e.g., ["gluten", "shellfish", "peanuts"])
7. Price (if visible)
8. Category (appetizer, main, dessert, etc.)

Return ONLY a valid JSON object with this structure:
{
  "items": [
    {
      "name": "string",
      "original_name": "string",
      "description": "string",
      "taste_profile": "string",
      "similar_dishes": ["string"],
      "allergens": ["string"],
      "price": "string",
      "category": "string"
    }
  ]
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image_base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 4096,
      }),
    });

    const visionData = await visionResponse.json();
    const menuData = JSON.parse(visionData.choices[0].message.content);

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('menu-images')
      .upload(`${user.id}/${Date.now()}.jpg`, 
        Uint8Array.from(atob(image_base64), c => c.charCodeAt(0)),
        { contentType: 'image/jpeg' }
      );

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseClient.storage
      .from('menu-images')
      .getPublicUrl(uploadData.path);

    const { data: scanData, error: scanError } = await supabaseClient
      .from('menu_scans')
      .insert({
        user_id: user.id,
        location_id: location_id || null,
        original_image_url: publicUrl,
        processed_data: menuData,
        language,
      })
      .select()
      .single();

    if (scanError) throw scanError;

    // CHANGED: Use image library instead of DALL-E
    const itemsWithImages = await Promise.all(
      menuData.items.map(async (item: MenuItem) => {
        try {
          // Get image from library (instant, free)
          const imageUrl = await getFoodImage(item.name);

          const { error: itemError } = await supabaseClient
            .from('menu_items')
            .insert({
              scan_id: scanData.id,
              name: item.name,
              original_name: item.original_name,
              description: item.description,
              taste_profile: item.taste_profile,
              similar_dishes: item.similar_dishes,
              allergens: item.allergens,
              price: item.price,
              generated_image_url: imageUrl,
              category: item.category,
            });

          if (itemError) console.error('Error inserting menu item:', itemError);

          return {
            ...item,
            generated_image_url: imageUrl,
          };
        } catch (error) {
          console.error('Error fetching image for item:', error);
          return item;
        }
      })
    );

    await supabaseClient.rpc('increment_scan_count', { user_uuid: user.id });

    const result = {
      scan_id: scanData.id,
      items: itemsWithImages,
      original_image_url: publicUrl,
    };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await supabaseClient
      .from('scan_cache')
      .insert({
        image_hash: imageHash,
        location_id: location_id || null,
        cached_result: result,
        expires_at: expiresAt.toISOString(),
      });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
