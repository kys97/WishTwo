import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getSupabaseClient } from '../../lib/supabase';
import type { NotificationPermissionState } from '../settings/types';

const DEVICE_ID_KEY = '@wish-u/push-device-id';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerPushTokenAsync() {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('wish-reminders', {
      name: '소원 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6D5BD0',
      sound: 'default',
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  const permission = currentPermission.status === 'granted'
    ? currentPermission
    : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return null;

  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) throw new Error('EXPO_PUBLIC_EAS_PROJECT_ID가 설정되지 않았습니다.');

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const deviceId = await getDeviceId();
  const { error } = await getSupabaseClient().rpc('register_push_token', {
    input_expo_push_token: token,
    input_device_id: deviceId,
    input_platform: Platform.OS,
  });
  if (error) throw error;
  return token;
}

export async function deactivatePushTokenAsync() {
  if (Platform.OS === 'web') return;
  const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) return;
  const { error } = await getSupabaseClient().rpc('deactivate_push_token', {
    input_device_id: deviceId,
  });
  if (error) throw error;
}

export async function getNotificationPermissionStateAsync(): Promise<NotificationPermissionState> {
  if (Platform.OS === 'web' || !Device.isDevice) return 'unavailable';
  const permission = await Notifications.getPermissionsAsync();
  return permission.status;
}

export async function requestNotificationPermissionAsync(): Promise<NotificationPermissionState> {
  if (Platform.OS === 'web' || !Device.isDevice) return 'unavailable';
  const permission = await Notifications.requestPermissionsAsync();
  return permission.status;
}

async function getDeviceId() {
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;
  const value = `device-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, value);
  return value;
}
