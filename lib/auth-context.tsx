"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const { data } = await authApi.me();
      setUser(data);
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `user_role=${data.role}; path=/; SameSite=Lax${secure}`;
    } catch {
      setUser(null);
      document.cookie = "user_role=; path=/; max-age=0";
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    await authApi.login(email, password);
    // Persist across sessions so middleware can distinguish returning users from new visitors
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `has_account=1; max-age=2592000; path=/; SameSite=Lax${secure}`;
    await refresh();
  }

  async function logout() {
    await authApi.logout();
    setUser(null);
    document.cookie = "user_role=; path=/; max-age=0";
    // Keep has_account — user still has an account, just logged out
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
