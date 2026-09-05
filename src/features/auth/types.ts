export type Gender = '남성' | '여성';

export interface AuthUser {
  id: string;
  name: string;
  birthDate: string;
  gender: Gender;
  email: string | null;
  isCoupleConnected: boolean;
  connectionCode: string;
  profileImageUrl: string;
  profileImagePath: string | null;
  connectedAt: string | null;
  partner: PartnerProfile | null;
  profileCompleted: boolean;
}

export interface PartnerProfile {
  id: string;
  name: string;
  birthDate: string;
  gender: Gender;
  profileImageUrl: string;
  profileImagePath: string | null;
}

export interface ProfileImageInput {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export interface UpdateProfileInput {
  name: string;
  birthDate: string;
  gender: Gender;
  image?: ProfileImageInput;
}

export interface SignUpInput {
  name: string;
  birthDate: string;
  gender: Gender;
  email: string;
  password: string;
}

export type SocialAuthProvider = 'google' | 'kakao';
