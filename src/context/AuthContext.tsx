import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAIL } from '../constants';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  syncAccount: (user: User, additionalData?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  logout: async () => {},
  loginWithGoogle: async () => {},
  syncAccount: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync user data to Supabase profiles table
  const syncAccount = async (user: User, additionalData: any = {}) => {
    try {
      const basicData = {
        id: user.id,
        name: user.user_metadata?.full_name || additionalData.name || 'Anonymous',
        email: user.email || additionalData.email || '',
        // phone: user.phone || additionalData.phone || '', // phone handling differs in supabase
      };

      // In Supabase, we can use upsert
      const { error } = await supabase
        .from('profiles')
        .upsert({
          ...basicData,
          // total_orders: 0, // usually better to calculate these via joins or separate fields
          // total_spent: 0,
        }, { onConflict: 'id' });

      if (error) throw error;
      console.log("User profiles synced to Supabase:", user.id);
    } catch (error) {
      console.error("Error syncing user to Supabase:", error);
    }
  };

  const checkAdminStatus = async (user: User) => {
    // 1. Hardcoded check
    if (user.email === ADMIN_EMAIL) {
      setIsAdmin(true);
      return;
    }

    // 2. Database check (profiles table should have a role column if we want RBAC)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (data && data.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        syncAccount(session.user);
        checkAdminStatus(session.user);
      }
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await syncAccount(currentUser);
        await checkAdminStatus(currentUser);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, logout, loginWithGoogle, syncAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
