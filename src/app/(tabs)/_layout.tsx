import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { bottomTab } from '../../theme';
import { useAuth } from '../../features/auth';

type TabIconProps = {
  color: ColorValue;
  focused: boolean;
  size: number;
};

function TabIcon({
  color,
  focused,
  size,
  activeName,
  inactiveName,
}: TabIconProps & {
  activeName: keyof typeof Ionicons.glyphMap;
  inactiveName: keyof typeof Ionicons.glyphMap;
}) {
  return <Ionicons color={color} name={focused ? activeName : inactiveName} size={size} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isHydrated, user } = useAuth();

  if (!isHydrated) return null;
  if (!isAuthenticated) return <Redirect href="/login" />;
  if (!user?.isCoupleConnected) return <Redirect href="/couple-connect" />;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: bottomTab.activeColor,
        tabBarInactiveTintColor: bottomTab.inactiveColor,
        tabBarLabelStyle: bottomTab.labelStyle,
        tabBarIconStyle: { marginBottom: bottomTab.iconLabelGap },
        tabBarItemStyle: { paddingTop: bottomTab.topPadding },
        tabBarStyle: {
          height: bottomTab.height + insets.bottom,
          paddingBottom: insets.bottom,
          paddingHorizontal: bottomTab.horizontalPadding,
          backgroundColor: bottomTab.backgroundColor,
          borderTopColor: bottomTab.borderColor,
          borderTopWidth: bottomTab.borderWidth,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: '홈',
          tabBarIcon: (props) => (
            <TabIcon {...props} activeName="home" inactiveName="home-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="wishes"
        options={{
          title: '소원권',
          tabBarIcon: (props) => (
            <TabIcon {...props} activeName="ticket" inactiveName="ticket-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: '게임',
          tabBarIcon: (props) => (
            <TabIcon {...props} activeName="game-controller" inactiveName="game-controller-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: '추억',
          tabBarIcon: (props) => (
            <TabIcon {...props} activeName="calendar" inactiveName="calendar-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: '마이',
          tabBarIcon: (props) => (
            <TabIcon {...props} activeName="person" inactiveName="person-outline" />
          ),
        }}
      />
    </Tabs>
  );
}
