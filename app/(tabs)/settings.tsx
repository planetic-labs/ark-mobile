import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Platform, LayoutAnimation, UIManager } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { COLORS, FONTS } from '../../constants/Config';
import { useAuthStore } from '../../stores/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { settingsStyles as styles } from '../../styles/settingsStyles';
import { useTimerStore } from '../../stores/useTimerStore';
import { useObserve } from 'expo-observe';
import { useUIStore } from '../../stores/useUIStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

const TimerIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
    <Path d="M12 6v6l4 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MenuIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 6h16M4 12h16M4 18h16"
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
  const queryClient = useQueryClient();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [mode, setMode] = useState<'menu' | 'timer' | 'navigation'>('menu');
  const { markInteractive } = useObserve();

  useEffect(() => {
    markInteractive();
  }, [markInteractive]);

  // Таймер стейт из Zustand
  const duration = useTimerStore((state) => state.duration);
  const sound = useTimerStore((state) => state.sound);
  const isActive = useTimerStore((state) => state.isActive);
  const timeLeft = useTimerStore((state) => state.timeLeft);
  const setDuration = useTimerStore((state) => state.setDuration);
  const setSound = useTimerStore((state) => state.setSound);
  const startTimer = useTimerStore((state) => state.startTimer);
  const stopTimer = useTimerStore((state) => state.stopTimer);
  const resetTimer = useTimerStore((state) => state.resetTimer);

  // Настройки табов из Zustand useUIStore
  const tabSettings = useUIStore((state) => state.tabSettings);
  const setTabSettings = useUIStore((state) => state.setTabSettings);

  const toggleTabVisibility = (tabName: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (tabSettings.includes(tabName)) {
      if (tabName !== 'settings') {
        setTabSettings(tabSettings.filter((t) => t !== tabName));
      }
    } else {
      setTabSettings([...tabSettings, tabName]);
    }
  };

  const moveTab = (index: number, direction: 'up' | 'down') => {
    const newSettings = [...tabSettings];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSettings.length) return;
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const temp = newSettings[index];
    newSettings[index] = newSettings[targetIndex];
    newSettings[targetIndex] = temp;
    
    setTabSettings(newSettings);
  };

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
            queryClient.clear();
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

  const getVersionInfo = (): string[] => {
    const pkgVersion = Constants.expoConfig?.version || '0.0.0';
    const buildVersion = Platform.OS === 'ios'
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode;
      
    const buildStr = buildVersion ? ` (сборка ${buildVersion})` : '';
    
    const infoLines = [
      `Приложение: v${pkgVersion}${buildStr}`
    ];

    if (Updates.channel) {
      const updateIdStr = Updates.updateId ? ` [${Updates.updateId.substring(0, 8)}]` : '';
      const dateStr = Updates.createdAt 
        ? ` от ${new Date(Updates.createdAt).toLocaleDateString('ru-RU')} ${new Date(Updates.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
        : '';
      infoLines.push(`Канал обновлений: ${Updates.channel}${updateIdStr}`);
      if (dateStr) {
        infoLines.push(`Дата обновления: ${dateStr}`);
      }
    } else {
      infoLines.push('Режим разработки (локальный запуск)');
    }

    return infoLines;
  };

  if (mode === 'navigation') {
    const ALL_TABS_METADATA = [
      { name: 'index', title: 'Чат', canBeHidden: true },
      { name: 'navigator', title: 'Навигатор', canBeHidden: true },
      { name: 'video', title: 'Видео', canBeHidden: true },
      { name: 'materials', title: 'Материалы', canBeHidden: true },
      { name: 'chronicles', title: 'Летописи', canBeHidden: true },
      { name: 'admin', title: 'Админка', adminOnly: true },
      { name: 'settings', title: 'Настройки', canBeHidden: false },
    ];

    const isAdmin = currentUser?.role === 'ADMIN';

    const activeTabs = tabSettings
      .map((name) => ALL_TABS_METADATA.find((t) => t.name === name))
      .filter((t): t is typeof ALL_TABS_METADATA[0] => !!t && (!t.adminOnly || isAdmin));

    const inactiveTabs = ALL_TABS_METADATA.filter(
      (t) => !tabSettings.includes(t.name) && (!t.adminOnly || isAdmin)
    );

    const settingsTabsList = [...activeTabs, ...inactiveTabs];

    return (
      <View style={styles.container}>
        {/* subHeader */}
        <View style={styles.subHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setMode('menu')}>
            <Text style={styles.backButtonText}>Назад</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Настройка нижнего меню</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Порядок и видимость вкладок</Text>
          <View style={styles.menuGroup}>
            {settingsTabsList.map((tab, listIndex) => {
              const isVisible = tab.canBeHidden === false || tabSettings.includes(tab.name);
              const actualIndex = tabSettings.indexOf(tab.name);
              
              return (
                <View key={tab.name} style={[styles.menuItem, listIndex === settingsTabsList.length - 1 && styles.menuItemLast, { height: 56 }]}>
                  <View style={styles.menuItemLeft}>
                    {actualIndex !== -1 && (
                      <View style={{ flexDirection: 'row', marginRight: 16, gap: 12 }}>
                        <TouchableOpacity 
                          disabled={actualIndex === 0} 
                          onPress={() => moveTab(actualIndex, 'up')}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                          style={{ opacity: actualIndex === 0 ? 0.25 : 1, padding: 4 }}
                        >
                          <Text style={{ fontSize: 18, color: COLORS.amber, fontWeight: 'bold' }}>↑</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          disabled={actualIndex === activeTabs.length - 1} 
                          onPress={() => moveTab(actualIndex, 'down')}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                          style={{ opacity: actualIndex === activeTabs.length - 1 ? 0.25 : 1, padding: 4 }}
                        >
                          <Text style={{ fontSize: 18, color: COLORS.amber, fontWeight: 'bold' }}>↓</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <Text style={[styles.menuItemText, { marginLeft: actualIndex !== -1 ? 0 : 54 }]}>
                      {tab.title}
                    </Text>
                  </View>
                  {tab.canBeHidden !== false ? (
                    <Switch
                      value={isVisible}
                      onValueChange={() => toggleTabVisibility(tab.name)}
                      trackColor={{ false: '#ECE7DD', true: COLORS.amberTint }}
                      thumbColor={isVisible ? COLORS.amber : '#A69D8F'}
                    />
                  ) : (
                    <Text style={{ fontSize: 11, fontFamily: FONTS.mono, color: COLORS.textMuted }}>Обязательно</Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (mode === 'timer') {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const options = [1, 5, 10, 15, 20, 30];

    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.subHeader}>
            <TouchableOpacity onPress={() => setMode('menu')} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Настройки</Text>
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Таймер практики</Text>
          </View>

          {/* Циферблат */}
          <View style={styles.timerDisplay}>
            <Text style={styles.timerDigits}>{timeStr}</Text>
            <Text style={styles.timerLabel}>
              {isActive ? 'Идет медитация...' : 'Таймер готов к запуску'}
            </Text>
          </View>

          {/* Кнопки управления */}
          <View style={styles.controlsRow}>
            {isActive ? (
              <TouchableOpacity style={[styles.btnControl, styles.btnPause]} onPress={stopTimer}>
                <Text style={styles.btnTextPause}>Пауза</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.btnControl, styles.btnStart]} onPress={startTimer}>
                <Text style={styles.btnTextStart}>Старт</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btnControl, styles.btnReset]} onPress={resetTimer}>
              <Text style={styles.btnTextReset}>Сбросить</Text>
            </TouchableOpacity>
          </View>

          {/* Настройка времени */}
          <Text style={styles.chipsTitle}>Длительность практики</Text>
          <View style={styles.chipsContainer}>
            {options.map((mins) => {
              const secs = mins * 60;
              const isSelected = duration === secs;
              return (
                <TouchableOpacity
                  key={mins}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => !isActive && setDuration(secs)}
                  disabled={isActive}
                  activeOpacity={isActive ? 1 : 0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {mins} мин
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Настройка звука */}
          <Text style={styles.chipsTitle}>Звук завершения</Text>
          <View style={styles.soundContainer}>
            <TouchableOpacity
              style={styles.soundOption}
              onPress={() => !isActive && setSound('siren_satsang')}
              disabled={isActive}
              activeOpacity={isActive ? 1 : 0.7}
            >
              <View style={[styles.soundRadio, sound === 'siren_satsang' && styles.soundRadioActive]}>
                {sound === 'siren_satsang' && <View style={styles.soundRadioInner} />}
              </View>
              <Text style={[styles.soundOptionText, sound === 'siren_satsang' && styles.soundOptionTextActive]}>
                Сирена Сатсанга
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.soundOption, styles.soundOptionLast]}
              onPress={() => !isActive && setSound('siren_warrior')}
              disabled={isActive}
              activeOpacity={isActive ? 1 : 0.7}
            >
              <View style={[styles.soundRadio, sound === 'siren_warrior' && styles.soundRadioActive]}>
                {sound === 'siren_warrior' && <View style={styles.soundRadioInner} />}
              </View>
              <Text style={[styles.soundOptionText, sound === 'siren_warrior' && styles.soundOptionTextActive]}>
                Сирена Воина
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

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

        {/* Practice Group */}
        <Text style={styles.sectionTitle}>Практика</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => setMode('timer')}>
            <View style={styles.menuItemLeft}>
              <TimerIcon color={COLORS.amber} />
              <Text style={styles.menuItemText}>Таймер практики</Text>
            </View>
            <ChevronRight color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Interface Group */}
        <Text style={styles.sectionTitle}>Интерфейс</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => setMode('navigation')}>
            <View style={styles.menuItemLeft}>
              <MenuIcon color={COLORS.amber} />
              <Text style={styles.menuItemText}>Настройка нижнего меню</Text>
            </View>
            <ChevronRight color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Actions Group */}
        <Text style={styles.sectionTitle}>Действия</Text>
        <View style={styles.menuGroup}>
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
          {getVersionInfo().map((line, index) => (
            <Text key={index} style={[styles.versionText, index > 0 && { marginTop: 4 }]}>
              {line}
            </Text>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}
