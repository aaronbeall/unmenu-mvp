-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policy for locations (public read)
CREATE POLICY "Anyone can view locations"
  ON public.locations
  FOR SELECT
  TO authenticated
  USING (true);

-- Create menu_scans table
CREATE TABLE IF NOT EXISTS public.menu_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  location_id UUID REFERENCES public.locations(id),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.menu_scans ENABLE ROW LEVEL SECURITY;

-- Create policies for menu_scans
CREATE POLICY "Users can view their own scans"
  ON public.menu_scans
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans"
  ON public.menu_scans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans"
  ON public.menu_scans
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans"
  ON public.menu_scans
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES public.menu_scans(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  image_url TEXT,
  allergens TEXT[],
  dietary_tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies for menu_items
CREATE POLICY "Users can view menu items from their scans"
  ON public.menu_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.menu_scans
      WHERE menu_scans.id = menu_items.scan_id
      AND menu_scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert menu items for their scans"
  ON public.menu_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.menu_scans
      WHERE menu_scans.id = menu_items.scan_id
      AND menu_scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update menu items from their scans"
  ON public.menu_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.menu_scans
      WHERE menu_scans.id = menu_items.scan_id
      AND menu_scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete menu items from their scans"
  ON public.menu_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.menu_scans
      WHERE menu_scans.id = menu_items.scan_id
      AND menu_scans.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
