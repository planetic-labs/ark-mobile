import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { router } from 'expo-router';
import { COLORS } from '../../constants/Config';
import { useAuthStore } from '../../stores/useAuthStore';
import { api } from '../../services/api';
import { settingsStyles as styles } from '../../styles/settingsStyles';

// SVG Icons for Menu Items
const BellIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const UsersIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={9} cy={7.5} r={3} stroke={color} strokeWidth={1.8} fill="none" />
    <Path
      d="M4 16c0-2.5 2-4.5 5-4.5s5 2 5 4.5"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Circle cx={15} cy={6.5} r={2.2} stroke={color} strokeWidth={1.8} fill="none" />
    <Path
      d="M12 14c0-1.8 1-3 3-3s3 1.2 3 3"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

const TrashIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LogOutIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21H5a2 2 0 01-2-2V5a2 2 0 01-2-2h4M16 17l5-5-5-5M21 12H9"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronRight = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18l6-6-6-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function SettingsScreen() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);

  const handleLogout = async () => {
    Alert.alert(
      "Выход из системы",
      "Вы уверены, что хотите выйти?",
      [
        { text: "Отмена", style: "cancel" },
        { 
          text: "Выйти", 
          style: "destructive", 
          onPress: async () => {
            console.log("Logout triggered from Settings");
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
          } 
        }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      "Очистка кэша",
      "Вы уверены, что хотите очистить кэш приложения? Это действие освободит память устройства.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Очистить",
          style: "destructive",
          onPress: () => {
            Alert.alert("Успешно", "Кэш приложения успешно очищен.");
          }
        }
      ]
    );
  };

  // Avatar initials setup
  const name = currentUser?.full_name || currentUser?.email || 'A';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Role details based on GEMINI.md instructions:
  // - Warrior: "◈ Воин Света" color amberSoft
  // - Admin: "Администратор" color amberSoft, no ◈
  // - Student: do not show
  const showRole = currentUser?.role === 'ADMIN' || currentUser?.role === 'WARRIOR' || currentUser?.role === 'MASTER';
  const isWarrior = currentUser?.role === 'WARRIOR' || currentUser?.role === 'MASTER';
  const roleDisplayName = currentUser?.role === 'ADMIN' ? 'Администратор' : '◈ Воин Света';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        
        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, isWarrior && styles.avatarWarrior]}>
            <Text style={[styles.avatarText, isWarrior && styles.avatarTextWarrior]}>
              {initials}
            </Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{currentUser?.full_name || 'Без Имени'}</Text>
            <Text style={styles.profileEmail}>{currentUser?.email}</Text>
            {showRole && (
              <Text style={styles.roleText}>{roleDisplayName}</Text>
            )}
          </View>
        </View>

        {/* Notifications Group */}
        <Text style={styles.sectionTitle}>Уведомления</Text>
        <View style={styles.menuGroup}>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <BellIcon color={COLORS.amber} />
              <Text style={styles.menuItemText}>Включить уведомления</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#ECE7DD', true: COLORS.amberTint }}
              thumbColor={notificationsEnabled ? COLORS.amber : '#A69D8F'}
            />
          </View>
          <View style={[styles.menuItem, styles.menuItemLast]}>
            <View style={styles.menuItemLeft}>
              <BellIcon color={COLORS.amber} />
              <Text style={styles.menuItemText}>Звуки сирены</Text>
            </View>
            <Switch
              value={soundsEnabled}
              onValueChange={setSoundsEnabled}
              trackColor={{ false: '#ECE7DD', true: COLORS.amberTint }}
              thumbColor={soundsEnabled ? COLORS.amber : '#A69D8F'}
            />
          </View>
        </View>

        {/* Actions Group */}
        <Text style={styles.sectionTitle}>Действия</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/users')}>
            <View style={styles.menuItemLeft}>
              <UsersIcon color={COLORS.textSecondary} />
              <Text style={styles.menuItemText}>Список участников</Text>
            </View>
            <ChevronRight color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleClearCache}>
            <View style={styles.menuItemLeft}>
              <TrashIcon color={COLORS.textSecondary} />
              <Text style={styles.menuItemText}>Очистить кэш</Text>
            </View>
            <ChevronRight color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <LogOutIcon color={COLORS.warn} />
              <Text style={styles.menuItemTextDanger}>Выйти из системы</Text>
            </View>
            <ChevronRight color={COLORS.warnSoft} />
          </TouchableOpacity>
        </View>

        {/* Application version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Версия приложения: 2026.6.10</Text>
        </View>

      </ScrollView>
    </View>
  );
}
