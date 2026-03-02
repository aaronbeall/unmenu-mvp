import { supabase } from '../supabase';

export interface ScanMenuParams {
  imageBase64: string;
  locationId?: string;
  language?: string;
}

export interface MenuItem {
  name: string;
  original_name?: string;
  description?: string;
  taste_profile?: string;
  similar_dishes?: string[];
  allergens?: string[];
  price?: string;
  category?: string;
  generated_image_url?: string;
}

export interface ScanResult {
  scan_id: string;
  items: MenuItem[];
  original_image_url: string;
  cached?: boolean;
}

export async function scanMenu(params: ScanMenuParams): Promise<ScanResult> {
  const { data, error } = await supabase.functions.invoke('scan-menu', {
    body: {
      image_base64: params.imageBase64,
      location_id: params.locationId,
      language: params.language || 'en',
    },
  });

  if (error) throw error;
  return data as ScanResult;
}

export async function createLocation(
  name: string,
  latitude: number,
  longitude: number,
  address?: string,
  placeId?: string
) {
  const { data, error } = await supabase
    .from('locations')
    .upsert({
      name,
      latitude,
      longitude,
      address,
      place_id: placeId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
