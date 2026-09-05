import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import * as Linking from 'expo-linking';
import { AppState, Platform } from 'react-native';

import { getSupabaseClient } from '../../lib/supabase';
import { supabaseAuthService } from './supabaseService';
import type { AuthUser, SignUpInput, SocialAuthProvider, UpdateProfileInput } from './types';
import { deactivatePushTokenAsync } from '../notifications/notificationService';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  oauthCallbackUrl: string | null;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (input: SignUpInput) => Promise<void>;
  verifySignUpCode: (email: string, token: string) => Promise<AuthUser>;
  resendSignUpCode: (email: string) => Promise<void>;
  signInWithSocial: (provider: SocialAuthProvider) => Promise<void>;
  completeOAuthCallback: (url: string) => Promise<AuthUser>;
  completeSocialProfile: (input: Pick<UpdateProfileInput, 'name' | 'birthDate' | 'gender'>) => Promise<AuthUser>;
  connectCouple: (partnerCode: string) => Promise<AuthUser>;
  updateProfile: (input: UpdateProfileInput) => Promise<AuthUser>;
  disconnectCouple: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [isHydrated, setHydrated] = useState(false);
  const [oauthCallbackUrl, setOAuthCallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    void supabaseAuthService
      .loadCurrentUser()
      .then((restoredUser) => {
        setUser(restoredUser);
        setAuthenticated(Boolean(restoredUser));
      })
      .catch(() => {
        setUser(null);
        setAuthenticated(false);
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    const captureOAuthUrl = (url: string | null) => {
      if (url?.startsWith('wishu://auth/callback')) setOAuthCallbackUrl(url);
    };

    void Linking.getInitialURL().then(captureOAuthUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => captureOAuthUrl(url));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
    } catch {
      return;
    }
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => subscription.remove();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated,
    isHydrated,
    oauthCallbackUrl,
    async signIn(email, password) {
      const nextUser = await supabaseAuthService.signIn(email, password);
      setUser(nextUser);
      setAuthenticated(true);
      return nextUser;
    },
    async signUp(input) {
      await supabaseAuthService.signUp(input);
    },
    async verifySignUpCode(email, token) {
      const nextUser = await supabaseAuthService.verifySignUpCode(email, token);
      setUser(nextUser);
      setAuthenticated(true);
      return nextUser;
    },
    async resendSignUpCode(email) {
      await supabaseAuthService.resendSignUpCode(email);
    },
    async signInWithSocial(provider) {
      const callbackUrl = await supabaseAuthService.signInWithSocial(provider);
      setOAuthCallbackUrl(callbackUrl);
    },
    async completeOAuthCallback(url) {
      try {
        const nextUser = await supabaseAuthService.completeOAuthCallback(url);
        setUser(nextUser);
        setAuthenticated(true);
        return nextUser;
      } finally {
        setOAuthCallbackUrl(null);
      }
    },
    async completeSocialProfile(input) {
      if (!user) throw new Error('로그인이 필요합니다.');
      const nextUser = await supabaseAuthService.completeSocialProfile(user, input);
      setUser(nextUser);
      return nextUser;
    },
    async connectCouple(partnerCode) {
      if (!user) throw new Error('로그인이 필요합니다.');
      const nextUser = await supabaseAuthService.connect(partnerCode);
      setUser(nextUser);
      return nextUser;
    },
    async updateProfile(input) {
      if (!user) throw new Error('로그인이 필요합니다.');
      const nextUser = await supabaseAuthService.updateProfile(user, input);
      setUser(nextUser);
      return nextUser;
    },
    async disconnectCouple() {
      const nextUser = await supabaseAuthService.disconnectCouple();
      setUser(nextUser);
    },
    async deleteAccount() {
      await supabaseAuthService.deleteAccount();
      setUser(null);
      setAuthenticated(false);
    },
    async logout() {
      try {
        await deactivatePushTokenAsync();
      } catch {
        // 토큰 정리에 실패해도 사용자 로그아웃은 계속 진행합니다.
      }
      await supabaseAuthService.logout();
      setUser(null);
      setAuthenticated(false);
    },
  }), [isAuthenticated, isHydrated, oauthCallbackUrl, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
