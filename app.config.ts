import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON;

  return {
    ...config,
    name: config.name ?? 'Wish-U',
    slug: config.slug ?? 'couple-wish-app',
    android: {
      ...config.android,
      package: 'com.wishu.couplewish',
      versionCode: 1,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
  };
};
