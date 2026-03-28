import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, AuthResponse } from "../types/auth";
import { authApi } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (name?: string, baseCurrency?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("authToken");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        const response = await authApi.getMe();
        setUser((response as { user: User }).user);
      } catch {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await authApi.login({ email, password });
      const { user, token } = response as AuthResponse;

      setUser(user);
      setToken(token);
      localStorage.setItem("authToken", token);
      localStorage.setItem("authUser", JSON.stringify(user));
    } catch (err: any) {
      const errorMsg = typeof err === "string" ? err : err?.error || "Login failed";
      setError(errorMsg);
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setError(null);
      const response = await authApi.register({ name, email, password });
      const { user, token } = response as AuthResponse;

      setUser(user);
      setToken(token);
      localStorage.setItem("authToken", token);
      localStorage.setItem("authUser", JSON.stringify(user));
    } catch (err: any) {
      const errorMsg = typeof err === "string" ? err : err?.error || "Registration failed";
      setError(errorMsg);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
  };

  const updateProfile = async (name?: string, baseCurrency?: string) => {
    try {
      setError(null);
      const response = await authApi.updateProfile({ name, baseCurrency });
      const updatedUser = (response as { user: User }).user;

      setUser(updatedUser);
      localStorage.setItem("authUser", JSON.stringify(updatedUser));
    } catch (err: any) {
      const errorMsg = typeof err === "string" ? err : err?.error || "Profile update failed";
      setError(errorMsg);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        updateProfile,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
