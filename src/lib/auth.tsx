import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "admin" | "staff";
export interface User {
  email: string;
  name: string;
  role: Role;
}

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
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
      login: (email, password) => {
        if (email === "admin@crm.com" && password === "admin123") {
          const u: User = { email, name: "Aarav Admin", role: "admin" };
          localStorage.setItem(KEY, JSON.stringify(u));
          setUser(u);
          return { ok: true };
        }
        if (email === "staff@crm.com" && password === "staff123") {
          const u: User = { email, name: "Ravi Kapoor", role: "staff" };
          localStorage.setItem(KEY, JSON.stringify(u));
          setUser(u);
          return { ok: true };
        }
        return { ok: false, error: "Invalid email or password" };
      },
      logout: () => {
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