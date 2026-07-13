import React, { useMemo, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router, Tabs } from 'expo-router';
import { api } from '../../services/api';
import { COLORS } from '../../constants/Config';
import { chatListStyles as styles } from '../../styles/chatListStyles';
import { useObserve } from 'expo-observe';
import { useAuthStore } from '../../stores/useAuthStore';
import Svg, { Path } from 'react-native-svg';
import type { Chat } from '../../types/shared';

export default function ChatListScreen(): React.ReactElement {
  const { markInteractive } = useObserve();
  const currentUser = useAuthStore((state) => state.currentUser);

  const { data: chats, isLoading, error } = useQuery({
    queryKey: ['chats'],
    queryFn: api.messaging.listChats,
  });

  useEffect(() => {
    if (!isLoading) {
      markInteractive();
    }
  }, [isLoading, markInteractive]);

  // Сортировка чатов по дате последнего сообщения (самое свежее сверху)
  const sortedChats = useMemo(() => {
    if (!chats) return [];
    return [...chats].sort((a, b) => {
      const timeA = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.created_at).getTime();
      const timeB = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.created_at).getTime();
      return timeB - timeA;
    });
  }, [chats]);

  const getChatName = (chat: Chat) => {
    if (chat.is_group) {
      return chat.name || 'Групповой чат';
    }
    // Для персонального чата находим собеседника (участника с id != currentUser.id)
    const interlocutor = chat.members?.find((m) => m.id !== currentUser?.id);
    if (interlocutor) {
      return interlocutor.full_name || interlocutor.email.split('@')[0];
    }
    return chat.name || 'Личный чат';
  };

  const isChatWarrior = (chat: Chat) => {
    if (chat.is_group) {
      const nameLower = (chat.name || '').toLowerCase();
      return nameLower.includes('воин') || nameLower.includes('инкубатор') || nameLower.includes('реанимация');
    }
    const interlocutor = chat.members?.find((m) => m.id !== currentUser?.id);
    return interlocutor ? (interlocutor.role === 'WARRIOR' || interlocutor.role === 'MASTER' || interlocutor.role === 'ADMIN') : false;
  };

  const getLastMessageText = (chat: Chat) => {
    if (chat.last_message) {
      return chat.last_message.content;
    }
    return 'Открыть переписку';
  };

  const getLastMessageAuthorName = (chat: Chat) => {
    if (!chat.last_message) return '';
    const sender = chat.last_message.sender;
    if (!sender) return '';
    if (sender.id === currentUser?.id) return 'Вы:';
    
    const isWarrior = sender.role === 'WARRIOR' || sender.role === 'MASTER' || sender.role === 'ADMIN';
    const prefix = isWarrior ? '◈ ' : '';
    return `${prefix}${sender.full_name || sender.email.split('@')[0]}:`;
  };

  const getLastMessageTime = (chat: Chat) => {
    if (!chat.last_message) {
      const date = new Date(chat.created_at);
      return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    }
    const msgDate = new Date(chat.last_message.created_at);
    const today = new Date();
    if (msgDate.toDateString() === today.toDateString()) {
      return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return msgDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.amber} /></View>;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Ошибка: {(error as Error).message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Tabs.Screen
        options={{
          headerTitle: 'Чат',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/users')}
              style={{ marginRight: 15, padding: 5 }}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M12 5v14M5 12h14" stroke={COLORS.amber} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          )
        }}
      />
      <FlatList
        data={sortedChats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => {
          const chatName = getChatName(item);
          const isWarrior = isChatWarrior(item);
          const avatarText = chatName[0].toUpperCase();
          const lastMsgAuthor = getLastMessageAuthorName(item);
          const lastMsgText = getLastMessageText(item);
          const chatTime = getLastMessageTime(item);

          return (
            <TouchableOpacity
              style={styles.chatRow}
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
            >
              <View style={[styles.avatar, isWarrior && styles.avatarWarrior]}>
                <Text style={[styles.avatarText, isWarrior && styles.avatarTextWarrior]}>
                  {avatarText}
                </Text>
              </View>

              <View style={styles.chatBody}>
                <View style={styles.chatTop}>
                  <Text style={styles.chatName}>
                    {isWarrior && <Text style={{ color: COLORS.amberSoft }}>◈ </Text>}
                    {chatName}
                  </Text>
                  <Text style={styles.chatTime}>{chatTime}</Text>
                </View>

                <Text style={styles.chatPreview} numberOfLines={1}>
                  {lastMsgAuthor && (
                    <Text style={[styles.previewAuthor, isWarrior && { color: COLORS.amberSoft }]}>
                      {lastMsgAuthor}{' '}
                    </Text>
                  )}
                  {lastMsgText}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>Нет чатов</Text>}
      />
    </View>
  );
}
