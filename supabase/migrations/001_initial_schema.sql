-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'pro');

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier subscription_tier DEFAULT 'free',
  scans_used_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  place_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(latitude, longitude, name)
);

-- Add spatial index for location queries
CREATE INDEX idx_locations_coords ON locations USING GIST (
  ST_MakePoint(longitude, latitude)::geography
);

-- Menu scans table
CREATE TABLE menu_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  original_image_url TEXT NOT NULL,
  processed_data JSONB NOT NULL,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_scans_user_id ON menu_scans(user_id);
CREATE INDEX idx_menu_scans_location_id ON menu_scans(location_id);
CREATE INDEX idx_menu_scans_created_at ON menu_scans(created_at DESC);

-- Menu items table
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID NOT NULL REFERENCES menu_scans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  original_name TEXT,
  description TEXT,
  taste_profile TEXT,
  similar_dishes TEXT[],
  allergens TEXT[],
  price TEXT,
  generated_image_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_items_scan_id ON menu_items(scan_id);

-- Rate limiting table
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint, window_start)
);

CREATE INDEX idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint, window_start);

-- Scan cache table for aggressive caching
CREATE TABLE scan_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_hash TEXT NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  cached_result JSONB NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(image_hash, location_id)
);

CREATE INDEX idx_scan_cache_hash ON scan_cache(image_hash);
CREATE INDEX idx_scan_cache_expires ON scan_cache(expires_at);

-- Function to increment scan count
CREATE OR REPLACE FUNCTION increment_scan_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE profiles
  SET scans_used_this_month = scans_used_this_month + 1,
      updated_at = NOW()
  WHERE id = user_uuid
  RETURNING scans_used_this_month INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_uuid UUID,
  endpoint_name TEXT,
  max_requests INTEGER,
  window_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start_time TIMESTAMPTZ;
BEGIN
  window_start_time := NOW() - (window_minutes || ' minutes')::INTERVAL;
  
  SELECT COALESCE(SUM(request_count), 0)
  INTO current_count
  FROM rate_limits
  WHERE user_id = user_uuid
    AND endpoint = endpoint_name
    AND window_start > window_start_time;
  
  IF current_count >= max_requests THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO rate_limits (user_id, endpoint, request_count, window_start)
  VALUES (user_uuid, endpoint_name, 1, NOW())
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get nearby scans
CREATE OR REPLACE FUNCTION get_nearby_scans(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION
)
RETURNS TABLE (
  id UUID,
  location_id UUID,
  location_name TEXT,
  distance_km DOUBLE PRECISION,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ms.id,
    l.id AS location_id,
    l.name AS location_name,
    ST_Distance(
      ST_MakePoint(user_lng, user_lat)::geography,
      ST_MakePoint(l.longitude, l.latitude)::geography
    ) / 1000 AS distance_km,
    ms.created_at
  FROM menu_scans ms
  JOIN locations l ON ms.location_id = l.id
  WHERE ST_DWithin(
    ST_MakePoint(user_lng, user_lat)::geography,
    ST_MakePoint(l.longitude, l.latitude)::geography,
    radius_km * 1000
  )
  ORDER BY distance_km ASC, ms.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly scan counts (run via cron)
CREATE OR REPLACE FUNCTION reset_monthly_scans()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET scans_used_this_month = 0,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM scan_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_cache ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Locations policies (public read)
CREATE POLICY "Anyone can view locations"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create locations"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Menu scans policies
CREATE POLICY "Users can view their own scans"
  ON menu_scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scans"
  ON menu_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans"
  ON menu_scans FOR DELETE
  USING (auth.uid() = user_id);

-- Menu items policies
CREATE POLICY "Users can view menu items from their scans"
  ON menu_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM menu_scans
      WHERE menu_scans.id = menu_items.scan_id
      AND menu_scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create menu items for their scans"
  ON menu_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM menu_scans
      WHERE menu_scans.id = menu_items.scan_id
      AND menu_scans.user_id = auth.uid()
    )
  );

-- Rate limits policies
CREATE POLICY "Users can view their own rate limits"
  ON rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Scan cache policies (service role only for write)
CREATE POLICY "Authenticated users can read cache"
  ON scan_cache FOR SELECT
  TO authenticated
  USING (true);
