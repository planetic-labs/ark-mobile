import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { enqueueMessage, getPendingMessagesForChat } from '../../services/offlineQueue';
import { useAuthStore } from '../../stores/useAuthStore';
import { useObserve } from 'expo-observe';
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

function isReportFormat(text: string | null): boolean {
  if (!text) return false;
  return (
    text.toLowerCase().startsWith('отчёт') ||
    text.toLowerCase().startsWith('отчет') ||
    text.includes('1.') ||
    text.includes('2.')
  );
}

function parseReportItems(text: string | null): Array<{ num: string; text: string }> {
  if (!text) return [];
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const items = lines.map((line) => {
    const match = line.match(/^(\d+[.)])\s*(.*)/);
    return match ? { num: match[1], text: match[2] } : { num: '•', text: line };
  });
  return items.length > 0 ? items : [{ num: '•', text }];
}

interface SendPayload {
  content?: string | null;
  message_type?: string;
  file_url?: string | null;
  duration?: number | null;
  sticker_id?: string | null;
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
  const { markInteractive } = useObserve();

  const flatListRef = useRef<FlatList>(null);

  // Новые сообщения через WebSocket → в кэш TanStack Query + пометка как доставленное
  useEffect(() => {
    if (lastEvent?.type !== 'message.new') return;
    const event = lastEvent as unknown as WebSocketNewMessageEvent;
    if (event.data.chat_id !== id) return;

    // Если сообщение от собеседника, отправляем статус "delivered"
    if (event.data.sender_id !== useAuthStore.getState().currentUser?.id) {
      api.messaging.updateReceipts([event.data.id], 'delivered')
        .catch((e) => console.log('Failed to mark message as delivered', e));
    }

    queryClient.setQueryData<Message[]>(['messages', id], (old) => {
      if (!old) return [event.data];
      if (old.some((m) => m.id === event.data.id)) return old;
      return [...old, event.data];
    });
  }, [lastEvent, id, queryClient]);

  // Обновление статусов доставки/прочтения сообщений через WebSocket
  useEffect(() => {
    if (lastEvent?.type !== 'message.receipt_updated') return;
    const event = lastEvent as any;
    if (event.data.chat_id !== id) return;

    queryClient.setQueryData<Message[]>(['messages', id], (old) => {
      if (!old) return old;
      return old.map((msg) => {
        if (msg.id === event.data.message_id) {
          return { ...msg, status: event.data.status };
        }
        return msg;
      });
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
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => api.messaging.getMessages(id as string),
    enabled: !!id && id !== 'undefined',
  });

  // Автоматическая пометка входящих сообщений как прочитанных при просмотре чата
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const currentUserId = useAuthStore.getState().currentUser?.id;
    const unreadMsgIds = messages
      .filter((m) => m.sender_id !== currentUserId && m.status !== 'read')
      .map((m) => m.id);

    if (unreadMsgIds.length > 0) {
      api.messaging.updateReceipts(unreadMsgIds, 'read')
        .then(() => {
          queryClient.setQueryData<Message[]>(['messages', id], (old) => {
            if (!old) return old;
            return old.map((m) => {
              if (unreadMsgIds.includes(m.id)) {
                return { ...m, status: 'read' };
              }
              return m;
            });
          });
        })
        .catch((e) => console.log('Failed to mark messages as read', e));
    }
  }, [messages, id, queryClient]);

  useEffect(() => {
    if (!isLoading) {
      markInteractive();
    }
  }, [isLoading, markInteractive]);

  const { data: pendingMessages } = useQuery({
    queryKey: ['pendingMessages', id],
    queryFn: () => getPendingMessagesForChat(id as string),
    initialData: () => getPendingMessagesForChat(id as string),
    enabled: !!id && id !== 'undefined',
  });

  const combinedMessages = useMemo(() => {
    const serverMsgs = messages || [];
    const localMsgs: Message[] = (pendingMessages || []).map((pm) => ({
      id: pm.localId,
      chat_id: pm.chatId,
      sender_id: useAuthStore.getState().currentUser?.id || 'me',
      content: pm.content,
      parent_id: null,
      created_at: pm.createdAt,
      message_type: 'text',
      status: 'sent',
    }));
    return [...serverMsgs, ...localMsgs];
  }, [messages, pendingMessages]);

  useEffect(() => {
    if (combinedMessages && combinedMessages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [combinedMessages.length]);

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.listAll,
    staleTime: 10 * 60 * 1_000,
  });

  const { data: chats } = useQuery({
    queryKey: ['chats'],
    queryFn: api.messaging.listChats,
  });

  const currentChat = chats?.find((c) => c.id === id);

  const sendMutation = useMutation({
    mutationFn: (payload: SendPayload) =>
      api.messaging.sendMessage(id as string, payload.content || null, {
        message_type: payload.message_type,
        file_url: payload.file_url,
        duration: payload.duration,
        sticker_id: payload.sticker_id,
      }),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['messages', id] });
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', id]);

      const tempId = `temp_${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        chat_id: id as string,
        sender_id: useAuthStore.getState().currentUser?.id || 'me',
        content: payload.content || null,
        parent_id: null,
        created_at: new Date().toISOString(),
        message_type: payload.message_type || 'text',
        file_url: payload.file_url,
        duration: payload.duration,
        sticker_id: payload.sticker_id,
        status: 'sent',
      };

      queryClient.setQueryData<Message[]>(['messages', id], (old) => {
        if (!old) return [tempMessage];
        return [...old, tempMessage];
      });

      return { previousMessages, tempId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData<Message[]>(['messages', id], (old) => {
        if (!old) return [data];
        return old.map((m) => (m.id === context?.tempId ? data : m));
      });
      queryClient.invalidateQueries({ queryKey: ['messages', id] });
    },
    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', id], context.previousMessages);
      }
      if (variables.content) {
        enqueueMessage(id as string, variables.content);
      }
      queryClient.invalidateQueries({ queryKey: ['pendingMessages', id] });
    },
  });

  const handleSend = useCallback((): void => {
    const textToSend = content.trim();
    if (!textToSend || sendMutation.isPending) return;
    setContent('');
    sendMutation.mutate({ content: textToSend });
  }, [content, sendMutation]);

  const handleSendMedia = useCallback(
    (payload: {
      message_type: 'audio' | 'image' | 'sticker' | 'video_note';
      file_url?: string;
      duration?: number;
      sticker_id?: string;
    }) => {
      sendMutation.mutate(payload);
    },
    [sendMutation]
  );

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
    const isPending = item.id.startsWith('local_') || item.id.startsWith('temp_');

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
          isPending={isPending}
        />
      );
    }

    const isCorrection = sender.isWarrior && index > 0 && isReportFormat(combinedMessages[index - 1]?.content ?? '');
    if (isCorrection) {
      return (
        <CorrectionBubble
          content={text}
          formattedTime={time}
          sender={sender}
          isPending={isPending}
          status={item.status}
        />
      );
    }

    return (
      <MessageBubble
        content={item.content}
        formattedTime={time}
        sender={sender}
        isPending={isPending}
        message_type={item.message_type}
        file_url={item.file_url}
        duration={item.duration}
        sticker_id={item.sticker_id}
        status={item.status}
      />
    );
  }, [getSenderDeco, studiedReports, reactions, combinedMessages, toggleReaction]);

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
            ref={flatListRef}
            data={combinedMessages}
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
          onSendMedia={handleSendMedia}
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
    borderWidth: 1,
    borderColor: '#F4EAD4',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginVertical: 8,
    alignSelf: 'center',
  },
  sysMsgWarnText: { fontSize: 12, color: COLORS.warn, fontFamily: 'IBMPlexSans_400Regular' },
  sysDateWrap: { alignItems: 'center', marginVertical: 14 },
  sysDateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: 'IBMPlexMono_400Regular',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});