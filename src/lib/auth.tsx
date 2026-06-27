import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setAuthToken } from "./api";

export type Role = "admin" | "staff";
export interface User {
  email: string;
  name: string;
  role: Role;
}

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "crm.auth.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      login: async (email, password) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();
          if (!res.ok) {
            return { ok: false, error: data.error || "Login failed" };
          }

          const u: User = data.user;
          setAuthToken(data.token);
          localStorage.setItem(KEY, JSON.stringify(u));
          setUser(u);
          return { ok: true };
        } catch (error: any) {
          console.error("Login request failed", error);
          return { ok: false, error: error.message || "Failed to reach server" };
        }
      },
      logout: () => {
        setAuthToken(null);
        localStorage.removeItem(KEY);
        setUser(null);
      },
    }),
    [user],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}