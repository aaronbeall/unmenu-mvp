import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Create profile if user exists but profile doesn't
      if (session?.user) {
        await ensureProfile(session.user);
      }
      
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Create profile if user exists but profile doesn't
      if (session?.user) {
        await ensureProfile(session.user);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function ensureProfile(user: User) {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      // If no profile exists, create one
      if (!existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url || '',
          });

        if (error && error.code !== '23505') { // Ignore duplicate key errors
          console.error('Error creating profile:', error);
        }
      }
    } catch (error) {
      console.error('Error ensuring profile:', error);
    }
  }

  return { session, user, loading };
}
