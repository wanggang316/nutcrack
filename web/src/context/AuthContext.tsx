import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { adminApi, setAuthToken, clearAuthToken } from "../utils/api";
import type { AuthUser } from "@nutcrack/shared";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setupPassword: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      adminApi
        .getMe()
        .then(setUser)
        .catch(() => {
          clearAuthToken();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await adminApi.login({ email, password });
    setAuthToken(data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    setUser(data.user);
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  const setupPassword = async (email: string, password: string) => {
    await adminApi.setupPassword({ email, password });
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, setupPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
