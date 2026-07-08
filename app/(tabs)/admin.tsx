import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
  Platform,
  StyleSheet,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { COLORS, FONTS } from '../../constants/Config';
import { useObserve } from 'expo-observe';
import { type User, type UserRole } from '../../types/shared';

export default function AdminScreen(): React.ReactElement {
  const { markInteractive } = useObserve();
  const queryClient = useQueryClient();

  // Queries
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: api.users.listAll,
  });

  useEffect(() => {
    if (!isLoading) {
      markInteractive();
    }
  }, [isLoading, markInteractive]);

  // Create Modal State
  const [isCreateVisible, setCreateVisible] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createRole, setCreateRole] = useState<UserRole>('STUDENT');

  // Edit Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('STUDENT');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editIsApproved, setEditIsApproved] = useState(true);

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (userData: { email: string; full_name?: string; role: UserRole }) =>
      api.users.create(userData),
    onSuccess: () => {
      Alert.alert('Успех', 'Пользователь успешно добавлен.');
      setCreateVisible(false);
      setCreateEmail('');
      setCreateFullName('');
      setCreateRole('STUDENT');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      Alert.alert('Ошибка', error.message);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: { userId: string; payload: any }) =>
      api.users.update(data.userId, data.payload),
    onSuccess: () => {
      Alert.alert('Успех', 'Профиль пользователя обновлен.');
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      Alert.alert('Ошибка', error.message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => api.users.delete(userId),
    onSuccess: () => {
      Alert.alert('Успех', 'Пользователь отключен.');
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      Alert.alert('Ошибка', error.message);
    },
  });

  const handleCreateUser = () => {
    const emailTrim = createEmail.trim().toLowerCase();
    if (!emailTrim) {
      Alert.alert('Ошибка', 'Email обязателен для ввода.');
      return;
    }
    createUserMutation.mutate({
      email: emailTrim,
      full_name: createFullName.trim() || undefined,
      role: createRole,
    });
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;
    updateUserMutation.mutate({
      userId: selectedUser.id,
      payload: {
        full_name: editFullName.trim() || null,
        role: editRole,
        is_active: editIsActive,
        is_approved: editIsApproved,
      },
    });
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    Alert.alert(
      'Удаление участника',
      `Вы действительно хотите отключить пользователя ${selectedUser.full_name || selectedUser.email}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отключить',
          style: 'destructive',
          onPress: () => deleteUserMutation.mutate(selectedUser.id),
        },
      ]
    );
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setEditFullName(user.full_name || '');
    setEditRole(user.role);
    setEditIsActive(user.is_active);
    setEditIsApproved(user.is_approved);
  };

  const getRoleDisplayName = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return 'Админ';
      case 'MASTER':
        return 'Мастер';
      case 'WARRIOR':
        return 'Воин';
      default:
        return 'Ученик';
    }
  };

  const isWarriorRole = (userRole?: string) => {
    return userRole === 'WARRIOR' || userRole === 'MASTER' || userRole === 'ADMIN';
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.amber} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const isWarrior = isWarriorRole(item.role);
          return (
            <TouchableOpacity style={styles.userItem} onPress={() => handleOpenEdit(item)}>
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
                    <View
                      style={[
                        styles.roleBadge,
                        isWarrior ? styles.warriorBadge : styles.studentBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleBadgeText,
                          isWarrior ? styles.warriorBadgeText : styles.studentBadgeText,
                        ]}
                      >
                        {getRoleDisplayName(item.role)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userEmail}>
                  {item.email} • {item.is_approved ? 'Одобрен' : 'Не одобрен'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>Участники не найдены</Text>}
      />

      {/* FAB Button to Add User */}
      <TouchableOpacity style={styles.fab} onPress={() => setCreateVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* CREATE USER MODAL */}
      <Modal
        visible={isCreateVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateVisible(false)}
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
                value={createEmail}
                onChangeText={setCreateEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Имя и фамилия"
                placeholderTextColor={COLORS.textFaint}
                value={createFullName}
                onChangeText={setCreateFullName}
                autoCapitalize="words"
              />

              <Text style={styles.roleLabel}>Роль участника</Text>
              <View style={styles.roleContainer}>
                {(['STUDENT', 'WARRIOR', 'MASTER', 'ADMIN'] as UserRole[]).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleChip, createRole === r && styles.activeRoleChip]}
                    onPress={() => setCreateRole(r)}
                  >
                    <Text
                      style={[styles.roleChipText, createRole === r && styles.activeRoleChipText]}
                    >
                      {getRoleDisplayName(r)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setCreateVisible(false)}
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

      {/* EDIT USER MODAL */}
      <Modal
        visible={selectedUser !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUser(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Управление участником</Text>

              <Text style={styles.infoLabel}>Email (Не редактируется)</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={selectedUser?.email || ''}
                editable={false}
              />

              <Text style={styles.infoLabel}>Имя и фамилия</Text>
              <TextInput
                style={styles.input}
                placeholder="Имя и фамилия"
                placeholderTextColor={COLORS.textFaint}
                value={editFullName}
                onChangeText={setEditFullName}
                autoCapitalize="words"
              />

              <Text style={styles.roleLabel}>Роль участника</Text>
              <View style={styles.roleContainer}>
                {(['STUDENT', 'WARRIOR', 'MASTER', 'ADMIN'] as UserRole[]).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleChip, editRole === r && styles.activeRoleChip]}
                    onPress={() => setEditRole(r)}
                  >
                    <Text
                      style={[styles.roleChipText, editRole === r && styles.activeRoleChipText]}
                    >
                      {getRoleDisplayName(r)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.switchGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Доступ в приложение одобрен</Text>
                  <Switch
                    value={editIsApproved}
                    onValueChange={setEditIsApproved}
                    trackColor={{ false: COLORS.textFaint, true: COLORS.amber }}
                    thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Активный аккаунт</Text>
                  <Switch
                    value={editIsActive}
                    onValueChange={setEditIsActive}
                    trackColor={{ false: COLORS.textFaint, true: COLORS.amber }}
                    thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                  />
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setSelectedUser(null)}
                  disabled={updateUserMutation.isPending || deleteUserMutation.isPending}
                >
                  <Text style={styles.cancelButtonText}>Закрыть</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={handleDeleteUser}
                  disabled={updateUserMutation.isPending || deleteUserMutation.isPending}
                >
                  <Text style={styles.deleteButtonText}>Отключить</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleUpdateUser}
                  disabled={updateUserMutation.isPending || deleteUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.createButtonText}>Сохранить</Text>
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

const styles = StyleSheet.create({
  keyboardAvoidingView: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  listContainer: { paddingVertical: 10 },
  userItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft || '#F4F1EA',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgSurface || '#FAF8F5',
    borderWidth: 1,
    borderColor: COLORS.textFaint || '#ECE7DD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarWarrior: { borderColor: COLORS.amber, backgroundColor: COLORS.amberGlow },
  avatarText: { fontSize: 16, color: COLORS.textSecondary, fontFamily: FONTS.bodySemiBold },
  avatarTextWarrior: { color: COLORS.amber },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  userName: {
    fontSize: 15,
    color: COLORS.textPrimary,
    marginRight: 8,
    fontFamily: FONTS.displaySemiBold,
  },
  userEmail: { fontSize: 12.5, color: COLORS.textSecondary, fontFamily: FONTS.mono, marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.textMuted, fontFamily: FONTS.body },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentBadge: { backgroundColor: COLORS.borderSoft || '#F4F1EA', borderColor: COLORS.textFaint || '#ECE7DD' },
  warriorBadge: { backgroundColor: COLORS.warriorBg || '#FCF4E3', borderColor: '#F0DFB8' },
  roleBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.monoMedium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  studentBadgeText: { color: COLORS.textSecondary },
  warriorBadgeText: { color: COLORS.amber },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: COLORS.amber,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#282114',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  fabIcon: { color: '#fff', fontSize: 28, fontWeight: '500', lineHeight: 30 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 30, 23, 0.42)',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#282114',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: COLORS.textPrimary,
    fontFamily: FONTS.displaySemiBold,
  },
  infoLabel: {
    fontSize: 10,
    fontFamily: FONTS.monoMedium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 5,
    color: COLORS.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.textFaint || '#ECE7DD',
    backgroundColor: '#FCFAF5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 15,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
  },
  disabledInput: {
    backgroundColor: COLORS.borderSoft || '#F4F1EA',
    color: COLORS.textSecondary,
  },
  roleLabel: {
    fontSize: 10,
    fontFamily: FONTS.monoMedium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    color: COLORS.textSecondary,
  },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  roleChip: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    backgroundColor: COLORS.borderSoft || '#F4F1EA',
  },
  activeRoleChip: { borderColor: '#F0DFB8', backgroundColor: COLORS.amberTint || '#FAF1DC' },
  roleChipText: { fontSize: 10.5, color: COLORS.textSecondary, fontFamily: FONTS.bodyMedium },
  activeRoleChipText: { color: COLORS.amber, fontFamily: FONTS.bodySemiBold },
  switchGroup: {
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft || '#F4F1EA',
    paddingTop: 15,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: { fontSize: 13.5, color: COLORS.textPrimary, fontFamily: FONTS.body },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginHorizontal: 3 },
  cancelButton: { backgroundColor: COLORS.borderSoft || '#F4F1EA' },
  createButton: { backgroundColor: COLORS.amber },
  deleteButton: { backgroundColor: COLORS.warn || '#a04a3a' },
  cancelButtonText: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONTS.bodySemiBold },
  createButtonText: { color: '#fff', fontSize: 14, fontFamily: FONTS.bodySemiBold },
  deleteButtonText: { color: '#fff', fontSize: 14, fontFamily: FONTS.bodySemiBold },
});
