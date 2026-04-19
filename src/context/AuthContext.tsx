import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ensureSchema} from '../db/database';
import {upsertUserForSession} from '../db/userIdentity';

const SESSION_KEY = '@slipgo_auth_session';

export interface AuthSession {
  phone: string;
  /** SQLite user row id (newer sessions) */
  userId?: string;
}

interface AuthContextType {
  isReady: boolean;
  isAuthenticated: boolean;
  session: AuthSession | null;
  login: (phone: string, password: string) => Promise<{ok: true} | {ok: false; message: string}>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function maskPhone(digits: string): string {
  if (digits.length <= 4) {
    return digits;
  }
  return `•••• ${digits.slice(-4)}`;
}

export function AuthProvider({children}: {children: ReactNode}) {
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw) as AuthSession;
          if (parsed?.phone) {
            setSession({
              phone: parsed.phone,
              userId: typeof parsed.userId === 'string' ? parsed.userId : undefined,
            });
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const digits = normalizePhone(phone);
    if (digits.length < 8) {
      return {ok: false as const, message: 'Enter a valid phone number (at least 8 digits).'};
    }
    if (password.length < 6) {
      return {ok: false as const, message: 'Password must be at least 6 characters.'};
    }
    ensureSchema();
    const displayPhone = maskPhone(digits);
    const userId = await upsertUserForSession(digits, displayPhone);
    const next: AuthSession = {phone: displayPhone, userId};
    await AsyncStorage.setItem(
      SESSION_KEY,
      JSON.stringify({phone: next.phone, userId: next.userId}),
    );
    setSession(next);
    return {ok: true as const};
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      isReady,
      isAuthenticated: !!session,
      session,
      login,
      logout,
    }),
    [isReady, session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
