import { useCallback, useEffect, useMemo, useState } from "react";
import { loginRequest, logoutRequest, meRequest } from "../api/auth.js";
import { AuthContext } from "./auth-context.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const { data } = await meRequest();
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshAuth().finally(() => setLoading(false));
  }, [refreshAuth]);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    const onPasswordChangeRequired = () => {
      setUser((current) => current && { ...current, passwordChangeRequired: true });
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    window.addEventListener("auth:password-change-required", onPasswordChangeRequired);
    return () => {
      window.removeEventListener("auth:unauthorized", onUnauthorized);
      window.removeEventListener("auth:password-change-required", onPasswordChangeRequired);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await loginRequest(credentials);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }, []);

  const updateCurrentUser = useCallback((nextUser) => setUser(nextUser), []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshAuth, updateCurrentUser }),
    [user, loading, login, logout, refreshAuth, updateCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
