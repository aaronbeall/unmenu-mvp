// Food Image Service - Replace DALL-E with free image libraries

export interface FoodImageSource {
  url: string;
  photographer?: string;
  source: 'unsplash' | 'pexels' | 'foodish';
  attribution?: string;
}

// Option 1: Unsplash API (Free, high quality, requires attribution)
export async function getUnsplashFoodImage(dishName: string): Promise<FoodImageSource | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(dishName + ' food')}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const photo = data.results[0];
      return {
        url: photo.urls.regular,
        photographer: photo.user.name,
        source: 'unsplash',
        attribution: `Photo by ${photo.user.name} on Unsplash`,
      };
    }
  } catch (error) {
    console.error('Unsplash API error:', error);
  }
  return null;
}

// Option 2: Pexels API (Free, no attribution required)
export async function getPexelsFoodImage(dishName: string): Promise<FoodImageSource | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(dishName + ' food')}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      const photo = data.photos[0];
      return {
        url: photo.src.large,
        photographer: photo.photographer,
        source: 'pexels',
        attribution: `Photo by ${photo.photographer} on Pexels`,
      };
    }
  } catch (error) {
    console.error('Pexels API error:', error);
  }
  return null;
}

// Option 3: Foodish API (Free, random food images, no API key needed)
export async function getFoodishImage(category?: string): Promise<FoodImageSource | null> {
  try {
    const endpoint = category 
      ? `https://foodish-api.com/api/images/${category}`
      : 'https://foodish-api.com/api/';
    
    const response = await fetch(endpoint);
    const data = await response.json();
    
    if (data.image) {
      return {
        url: data.image,
        source: 'foodish',
      };
    }
  } catch (error) {
    console.error('Foodish API error:', error);
  }
  return null;
}

// Smart fallback strategy
export async function getFoodImage(dishName: string, category?: string): Promise<FoodImageSource | null> {
  // Try Pexels first (best quality, no attribution)
  let image = await getPexelsFoodImage(dishName);
  if (image) return image;

  // Fallback to Unsplash (requires attribution)
  image = await getUnsplashFoodImage(dishName);
  if (image) return image;

  // Final fallback to Foodish (random but always works)
  return await getFoodishImage(category);
}

// Curated food image database (best option - no API calls needed!)
const CURATED_FOOD_IMAGES: Record<string, string[]> = {
  // Asian
  'pad thai': [
    'https://images.unsplash.com/photo-1559314809-0d155014e29e',
    'https://images.unsplash.com/photo-1626804475297-41608ea09aeb',
  ],
  'sushi': [
    'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351',
    'https://images.unsplash.com/photo-1583623025817-d180a2221d0a',
  ],
  'ramen': [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624',
    'https://images.unsplash.com/photo-1557872943-16a5ac26437e',
  ],
  
  // Italian
  'pizza': [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002',
  ],
  'pasta': [
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9',
    'https://images.unsplash.com/photo-1563379926898-05f4575a45d8',
  ],
  
  // American
  'burger': [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
    'https://images.unsplash.com/photo-1550547660-d9450f859349',
  ],
  'steak': [
    'https://images.unsplash.com/photo-1600891964092-4316c288032e',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
  ],
  
  // Add more categories...
};

// Get curated image by dish name (instant, free, high quality)
export function getCuratedFoodImage(dishName: string): string | null {
  const normalizedName = dishName.toLowerCase().trim();
  
  // Exact match
  if (CURATED_FOOD_IMAGES[normalizedName]) {
    const images = CURATED_FOOD_IMAGES[normalizedName];
    return images[Math.floor(Math.random() * images.length)];
  }
  
  // Partial match
  for (const [key, images] of Object.entries(CURATED_FOOD_IMAGES)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return images[Math.floor(Math.random() * images.length)];
    }
  }
  
  return null;
}

// Best approach: Curated + API fallback
export async function getBestFoodImage(dishName: string, category?: string): Promise<string> {
  // Try curated database first (instant, free)
  const curatedImage = getCuratedFoodImage(dishName);
  if (curatedImage) return curatedImage;
  
  // Fallback to API
  const apiImage = await getFoodImage(dishName, category);
  if (apiImage) return apiImage.url;
  
  // Final fallback: placeholder
  return `https://via.placeholder.com/400x300/4285F4/ffffff?text=${encodeURIComponent(dishName)}`;
}
