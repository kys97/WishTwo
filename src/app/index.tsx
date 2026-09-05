import { Redirect, type Href } from 'expo-router';

import { useAuth } from '../features/auth';

export default function IndexRoute() {
  const { isAuthenticated, isHydrated, user } = useAuth();
  if (!isHydrated) return null;
  if (!isAuthenticated) return <Redirect href="/login" />;
  if (!user?.profileCompleted) return <Redirect href={'/social-profile' as Href} />;
  if (!user?.isCoupleConnected) return <Redirect href="/couple-connect" />;
  return <Redirect href="/home" />;
}
