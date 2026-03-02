import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { Database } from '../database.types';

type MenuScan = Database['public']['Tables']['menu_scans']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

export function useScans(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: scans, isLoading } = useQuery({
    queryKey: ['scans', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('menu_scans')
        .select(`
          *,
          location:locations(*),
          items:menu_items(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  return {
    scans,
    isLoading,
  };
}

export function useScanById(scanId: string | undefined) {
  const { data: scan, isLoading } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: async () => {
      if (!scanId) return null;

      const { data, error } = await supabase
        .from('menu_scans')
        .select(`
          *,
          location:locations(*),
          items:menu_items(*)
        `)
        .eq('id', scanId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!scanId,
  });

  return {
    scan,
    isLoading,
  };
}

export function useNearbyScans(latitude: number | undefined, longitude: number | undefined) {
  const { data: nearbyScans, isLoading } = useQuery({
    queryKey: ['nearby-scans', latitude, longitude],
    queryFn: async () => {
      if (!latitude || !longitude) return [];

      const { data, error } = await supabase.rpc('get_nearby_scans', {
        user_lat: latitude,
        user_lng: longitude,
        radius_km: 5,
      });

      if (error) throw error;
      return data;
    },
    enabled: !!latitude && !!longitude,
  });

  return {
    nearbyScans,
    isLoading,
  };
}
