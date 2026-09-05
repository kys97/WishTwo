export interface ProfileViewData {
  id: string;
  name: string;
  imageUrl: string;
  imageDescription: string;
  birthDate: string;
  gender: string;
}

export interface CoupleProfileViewData {
  me: ProfileViewData;
  partner: ProfileViewData;
  isConnected: boolean;
  connectedAt: string;
}
