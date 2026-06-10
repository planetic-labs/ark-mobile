import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { COLORS } from '../constants/Config';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/useAuthStore';
import { type User, type Chat } from '../types/shared';
import { usersStyles as styles } from '../styles/usersStyles';

type RoleType = 'STUDENT' | 'WARRIOR' | 'MASTER' | 'ADMIN';

export default function UsersScreen() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const queryClient = useQueryClient();
  
  // Modal state
  const [isModalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<RoleType>('STUDENT');

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: api.users.listAll,
  });

  const chatMutation = useMutation<Chat, Error, string>({
    mutationFn: (userId: string) => api.messaging.createChat(userId),
    onSuccess: (chat) => {
      router.push({ pathname: '/chat/[id]', params: { id: chat.id } });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: { email: string; full_name?: string; role: RoleType }) => 
      api.users.create(userData),
    onSuccess: () => {
      Alert.alert('Success', 'User created successfully');
      setModalVisible(false);
      setEmail('');
      setFullName('');
      setRole('STUDENT');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleCreateUser = () => {
    if (!email) {
      Alert.alert('Error', 'Email is required');
      return;
    }
    createUserMutation.mutate({
      email,
      full_name: fullName || undefined,
      role,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.amber} />
      </View>
    );
  }

  // Filter out current user from the list
  const otherUsers = users?.filter(u => u.id !== currentUser?.id) || [];
  const isAdmin = currentUser?.role === 'ADMIN';

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

      {isAdmin && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Новый участник</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Email адрес"
                placeholderTextColor={COLORS.textFaint}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Имя и фамилия"
                placeholderTextColor={COLORS.textFaint}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />

              <Text style={styles.roleLabel}>Роль участника</Text>
              <View style={styles.roleContainer}>
                {(['STUDENT', 'WARRIOR', 'MASTER', 'ADMIN'] as RoleType[]).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleChip,
                      role === r && styles.activeRoleChip
                    ]}
                    onPress={() => setRole(r)}
                  >
                    <Text style={[
                      styles.roleChipText,
                      role === r && styles.activeRoleChipText
                    ]}>
                      {getRoleDisplayName(r)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                  disabled={createUserMutation.isPending}
                >
                  <Text style={styles.cancelButtonText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleCreateUser}
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.createButtonText}>Создать</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

