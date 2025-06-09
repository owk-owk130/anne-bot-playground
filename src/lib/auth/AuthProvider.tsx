"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "~/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithOAuth: () => Promise<void>;
  supabase: ReturnType<typeof createClientComponentClient>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  signInWithOAuth: async () => {},
  supabase: {} as ReturnType<typeof createClientComponentClient>
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = async () => {
    try {
      // Supabaseからログアウト
      await supabase.auth.signOut();
      
      // 注意: ログアウト時にセッションIDは削除しない
      // これにより、再ログイン時に会話履歴が保持される
      console.log("Logged out successfully, keeping session data for potential re-login");
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  const signInWithOAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent"
          }
        }
      });

      if (error) {
        console.error("OAuth sign in error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signOut, signInWithOAuth, supabase }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
