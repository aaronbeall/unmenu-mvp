export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'pro'
          scans_used_this_month: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro'
          scans_used_this_month?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro'
          scans_used_this_month?: number
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          address: string | null
          latitude: number
          longitude: number
          place_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          latitude: number
          longitude: number
          place_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          latitude?: number
          longitude?: number
          place_id?: string | null
          created_at?: string
        }
      }
      menu_scans: {
        Row: {
          id: string
          user_id: string
          location_id: string | null
          original_image_url: string
          processed_data: Json
          language: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          location_id?: string | null
          original_image_url: string
          processed_data: Json
          language?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          location_id?: string | null
          original_image_url?: string
          processed_data?: Json
          language?: string
          created_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          scan_id: string
          name: string
          original_name: string | null
          description: string | null
          taste_profile: string | null
          similar_dishes: string[] | null
          allergens: string[] | null
          price: string | null
          generated_image_url: string | null
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          scan_id: string
          name: string
          original_name?: string | null
          description?: string | null
          taste_profile?: string | null
          similar_dishes?: string[] | null
          allergens?: string[] | null
          price?: string | null
          generated_image_url?: string | null
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          scan_id?: string
          name?: string
          original_name?: string | null
          description?: string | null
          taste_profile?: string | null
          similar_dishes?: string[] | null
          allergens?: string[] | null
          price?: string | null
          generated_image_url?: string | null
          category?: string | null
          created_at?: string
        }
      }
      rate_limits: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          request_count: number
          window_start: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          request_count?: number
          window_start?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          request_count?: number
          window_start?: string
          created_at?: string
        }
      }
      scan_cache: {
        Row: {
          id: string
          image_hash: string
          location_id: string | null
          cached_result: Json
          hit_count: number
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          image_hash: string
          location_id?: string | null
          cached_result: Json
          hit_count?: number
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          image_hash?: string
          location_id?: string | null
          cached_result?: Json
          hit_count?: number
          created_at?: string
          expires_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_scan_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      check_rate_limit: {
        Args: { 
          user_uuid: string
          endpoint_name: string
          max_requests: number
          window_minutes: number
        }
        Returns: boolean
      }
      get_nearby_scans: {
        Args: {
          user_lat: number
          user_lng: number
          radius_km: number
        }
        Returns: {
          id: string
          location_id: string
          location_name: string
          distance_km: number
          created_at: string
        }[]
      }
    }
    Enums: {
      subscription_tier: 'free' | 'pro'
    }
  }
}
