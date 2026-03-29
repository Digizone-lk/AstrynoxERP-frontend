"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi } from "@/lib/api";
import { setAccessToken, clearAccessToken } from "@/lib/token";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getCachedUser(): User | null {
  try {
    const raw = sessionStorage.getItem("auth_user");
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    typeof window !== "undefined" ? getCachedUser() : null
  );
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      // On every app load the access_token is gone from memory.
      // Call /refresh first — the proxy forwards the HttpOnly refresh_token
      // cookie automatically — then fetch the user profile.
      const { data: tokenData } = await authApi.refreshToken();
      setAccessToken(tokenData.access_token);

      const { data } = await authApi.me();
      setUser(data);
      sessionStorage.setItem("auth_user", JSON.stringify(data));
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `user_role=${data.role}; path=/; SameSite=Lax${secure}`;
    } catch {
      // refresh_token cookie is missing or expired — user must log in
      setUser(null);
      sessionStorage.removeItem("auth_user");
      clearAccessToken();
      document.cookie = "user_role=; path=/; max-age=0";
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { data } = await authApi.login(email, password);
    // Save access_token in memory; refresh_token is in the HttpOnly cookie
    // set by the backend — never touches JavaScript
    setAccessToken(data.access_token);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `has_account=1; max-age=2592000; path=/; SameSite=Lax${secure}`;

    const { data: me } = await authApi.me();
    setUser(me);
    sessionStorage.setItem("auth_user", JSON.stringify(me));
    document.cookie = `user_role=${me.role}; path=/; SameSite=Lax${secure}`;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      sessionStorage.removeItem("auth_user");
      clearAccessToken();
      document.cookie = "user_role=; path=/; max-age=0";
    }
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
