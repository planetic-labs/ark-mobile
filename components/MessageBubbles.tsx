import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/Config';
import { Image } from 'expo-image';
import { Audio } from 'expo-av';
import { useVideoPlayer, VideoView } from 'expo-video';

// Данные отправителя, необходимые для отображения сообщения
export interface SenderDeco {
  name: string;
  avatar: string;
  role: string;
  isWarrior: boolean;
}

interface ReportItem {
  num: string;
  text: string;
}

interface ReactionState {
  pray: number;
  eye: number;
  userPrayed: boolean;
  userEyed: boolean;
}

interface MessageBubbleProps {
  content: string | null;
  formattedTime: string;
  sender: SenderDeco;
  isPending?: boolean;
  message_type?: string;
  file_url?: string | null;
  duration?: number | null;
  sticker_id?: string | null;
  status?: string;
}

interface ReportCardProps {
  sender: SenderDeco;
  formattedTime: string;
  fullDate: string;
  items: ReportItem[];
  isStudied: boolean;
  reactions: ReactionState;
  onToggleStudied: () => void;
  onToggleReaction: (type: 'pray' | 'eye') => void;
  isPending?: boolean;
}

interface CorrectionBubbleProps {
  content: string;
  formattedTime: string;
  sender: SenderDeco;
  isPending?: boolean;
  status?: string;
}

// Компонент проигрывания аудио
const AudioPlayer = React.memo(function AudioPlayer({
  fileUrl,
  duration,
}: {
  fileUrl: string;
  duration?: number | null;
}) {
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [position, setPosition] = React.useState(0);
  const [soundDuration, setSoundDuration] = React.useState(duration ? duration * 1000 : 0);

  React.useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handlePlayPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: fileUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPosition(status.positionMillis);
            if (status.durationMillis) {
              setSoundDuration(status.durationMillis);
            }
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
            }
          }
        }
      );
      setSound(newSound);
      setIsPlaying(true);
    }
  };

  const formatAudioTime = (millis: number) => {
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={styles.audioContainer}>
      <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
        <Text style={styles.playButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
      <View style={styles.audioProgressContainer}>
        <View style={styles.audioProgressBar}>
          <View
            style={[
              styles.audioProgressFill,
              { width: `${soundDuration > 0 ? (position / soundDuration) * 100 : 0}%` },
            ]}
          />
        </View>
        <Text style={styles.audioTime}>
          {formatAudioTime(position)} / {formatAudioTime(soundDuration)}
        </Text>
      </View>
    </View>
  );
});

// Компонент проигрывания видеокружочка
const VideoNotePlayer = React.memo(function VideoNotePlayer({ fileUrl }: { fileUrl: string }) {
  const [isMuted, setIsMuted] = React.useState(true);

  const player = useVideoPlayer(fileUrl, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  const toggleMuted = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    player.muted = nextMuted;
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={toggleMuted} style={styles.videoNoteContainer}>
      <VideoView
        style={styles.videoNotePlayer}
        player={player}
      />
      <View style={styles.videoNoteMuteBadge}>
        <Text style={styles.videoNoteMuteText}>{isMuted ? '🔇' : '🔊'}</Text>
      </View>
    </TouchableOpacity>
  );
});

// Обычное сообщение (Воин или Ученик)
export const MessageBubble = React.memo(function MessageBubble({
  content,
  formattedTime,
  sender,
  isPending,
  message_type = 'text',
  file_url,
  duration,
  sticker_id,
  status = 'sent',
}: MessageBubbleProps): React.ReactElement {
  const renderStatus = () => {
    if (isPending) return <Text style={styles.readText}>⏳</Text>;
    if (status === 'read') return <Text style={[styles.readText, { color: COLORS.amber }]}>✓✓</Text>;
    if (status === 'delivered') return <Text style={[styles.readText, { color: COLORS.textMuted }]}>✓✓</Text>;
    return <Text style={[styles.readText, { color: COLORS.textMuted }]}>✓</Text>;
  };

  const getFullUrl = (url: string | null | undefined) => {
    if (!url) return '';
    if (url.startsWith('/static')) {
      const baseUrl = require('../constants/Config').API_URL;
      return `${baseUrl}${url}`;
    }
    return url;
  };

  const fullFileUrl = getFullUrl(file_url);

  // Для стикера рендерим без пузыря
  if (message_type === 'sticker') {
    return (
      <View style={[styles.msgRow, isPending && styles.pendingBubble]}>
        <View style={[styles.avatar, sender.isWarrior && styles.avatarWarrior]}>
          <Text style={[styles.avatarText, sender.isWarrior && styles.avatarTextWarrior]}>
            {sender.avatar}
          </Text>
        </View>
        <View style={{ maxWidth: '85%' }}>
          <Text style={[styles.authorName, sender.isWarrior && styles.authorNameWarrior]}>
            {sender.name} {sender.isWarrior && '◈'}
          </Text>
          <Image source={{ uri: fullFileUrl }} style={styles.stickerImage} contentFit="contain" />
          <View style={styles.metaRow}>
            <Text style={styles.timeText}>{formattedTime}</Text>
            {renderStatus()}
          </View>
        </View>
      </View>
    );
  }

  // Для видеокружочка рендерим круглый плеер
  if (message_type === 'video_note') {
    return (
      <View style={[styles.msgRow, isPending && styles.pendingBubble]}>
        <View style={[styles.avatar, sender.isWarrior && styles.avatarWarrior]}>
          <Text style={[styles.avatarText, sender.isWarrior && styles.avatarTextWarrior]}>
            {sender.avatar}
          </Text>
        </View>
        <View style={{ maxWidth: '85%' }}>
          <Text style={[styles.authorName, sender.isWarrior && styles.authorNameWarrior]}>
            {sender.name} {sender.isWarrior && '◈'}
          </Text>
          {fullFileUrl ? <VideoNotePlayer fileUrl={fullFileUrl} /> : null}
          <View style={styles.metaRow}>
            <Text style={styles.timeText}>{formattedTime}</Text>
            {renderStatus()}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.msgRow, isPending && styles.pendingBubble]}>
      <View style={[styles.avatar, sender.isWarrior && styles.avatarWarrior]}>
        <Text style={[styles.avatarText, sender.isWarrior && styles.avatarTextWarrior]}>
          {sender.avatar}
        </Text>
      </View>
      <View style={[styles.bubble, sender.isWarrior && styles.bubbleWarrior]}>
        <Text style={[styles.authorName, sender.isWarrior && styles.authorNameWarrior]}>
          {sender.name} {sender.isWarrior && '◈'}
        </Text>

        {message_type === 'image' && fullFileUrl ? (
          <Image source={{ uri: fullFileUrl }} style={styles.imageAttachment} contentFit="cover" />
        ) : null}

        {message_type === 'audio' && fullFileUrl ? (
          <AudioPlayer fileUrl={fullFileUrl} duration={duration} />
        ) : null}

        {content ? <Text style={styles.messageText}>{content}</Text> : null}

        <View style={styles.metaRow}>
          <Text style={styles.timeText}>{formattedTime}</Text>
          {renderStatus()}
        </View>
      </View>
    </View>
  );
});

// Карточка отчёта ученика с кнопкой «Изучить» и реакциями
export const ReportCard = React.memo(function ReportCard({
  sender,
  formattedTime,
  fullDate,
  items,
  isStudied,
  reactions,
  onToggleStudied,
  onToggleReaction,
  isPending,
}: ReportCardProps): React.ReactElement {
  return (
    <View style={[styles.msgRow, isPending && styles.pendingBubble]}>
      <View style={[styles.avatar, sender.isWarrior && styles.avatarWarrior]}>
        <Text style={[styles.avatarText, sender.isWarrior && styles.avatarTextWarrior]}>
          {sender.avatar}
        </Text>
      </View>
      <View style={styles.reportCard}>
        <View style={styles.reportHead}>
          <View>
            <Text style={styles.reportTag}>Отчёт</Text>
            <Text style={styles.reportName}>{sender.name}</Text>
          </View>
          <Text style={styles.reportDate}>{fullDate} · {formattedTime}</Text>
        </View>

        <View style={styles.reportBody}>
          {items.map((item, idx) => (
            <View key={idx} style={styles.reportItem}>
              <Text style={styles.reportItemNum}>{item.num}</Text>
              <Text style={styles.reportItemText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.reportFoot}>
          <View style={styles.studiedRow}>
            <TouchableOpacity
              style={[styles.btnStudy, isStudied && styles.btnStudyDone]}
              onPress={onToggleStudied}
              disabled={isPending}
            >
              <Text style={[styles.btnStudyText, isStudied && styles.btnStudyTextDone]}>
                {isStudied ? '✓ Изучен' : 'Изучить'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.studiedStat}>
              изучили {isStudied ? 19 : 18} · <Text style={styles.warriorMark}>◈ {isStudied ? 3 : 2}</Text>
            </Text>
          </View>

          <View style={styles.reactRow}>
            <Text style={styles.reactLabel}>реакции</Text>
            {(['pray', 'eye'] as const).map((type) => {
              const active = type === 'pray' ? reactions.userPrayed : reactions.userEyed;
              const count = type === 'pray' ? reactions.pray : reactions.eye;
              const emoji = type === 'pray' ? '🙏' : '👁';
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.reactChip, active && styles.reactChipMine]}
                  onPress={() => onToggleReaction(type)}
                  disabled={isPending}
                >
                  <Text style={[styles.reactChipText, active && styles.reactChipTextMine]}>
                    {emoji} {count}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.reactChipAdd} disabled={isPending}>
              <Text style={styles.reactChipAddText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
});

// Корректировка Воина к отчёту — отображается с левой границей
export const CorrectionBubble = React.memo(function CorrectionBubble({
  content,
  formattedTime,
  sender,
  isPending,
  status = 'sent',
}: CorrectionBubbleProps): React.ReactElement {
  return (
    <View style={[styles.correctionContainer, isPending && styles.pendingBubble]}>
      <Text style={styles.correctionTag}>◈ Корректировка · тред летописи</Text>
      <View style={[styles.msgRow, styles.msgRowInner]}>
        <View style={[styles.avatar, styles.avatarWarrior]}>
          <Text style={[styles.avatarText, styles.avatarTextWarrior]}>{sender.avatar}</Text>
        </View>
        <View style={[styles.bubble, styles.bubbleWarrior]}>
          <Text style={styles.authorNameWarrior}>{sender.name}</Text>
          <Text style={styles.messageText}>{content}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.timeText}>{formattedTime}</Text>
            <Text style={styles.readText}>
              {isPending ? '⏳' : status === 'read' ? '✓✓' : status === 'delivered' ? '✓✓' : '✓'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  msgRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 6,
    alignItems: 'flex-start',
  },
  msgRowInner: { marginHorizontal: 0, marginBottom: 0 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#ECE7DD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  avatarWarrior: { borderColor: COLORS.amber, backgroundColor: COLORS.amberGlow },
  avatarText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.bodyMedium },
  avatarTextWarrior: { color: COLORS.amber, fontFamily: FONTS.bodySemiBold },
  bubble: {
    backgroundColor: '#FCFAF5',
    borderWidth: 1,
    borderColor: '#F4F1EA',
    padding: 12,
    borderRadius: 15,
    borderTopLeftRadius: 4,
    maxWidth: '85%',
    flex: 1,
  },
  bubbleWarrior: { backgroundColor: 'rgba(252,244,227,0.7)', borderColor: '#F0DFB8' },
  authorName: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodySemiBold,
    marginBottom: 4,
  },
  authorNameWarrior: {
    color: COLORS.amberSoft,
    fontFamily: FONTS.display,
    fontStyle: 'italic',
    fontSize: 12.5,
    marginBottom: 4,
  },
  messageText: { fontSize: 13.5, lineHeight: 19, color: COLORS.textPrimary, fontFamily: FONTS.body },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 6 },
  timeText: { fontSize: 9.5, color: COLORS.textMuted, fontFamily: FONTS.mono },
  readText: { fontSize: 9.5, color: COLORS.textMuted, fontFamily: FONTS.body, marginLeft: 6 },
  reportCard: {
    borderWidth: 1,
    borderColor: '#ECE7DD',
    borderRadius: 15,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    flex: 1,
    shadowColor: '#282114',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  reportHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE7DD',
    backgroundColor: '#FCFAF5',
  },
  reportTag: {
    fontSize: 9,
    fontFamily: FONTS.monoMedium,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  reportName: { fontSize: 13, color: COLORS.textPrimary, fontFamily: FONTS.displaySemiBold },
  reportDate: { fontSize: 10, color: COLORS.textMuted, fontFamily: FONTS.mono, alignSelf: 'flex-start' },
  reportBody: { paddingHorizontal: 13, paddingVertical: 11 },
  reportItem: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  reportItemNum: {
    fontSize: 11,
    color: COLORS.amber,
    marginRight: 6,
    width: 14,
    fontFamily: FONTS.monoMedium,
    paddingTop: 1,
  },
  reportItemText: { fontSize: 12.5, lineHeight: 18, color: COLORS.textPrimary, fontFamily: FONTS.body, flex: 1 },
  reportFoot: { borderTopWidth: 1, borderTopColor: '#F4F1EA', paddingHorizontal: 13, paddingVertical: 9 },
  studiedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  btnStudy: {
    borderWidth: 1.4,
    borderColor: COLORS.amber,
    backgroundColor: 'transparent',
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 5,
    marginRight: 10,
  },
  btnStudyDone: { backgroundColor: COLORS.amber },
  btnStudyText: { color: COLORS.amber, fontSize: 11.5, fontFamily: FONTS.bodySemiBold },
  btnStudyTextDone: { color: '#ffffff' },
  studiedStat: { fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.mono },
  warriorMark: { color: COLORS.amber, fontFamily: FONTS.bodySemiBold },
  reactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F4F1EA',
    paddingTop: 8,
    marginTop: 4,
  },
  reactLabel: {
    fontSize: 9,
    fontFamily: FONTS.mono,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  reactChip: { backgroundColor: '#F4F1EA', borderRadius: 11, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6 },
  reactChipMine: { backgroundColor: '#FAF1DC', borderWidth: 1, borderColor: '#F0DFB8' },
  reactChipText: { fontSize: 11, color: COLORS.textSecondary, fontFamily: FONTS.mono },
  reactChipTextMine: { color: COLORS.amber, fontFamily: FONTS.monoMedium },
  reactChipAdd: {
    width: 24,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ECE7DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactChipAddText: { fontSize: 12, color: COLORS.textMuted, lineHeight: 13 },
  correctionContainer: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.amberBright,
    paddingLeft: 13,
    marginLeft: 23,
    marginVertical: 8,
  },
  correctionTag: {
    fontSize: 9,
    fontFamily: FONTS.mono,
    color: COLORS.amber,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  pendingBubble: {
    opacity: 0.6,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    minWidth: 200,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 18,
  },
  audioProgressContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  audioProgressBar: {
    height: 4,
    backgroundColor: '#E5E0D8',
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  audioProgressFill: {
    height: '100%',
    backgroundColor: COLORS.amber,
  },
  audioTime: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  videoNoteContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.amber,
    backgroundColor: '#000',
    position: 'relative',
    marginVertical: 4,
  },
  videoNotePlayer: {
    width: '100%',
    height: '100%',
  },
  videoNoteMuteBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 4,
  },
  videoNoteMuteText: {
    fontSize: 10,
    color: '#fff',
  },
  imageAttachment: {
    width: 220,
    height: 160,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#EFECE6',
  },
  stickerImage: {
    width: 120,
    height: 120,
    marginVertical: 4,
  },
});
