import { AppButton } from '../../../components';
import type { SocialAuthProvider } from '../types';

interface SocialContinueButtonsProps {
  disabled?: boolean;
  onContinue: (provider: SocialAuthProvider) => void;
}

export function SocialContinueButtons({ disabled = false, onContinue }: SocialContinueButtonsProps) {
  return (
    <>
      <AppButton
        accessibilityLabel="Google 계정으로 계속하기"
        disabled={disabled}
        onPress={() => onContinue('google')}
        variant="secondary"
      >
        Google로 계속하기
      </AppButton>
      <AppButton
        accessibilityLabel="카카오톡 계정으로 계속하기"
        disabled={disabled}
        onPress={() => onContinue('kakao')}
        variant="secondary"
      >
        카카오톡으로 계속하기
      </AppButton>
    </>
  );
}
