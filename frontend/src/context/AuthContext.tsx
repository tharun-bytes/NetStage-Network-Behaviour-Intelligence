import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthResponse, UserProfile } from "../types";
import { api } from "../api/client";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  registerWithEmail: (fullName: string, email: string, password: string) => Promise<boolean>;
  loginAsDemoAnalyst: () => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ message: string; instructions: string }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== "undefined" ? localStorage.getItem("netsage_token") : null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;
    const initSession = async () => {
      const storedToken = localStorage.getItem("netsage_token");
      if (!storedToken) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const profile = await api.getMe();
        if (mounted) {
          setUser(profile);
          setToken(storedToken);
        }
      } catch (err: any) {
        console.warn("Session restore failed, resetting token:", err?.message);
        localStorage.removeItem("netsage_token");
        if (mounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAuthSuccess = (authRes: AuthResponse) => {
    localStorage.setItem("netsage_token", authRes.access_token);
    setToken(authRes.access_token);
    setUser(authRes.user);
    setError(null);
  };

  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.loginWithGoogle(credential);
      handleAuthSuccess(res);
      return true;
    } catch (err: any) {
      setError(err?.message || "Google authentication failed. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.loginWithEmail({ email, password });
      handleAuthSuccess(res);
      return true;
    } catch (err: any) {
      setError(err?.message || "Invalid email or password.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (fullName: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.registerWithEmail({ full_name: fullName, email, password });
      handleAuthSuccess(res);
      return true;
    } catch (err: any) {
      setError(err?.message || "Registration failed. Email may already be in use.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoAnalyst = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const demoEmail = "analyst.demo@netsage.ai";
    const demoPassword = "DemoAnalyst2026!";
    try {
      // Try login first
      const res = await api.loginWithEmail({ email: demoEmail, password: demoPassword });
      handleAuthSuccess(res);
      return true;
    } catch {
      // If demo account doesn't exist yet, auto-register it
      try {
        const regRes = await api.registerWithEmail({
          full_name: "Security Lead (Demo)",
          email: demoEmail,
          password: demoPassword,
        });
        handleAuthSuccess(regRes);
        return true;
      } catch (err: any) {
        setError("Failed to initialize demo analyst session: " + (err?.message || ""));
        return false;
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("netsage_token");
    setToken(null);
    setUser(null);
    setError(null);
    api.logout().catch(() => {});
  };

  const forgotPassword = async (email: string) => {
    setError(null);
    return await api.forgotPassword(email);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        error,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginAsDemoAnalyst,
        logout,
        forgotPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
