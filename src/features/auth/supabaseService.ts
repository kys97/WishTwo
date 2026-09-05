import { getSupabaseClient } from '../../lib/supabase';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { AuthUser, Gender, PartnerProfile, SignUpInput, SocialAuthProvider, UpdateProfileInput } from './types';

interface ProfileRow {
  id: string;
  name: string;
  birth_date: string;
  gender: Gender;
  profile_image_url: string;
  profile_image_path: string | null;
  connection_code: string;
  profile_completed: boolean;
}

WebBrowser.maybeCompleteAuthSession();

const NATIVE_OAUTH_REDIRECT_URL = 'wishu://auth/callback';

interface PartnerRow {
  id: string;
  name: string;
  birth_date: string;
  gender: Gender;
  profile_image_url: string;
  profile_image_path: string | null;
  connected_at: string;
}

async function loadCurrentUser(): Promise<AuthUser | null> {
  const supabase = getSupabaseClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const sessionUser = sessionData.session?.user;
  if (!sessionUser) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,name,birth_date,gender,profile_image_url,profile_image_path,connection_code,profile_completed')
    .eq('id', sessionUser.id)
    .single<ProfileRow>();
  if (profileError) throw profileError;

  const { data: partnerRows, error: partnerError } = await supabase.rpc('get_my_partner');
  if (partnerError) throw partnerError;
  const partnerRow = (partnerRows?.[0] as PartnerRow | undefined) ?? null;
  const [profileImageUrl, partnerImageUrl] = await Promise.all([
    resolveProfileImage(profile.profile_image_path, profile.profile_image_url),
    resolveProfileImage(partnerRow?.profile_image_path ?? null, partnerRow?.profile_image_url ?? ''),
  ]);
  const partner: PartnerProfile | null = partnerRow
    ? {
        id: partnerRow.id,
        name: partnerRow.name,
        birthDate: partnerRow.birth_date,
        gender: partnerRow.gender,
        profileImageUrl: partnerImageUrl,
        profileImagePath: partnerRow.profile_image_path,
      }
    : null;

  return {
    id: profile.id,
    name: profile.name,
    birthDate: profile.birth_date,
    gender: profile.gender,
    email: sessionUser.email ?? null,
    profileImageUrl,
    profileImagePath: profile.profile_image_path,
    connectionCode: profile.connection_code,
    isCoupleConnected: Boolean(partnerRow),
    connectedAt: partnerRow?.connected_at ?? null,
    partner,
    profileCompleted: profile.profile_completed,
  };
}

export const supabaseAuthService = {
  loadCurrentUser,
  async signIn(email: string, password: string) {
    const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    const user = await loadCurrentUser();
    if (!user) throw new Error('로그인 세션을 불러오지 못했습니다.');
    return user;
  },
  async signUp(input: SignUpInput) {
    validateEmail(input.email);
    validatePassword(input.password);
    const { error } = await getSupabaseClient().auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          name: input.name,
          birth_date: input.birthDate,
          gender: input.gender,
        },
      },
    });
    if (error) throw error;
  },
  async verifySignUpCode(email: string, token: string) {
    const { error } = await getSupabaseClient().auth.verifyOtp({ email, token, type: 'signup' });
    if (error) throw error;
    const user = await loadCurrentUser();
    if (!user) throw new Error('인증된 프로필을 불러오지 못했습니다.');
    return user;
  },
  async resendSignUpCode(email: string) {
    const { error } = await getSupabaseClient().auth.resend({ type: 'signup', email });
    if (error) throw error;
  },
  async signInWithSocial(provider: SocialAuthProvider) {
    const redirectTo = getOAuthRedirectUrl();
    const { data, error } = await getSupabaseClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') throw new Error('소셜 로그인이 취소되었습니다.');
    return completeOAuthCallback(result.url);
  },
  async completeOAuthCallback(url: string) {
    return completeOAuthCallback(url);
  },
  async connect(partnerCode: string) {
    const { error } = await getSupabaseClient().rpc('connect_with_code', {
      input_partner_code: partnerCode,
    });
    if (error) throw error;
    const user = await loadCurrentUser();
    if (!user) throw new Error('연결 정보를 불러오지 못했습니다.');
    return user;
  },
  async updateProfile(user: AuthUser, input: UpdateProfileInput) {
    let nextPath = user.profileImagePath;
    if (input.image) nextPath = await uploadProfileImage(user.id, input.image);
    const { error } = await getSupabaseClient().from('profiles').update({
      name: input.name.trim(),
      birth_date: input.birthDate,
      gender: input.gender,
      profile_image_path: nextPath,
    }).eq('id', user.id);
    if (error) {
      if (nextPath && nextPath !== user.profileImagePath) {
        await getSupabaseClient().storage.from('profile-images').remove([nextPath]);
      }
      throw error;
    }
    if (user.profileImagePath && nextPath !== user.profileImagePath) {
      await getSupabaseClient().storage.from('profile-images').remove([user.profileImagePath]);
    }
    const refreshed = await loadCurrentUser();
    if (!refreshed) throw new Error('수정한 프로필을 불러오지 못했습니다.');
    return refreshed;
  },
  async completeSocialProfile(user: AuthUser, input: Pick<UpdateProfileInput, 'name' | 'birthDate' | 'gender'>) {
    const { error } = await getSupabaseClient().from('profiles').update({
      name: input.name.trim(),
      birth_date: input.birthDate,
      gender: input.gender,
      profile_completed: true,
    }).eq('id', user.id);
    if (error) throw error;
    const refreshed = await loadCurrentUser();
    if (!refreshed) throw new Error('프로필을 불러오지 못했습니다.');
    return refreshed;
  },
  async disconnectCouple() {
    const { error } = await getSupabaseClient().rpc('disconnect_my_couple');
    if (error) throw error;
    const refreshed = await loadCurrentUser();
    if (!refreshed) throw new Error('연결 상태를 불러오지 못했습니다.');
    return refreshed;
  },
  async deleteAccount() {
    const supabase = getSupabaseClient();
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) throw error;
    await supabase.auth.signOut({ scope: 'local' });
  },
  async logout() {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw error;
  },
};

export function validateEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('올바른 이메일 형식을 입력해주세요.');
}

export function validatePassword(password: string) {
  if (password.length < 6 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error('비밀번호는 영문자와 숫자를 포함해 6자리 이상이어야 합니다.');
  }
}

function getOAuthParams(url: string) {
  const parsed = new URL(url);
  const params = new URLSearchParams(parsed.search);
  const hashParams = new URLSearchParams(parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash);
  hashParams.forEach((value, key) => params.set(key, value));
  return params;
}

async function completeOAuthCallback(url: string) {
  const supabase = getSupabaseClient();
  const params = getOAuthParams(url);
  const oauthError = params.get('error_description') ?? params.get('error');
  if (oauthError) throw new Error(oauthError);

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const code = params.get('code');

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) throw new Error('소셜 로그인 세션을 확인하지 못했습니다.');
  }

  const user = await loadCurrentUser();
  if (!user) throw new Error('소셜 로그인 프로필을 불러오지 못했습니다.');
  return user;
}

function getOAuthRedirectUrl() {
  if (Platform.OS !== 'web') return NATIVE_OAUTH_REDIRECT_URL;
  return Linking.createURL('auth/callback');
}

async function resolveProfileImage(path: string | null, fallbackUrl: string) {
  if (!path) return fallbackUrl;
  const { data, error } = await getSupabaseClient().storage.from('profile-images').createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

async function uploadProfileImage(userId: string, image: NonNullable<UpdateProfileInput['image']>) {
  const extension = getImageExtension(image.fileName, image.mimeType);
  const path = `${userId}/profile-${Date.now()}.${extension}`;
  const response = await fetch(image.uri);
  if (!response.ok) throw new Error('선택한 프로필 사진을 읽지 못했습니다.');
  const bytes = await response.arrayBuffer();
  const { error } = await getSupabaseClient().storage.from('profile-images').upload(path, bytes, {
    contentType: image.mimeType ?? `image/${extension}`,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

function getImageExtension(fileName?: string | null, mimeType?: string | null) {
  const fromName = fileName?.split('.').pop()?.toLowerCase();
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(fromName)) return fromName;
  const fromMime = mimeType?.split('/').pop()?.toLowerCase();
  return fromMime === 'jpeg' ? 'jpg' : fromMime || 'jpg';
}
