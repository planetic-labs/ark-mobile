import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { api } from '../../services/api';
import { COLORS } from '../../constants/Config';
import { getChatDecoration } from '../../constants/chatDecorations';
import { chatListStyles as styles } from './chatListStyles';

const TABS = ['Мастер', 'Основные', 'Воины', 'Команда', 'Ретрит'] as const;

export default function ChatListScreen(): React.ReactElement {
  const [activeTab, setActiveTab] = useState('Основные');

  const { data: chats, isLoading, error, refetch } = useQuery({
    queryKey: ['chats'],
    queryFn: api.messaging.listChats,
  });

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.amber} /></View>;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Ошибка: {(error as Error).message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.summaryContainer}>
              {[
                { num: '3', label: 'неизученных\nотчёта', amber: true },
                { num: '5', label: 'новых\nкорректировок', amber: true },
                { num: '2', label: 'материала\nв Навигаторе', amber: false },
              ].map((stat) => (
                <View key={stat.label} style={styles.statChip}>
                  <Text style={[styles.statNum, stat.amber && styles.amberText]}>{stat.num}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.banner}>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerEyebrow}>Сатсанг назначен</Text>
                <Text style={styles.bannerTitle}>Сегодня в 20:00</Text>
              </View>
              <TouchableOpacity style={styles.bannerButton}>
                <Text style={styles.bannerButtonText}>Войти</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gtabsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gtabsScroll}>
                {TABS.map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.gtab, activeTab === tab && styles.gtabActive]}
                  >
                    <Text style={[styles.gtabText, activeTab === tab && styles.gtabTextActive]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const deco = getChatDecoration(item.name || 'Personal');
          return (
            <TouchableOpacity
              style={styles.chatRow}
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
            >
              <View style={[styles.avatar, deco.isWarrior && styles.avatarWarrior]}>
                <Text style={[styles.avatarText, deco.isWarrior && styles.avatarTextWarrior]}>
                  {deco.avatar}
                </Text>
              </View>

              <View style={styles.chatBody}>
                <View style={styles.chatTop}>
                  <Text style={[styles.chatName, deco.badge > 0 && styles.chatNameUnread]}>
                    {item.name || 'Личный чат'}
                  </Text>
                  <Text style={styles.chatTime}>{deco.time}</Text>
                </View>

                <Text style={[styles.chatPreview, deco.badge > 0 && styles.chatPreviewUnread]} numberOfLines={1}>
                  {deco.lastMsgAuthor && (
                    <Text style={[styles.previewAuthor, deco.isWarrior && { color: COLORS.amberSoft }]}>
                      {deco.lastMsgAuthor}{' '}
                    </Text>
                  )}
                  {deco.lastMsgText}
                </Text>

                {deco.practice && (
                  <View style={styles.practiceContainer}>
                    <View style={styles.practiceDot} />
                    <Text style={styles.practiceText}>{deco.practice}</Text>
                  </View>
                )}
              </View>

              {deco.badge > 0 && (
                <View style={[styles.badgeContainer, deco.badgeColor === COLORS.amber && styles.badgeAmber]}>
                  <Text style={styles.badgeText}>{deco.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>Нет активных чатов</Text>}
      />
    </View>
  );
}
