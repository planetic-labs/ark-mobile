import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { TouchableOpacity, Text } from 'react-native';
import { api } from '../../services/api';
import { COLORS } from '../../constants/Config';
import { useWebSocket } from '../../hooks/useWebSocket';
import { enqueueMessage } from '../../services/offlineQueue';
import {
  MessageBubble,
  ReportCard,
  CorrectionBubble,
  type SenderDeco,
} from '../../components/MessageBubbles';
import { MessageComposer } from '../../components/MessageComposer';
import { ChatHeaderTitle, ChatHeaderActions } from '../../components/ChatHeader';
import type { Message, WebSocketNewMessageEvent } from '../../types/shared';

// Тип для состояния реакций
interface ReactionState {
  pray: number;
  eye: number;
  userPrayed: boolean;
  userEyed: boolean;
}

const DEFAULT_REACTION: ReactionState = { pray: 4, eye: 2, userPrayed: false, userEyed: false };

function isReportFormat(text: string): boolean {
  return (
    text.toLowerCase().startsWith('отчёт') ||
    text.toLowerCase().startsWith('отчет') ||
    text.includes('1.') ||
    text.includes('2.')
  );
}

function parseReportItems(text: string): Array<{ num: string; text: string }> {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const items = lines.map((line) => {
    const match = line.match(/^(\d+[.)])\s*(.*)/);
    return match ? { num: match[1], text: match[2] } : { num: '•', text: line };
  });
  return items.length > 0 ? items : [{ num: '•', text }];
}

export default function ChatScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [content, setContent] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [studiedReports, setStudiedReports] = useState<Record<string, boolean>>({});
  const [reactions, setReactions] = useState<Record<string, ReactionState>>({});

  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { lastEvent } = useWebSocket();
  const router = useRouter();

  // Новые сообщения через WebSocket → в кэш TanStack Query
  useEffect(() => {
    if (lastEvent?.type !== 'message.new') return;
    const event = lastEvent as unknown as WebSocketNewMessageEvent;
    if (event.data.chat_id !== id) return;
    queryClient.setQueryData<Message[]>(['messages', id], (old) => {
      if (!old) return [event.data];
      if (old.some((m) => m.id === event.data.id)) return old;
      return [event.data, ...old];
    });
  }, [lastEvent, id, queryClient]);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => api.messaging.getMessages(id as string),
    enabled: !!id && id !== 'undefined',
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.listAll,
    staleTime: 10 * 60 * 1_000, // пользователи меняются реже
  });

  const { data: chats } = useQuery({
    queryKey: ['chats'],
    queryFn: api.messaging.listChats,
  });

  const currentChat = chats?.find((c) => c.id === id);

  const sendMutation = useMutation({
    mutationFn: () => api.messaging.sendMessage(id as string, content),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['messages', id] });
    },
    onError: () => {
      // Нет сети — сохраняем в офлайн-очередь
      enqueueMessage(id as string, content);
      setContent('');
    },
  });

  const handleSend = useCallback((): void => {
    if (!content.trim() || sendMutation.isPending) return;
    sendMutation.mutate();
  }, [content, sendMutation]);

  const getSenderDeco = useCallback((senderId: string): SenderDeco => {
    const sender = users?.find((u) => u.id === senderId);
    if (!sender) return { name: 'Пользователь', avatar: '?', role: 'STUDENT', isWarrior: false };
    const isWarrior = sender.role === 'WARRIOR' || sender.role === 'MASTER' || sender.role === 'ADMIN';
    return {
      name: sender.full_name || sender.email.split('@')[0],
      avatar: (sender.full_name || sender.email)[0].toUpperCase(),
      role: sender.role,
      isWarrior,
    };
  }, [users]);

  const toggleReaction = useCallback((msgId: string, type: 'pray' | 'eye'): void => {
    setReactions((prev) => {
      const cur = prev[msgId] ?? DEFAULT_REACTION;
      if (type === 'pray') {
        const userPrayed = !cur.userPrayed;
        return { ...prev, [msgId]: { ...cur, userPrayed, pray: cur.pray + (userPrayed ? 1 : -1) } };
      }
      const userEyed = !cur.userEyed;
      return { ...prev, [msgId]: { ...cur, userEyed, eye: cur.eye + (userEyed ? 1 : -1) } };
    });
  }, []);

  const renderItem = useCallback(({ item, index }: { item: Message; index: number }): React.ReactElement => {
    const sender = getSenderDeco(item.sender_id);
    const text = item.content || '';
    const time = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = new Date(item.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit' });

    if (text.includes('скриншот')) {
      return (
        <View style={styles.sysMsgWarn}>
          <Text style={styles.sysMsgWarnText}>⚠ {text}</Text>
        </View>
      );
    }

    if (isReportFormat(text)) {
      return (
        <ReportCard
          sender={sender}
          formattedTime={time}
          fullDate={date}
          items={parseReportItems(text)}
          isStudied={studiedReports[item.id] ?? false}
          reactions={reactions[item.id] ?? DEFAULT_REACTION}
          onToggleStudied={() => setStudiedReports((p) => ({ ...p, [item.id]: !p[item.id] }))}
          onToggleReaction={(type) => toggleReaction(item.id, type)}
        />
      );
    }

    const isCorrection = sender.isWarrior && index > 0 && isReportFormat(messages?.[index - 1]?.content ?? '');
    if (isCorrection) {
      return <CorrectionBubble content={text} formattedTime={time} sender={sender} />;
    }

    return <MessageBubble content={text} formattedTime={time} sender={sender} />;
  }, [getSenderDeco, studiedReports, reactions, messages, toggleReaction]);

  const bottomPadding = isKeyboardVisible ? 10 : Math.max(insets.bottom, Platform.OS === 'android' ? 15 : 0);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <ChatHeaderTitle name={currentChat?.name ?? 'Диалог'} memberCount={32} warriorCount={3} />
          ),
          headerRight: () => <ChatHeaderActions />,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={headerHeight}
      >
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.amber} />
          </View>
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={renderItem}
            ListHeaderComponent={
              <View style={styles.sysDateWrap}>
                <Text style={styles.sysDateText}>Сегодня</Text>
              </View>
            }
          />
        )}

        <MessageComposer
          value={content}
          onChangeText={setContent}
          onSend={handleSend}
          isSending={sendMutation.isPending}
          paddingBottom={bottomPadding}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 20, paddingTop: 10 },
  backBtn: { paddingRight: 12, paddingVertical: 4 },
  backBtnText: { fontSize: 24, color: COLORS.textSecondary },
  sysMsgWarn: {
    backgroundColor: 'rgba(183, 136, 69, 0.05)',
    borderWidth: 1, borderColor: '#F4EAD4',
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14,
    marginHorizontal: 20, marginVertical: 8, alignSelf: 'center',
  },
  sysMsgWarnText: { fontSize: 12, color: COLORS.warn, fontFamily: 'IBMPlexSans_400Regular' },
  sysDateWrap: { alignItems: 'center', marginVertical: 14 },
  sysDateText: {
    fontSize: 11, color: COLORS.textMuted,
    fontFamily: 'IBMPlexMono_400Regular',
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
});