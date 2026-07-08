import { Tabs, Redirect } from 'expo-router';
import { TouchableOpacity, Text, Platform, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/Config';
import { useAuthStore } from '../../stores/useAuthStore';
import { api } from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import { useWebSocket } from '../../hooks/useWebSocket';

const ChatsIcon = ({ color }: { color: ColorValue }) => (
  <Svg width={23} height={23} viewBox="0 0 23 23" fill="none">
    <Path
      d="M4 6.5C4 5.1 5.1 4 6.5 4h10C17.9 4 19 5.1 19 6.5v7c0 1.4-1.1 2.5-2.5 2.5H9l-4 3.5v-3.5H6.5C5.1 16 4 14.9 4 13.5v-7z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
  </Svg>
);

const NavigatorIcon = ({ color }: { color: ColorValue }) => (
  <Svg width={23} height={23} viewBox="0 0 23 23" fill="none">
    <Circle cx={6} cy={6} r={2.2} stroke={color} strokeWidth={1.7} />
    <Circle cx={17} cy={11.5} r={2.2} stroke={color} strokeWidth={1.7} />
    <Circle cx={7.5} cy={17.5} r={2.2} stroke={color} strokeWidth={1.7} />
    <Path d="M7.7 7.5l7.6 2.8M15.4 13.4l-6.3 3" stroke={color} strokeWidth={1.5} />
  </Svg>
);

const VideoIcon = ({ color }: { color: ColorValue }) => (
  <Svg width={23} height={23} viewBox="0 0 23 23" fill="none">
    <Rect x={3.5} y={5} width={16} height={13} rx={2.6} stroke={color} strokeWidth={1.7} />
    <Path d="M10 9.3l4 2.2-4 2.2V9.3z" fill={color} />
  </Svg>
);

const MaterialsIcon = ({ color }: { color: ColorValue }) => (
  <Svg width={23} height={23} viewBox="0 0 23 23" fill="none">
    <Path d="M11.5 3.5l7.5 4-7.5 4-7.5-4 7.5-4z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    <Path d="M4.5 11.5l7 3.7 7-3.7M4.5 15l7 3.7 7-3.7" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
  </Svg>
);

const ChroniclesIcon = ({ color }: { color: ColorValue }) => (
  <Svg width={23} height={23} viewBox="0 0 23 23" fill="none">
    <Path d="M6 4h8l4 4v11H6V4z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    <Path d="M8.5 9.5h6M8.5 12.5h6M8.5 15.5h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const SettingsIcon = ({ color }: { color: ColorValue }) => (
  <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.7} />
    <Path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
  </Svg>
);

const AdminIcon = ({ color }: { color: ColorValue }) => (
  <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={11} r={3} stroke={color} strokeWidth={1.7} />
  </Svg>
);

export default function TabsLayout() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const currentUser = useAuthStore((state) => state.currentUser);
  const insets = useSafeAreaInsets();
  const { registerForPushNotifications } = useNotifications();
  const isAdmin = currentUser?.role === 'ADMIN';

  useWebSocket();

  useEffect(() => {
    if (accessToken) {
      registerForPushNotifications();
    }
  }, [accessToken]);

  if (!accessToken) {
    return <Redirect href="/(auth)/login" />;
  }

  const handleLogout = async () => {
    console.log("Logout triggered from UI");
    const pushToken = useAuthStore.getState().pushToken;
    if (pushToken) {
      try {
        await api.users.unregisterPushToken(pushToken);
      } catch (e) {
        console.log("Failed to unregister push token on server", e);
      }
    }
    try {
      await api.auth.logout();
    } catch (e) {
      console.log("Failed to logout on server", e);
    }
    logout();
  };

  const hasBottomInset = insets.bottom > 0;
  const paddingBottom = hasBottomInset ? insets.bottom : (Platform.OS === 'ios' ? 24 : 12);
  const barHeight = (Platform.OS === 'ios' ? 52 : 56) + paddingBottom;

  return (
    <Tabs screenOptions={({ route }) => ({ 
      tabBarActiveTintColor: COLORS.amber,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: {
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        height: barHeight,
        paddingBottom: paddingBottom,
        paddingTop: 8,
        elevation: 0,
        shadowOpacity: 0,
      },
      tabBarLabelStyle: {
        fontFamily: FONTS.bodyMedium,
        fontSize: 11,
      },
      headerStyle: {
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTitleStyle: {
        fontFamily: FONTS.displaySemiBold,
        color: COLORS.textPrimary,
        fontSize: 18,
      },

      tabBarIcon: ({ color }) => {
        if (route.name === 'index') return <ChatsIcon color={color} />;
        if (route.name === 'navigator') return <NavigatorIcon color={color} />;
        if (route.name === 'video') return <VideoIcon color={color} />;
        if (route.name === 'materials') return <MaterialsIcon color={color} />;
        if (route.name === 'chronicles') return <ChroniclesIcon color={color} />;
        if (route.name === 'admin') return <AdminIcon color={color} />;
        if (route.name === 'settings') return <SettingsIcon color={color} />;
        return null;
      }
    })}>
      <Tabs.Screen 
        name="navigator" 
        options={{ 
          title: 'Навигатор',
          headerShown: true,
        }} 
      />
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Чат',
          headerShown: true,
        }} 
      />
      <Tabs.Screen 
        name="materials" 
        options={{ 
          title: 'Материалы',
          headerShown: true,
        }} 
      />
      <Tabs.Screen 
        name="admin" 
        options={{ 
          title: 'Админка',
          headerShown: true,
          href: isAdmin ? undefined : null,
        }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{ 
          title: 'Настройки',
          headerShown: true,
        }} 
      />
      <Tabs.Screen 
        name="video" 
        options={{ 
          title: 'Видео',
          headerShown: true,
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="chronicles" 
        options={{ 
          title: 'Летописи',
          headerShown: true,
          href: null,
        }} 
      />
    </Tabs>
  );
}
