import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { COLORS } from '../constants/Config';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/useAuthStore';
import { type User, type Chat } from '../types/shared';
import { usersStyles as styles } from '../styles/usersStyles';
import { useObserve } from 'expo-observe';

export default function UsersScreen() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const { markInteractive } = useObserve();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: api.users.listAll,
  });

  useEffect(() => {
    if (!isLoading) {
      markInteractive();
    }
  }, [isLoading, markInteractive]);

  const chatMutation = useMutation<Chat, Error, string>({
    mutationFn: (userId: string) => api.messaging.createChat(userId),
    onSuccess: (chat) => {
      router.push({ pathname: '/chat/[id]', params: { id: chat.id } });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.amber} />
      </View>
    );
  }

  // Filter out current user from the list
  const otherUsers = users?.filter(u => u.id !== currentUser?.id) || [];

  const isWarriorRole = (userRole?: string) => {
    return userRole === 'WARRIOR' || userRole === 'MASTER' || userRole === 'ADMIN';
  };

  const getRoleDisplayName = (r: string) => {
    switch (r) {
      case 'ADMIN': return 'Админ';
      case 'MASTER': return 'Мастер';
      case 'WARRIOR': return 'Воин';
      default: return 'Ученик';
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={otherUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const isWarrior = isWarriorRole(item.role);
          return (
            <TouchableOpacity 
              style={styles.userItem}
              onPress={() => chatMutation.mutate(item.id)}
              disabled={chatMutation.isPending}
            >
              <View style={[styles.avatar, isWarrior && styles.avatarWarrior]}>
                <Text style={[styles.avatarText, isWarrior && styles.avatarTextWarrior]}>
                  {(item.full_name || item.email)[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>
                    {item.full_name || 'Без Имени'} {isWarrior && '◈'}
                  </Text>
                  {item.role && (
                    <View style={[
                      styles.roleBadge, 
                      isWarrior ? styles.warriorBadge : styles.studentBadge
                    ]}>
                      <Text style={[
                        styles.roleBadgeText, 
                        isWarrior ? styles.warriorBadgeText : styles.studentBadgeText
                      ]}>
                        {getRoleDisplayName(item.role)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Участники не найдены</Text>
        }
      />
    </View>
  );
}

