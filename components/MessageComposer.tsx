import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { COLORS, FONTS } from '../constants/Config';
import { Image } from 'expo-image';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '../services/api';

interface MessageComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onSendMedia: (payload: {
    message_type: 'audio' | 'image' | 'sticker' | 'video_note';
    file_url?: string;
    duration?: number;
    sticker_id?: string;
  }) => void;
  isSending: boolean;
  paddingBottom: number;
}

const STICKERS = [
  { id: 'st_1', name: 'Йода', url: 'https://img.icons8.com/color/344/baby-yoda.png' },
  { id: 'st_2', name: 'Вейдер', url: 'https://img.icons8.com/color/344/darth-vader.png' },
  { id: 'st_3', name: 'Штурмовик', url: 'https://img.icons8.com/color/344/stormtrooper.png' },
  { id: 'st_4', name: 'BB-8', url: 'https://img.icons8.com/color/344/bb-8.png' },
];

export function MessageComposer({
  value,
  onChangeText,
  onSend,
  onSendMedia,
  isSending,
  paddingBottom,
}: MessageComposerProps): React.ReactElement {
  const [isUploading, setIsUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraRecording, setCameraRecording] = useState(false);

  // Audio recording
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const isRecording = recorderState.isRecording;
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordInterval = useRef<any>(null);

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const hasText = value.trim().length > 0;

  useEffect(() => {
    return () => {
      if (recordInterval.current) clearInterval(recordInterval.current);
    };
  }, []);

  const handlePickImage = async () => {
    setShowOptions(false);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Необходим доступ к фотогалерее!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      try {
        setIsUploading(true);
        const uploadRes = await api.messaging.uploadAttachment(
          asset.uri,
          'image/jpeg',
          asset.fileName || 'image.jpg'
        );
        onSendMedia({
          message_type: 'image',
          file_url: uploadRes.file_url,
        });
      } catch (e) {
        alert('Не удалось загрузить изображение!');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const startAudioRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (perm.status !== 'granted') {
        alert('Необходим доступ к микрофону!');
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordSeconds(0);
      recordInterval.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopAudioRecording = async (shouldSend: boolean) => {
    if (recordInterval.current) clearInterval(recordInterval.current);

    try {
      await recorder.stop();
      const uri = recorder.uri;

      if (shouldSend && uri) {
        setIsUploading(true);
        const duration = recordSeconds;
        const uploadRes = await api.messaging.uploadAttachment(uri, 'audio/m4a', 'audio.m4a');
        onSendMedia({
          message_type: 'audio',
          file_url: uploadRes.file_url,
          duration,
        });
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartCamera = async () => {
    setShowOptions(false);
    if (!permission || !permission.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        alert('Необходим доступ к камере!');
        return;
      }
    }
    setShowCamera(true);
  };

  const handleRecordVideo = async () => {
    if (cameraRef.current) {
      if (cameraRecording) {
        await cameraRef.current.stopRecording();
      } else {
        try {
          setCameraRecording(true);
          const videoPromise = cameraRef.current.recordAsync({
            maxDuration: 15,
            quality: '480p',
          });
          const video = await videoPromise;
          setCameraRecording(false);
          setShowCamera(false);

          if (video && video.uri) {
            setIsUploading(true);
            const uploadRes = await api.messaging.uploadAttachment(
              video.uri,
              'video/mp4',
              'video.mp4'
            );
            onSendMedia({
              message_type: 'video_note',
              file_url: uploadRes.file_url,
              duration: 15,
            });
          }
        } catch (err) {
          console.error('Failed to record video', err);
          setCameraRecording(false);
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  return (
    <View style={[styles.composerContainer, { paddingBottom }]}>
      {/* Sticker Selector Panel */}
      {showStickers && (
        <View style={styles.stickerPanel}>
          <View style={styles.stickerPanelHeader}>
            <Text style={styles.stickerPanelTitle}>Выберите стикер</Text>
            <TouchableOpacity onPress={() => setShowStickers(false)}>
              <Text style={styles.stickerClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.stickerRow}>
            {STICKERS.map((st) => (
              <TouchableOpacity
                key={st.id}
                style={styles.stickerItem}
                onPress={() => {
                  onSendMedia({
                    message_type: 'sticker',
                    file_url: st.url,
                    sticker_id: st.id,
                  });
                  setShowStickers(false);
                }}
              >
                <Image source={{ uri: st.url }} style={styles.stickerImg} contentFit="contain" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Main Composer Row */}
      <View style={styles.composer}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowOptions(!showOptions)}>
          <Text style={styles.icon}>+</Text>
        </TouchableOpacity>

        {isRecording ? (
          <View style={styles.recordingRow}>
            <Text style={styles.recordingText}>🎙 Запись: {recordSeconds}с</Text>
            <TouchableOpacity
              style={styles.recordCancelBtn}
              onPress={() => stopAudioRecording(false)}
            >
              <Text style={styles.recordCancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder="Сообщение или отчёт…"
            placeholderTextColor={COLORS.textFaint}
            multiline
            maxLength={4000}
          />
        )}

        <TouchableOpacity
          style={[styles.iconBtn, (hasText || isRecording) && styles.sendBtnActive]}
          onPress={hasText ? onSend : isRecording ? () => stopAudioRecording(true) : startAudioRecording}
          disabled={isSending || isUploading}
        >
          {isSending || isUploading ? (
            <ActivityIndicator color={COLORS.amber} size="small" />
          ) : hasText ? (
            <Text style={styles.sendIcon}>➔</Text>
          ) : isRecording ? (
            <Text style={styles.sendIcon}>✓</Text>
          ) : (
            <Text style={styles.icon}>🎤</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Attachment Options Drawer */}
      {showOptions && (
        <View style={styles.optionsDrawer}>
          <TouchableOpacity style={styles.optionItem} onPress={handlePickImage}>
            <Text style={styles.optionIcon}>🖼</Text>
            <Text style={styles.optionText}>Фото из галереи</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionItem} onPress={handleStartCamera}>
            <Text style={styles.optionIcon}>📹</Text>
            <Text style={styles.optionText}>Видеокружочек</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => {
              setShowOptions(false);
              setShowStickers(true);
            }}
          >
            <Text style={styles.optionIcon}>👾</Text>
            <Text style={styles.optionText}>Стикер</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Round Video Camera Modal */}
      {showCamera && (
        <Modal transparent animationType="fade">
          <View style={styles.cameraModalContainer}>
            <View style={styles.cameraWrapper}>
              <CameraView ref={cameraRef} style={styles.cameraView} mode="video" facing="front" />
            </View>
            <Text style={styles.cameraTimer}>
              {cameraRecording ? '🔴 Запись кружочка...' : 'Готов к записи'}
            </Text>
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={[styles.cameraBtn, cameraRecording && styles.cameraBtnActive]}
                onPress={handleRecordVideo}
              >
                <Text style={styles.cameraBtnText}>{cameraRecording ? 'Стоп' : 'Старт'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cameraCancelBtn}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.cameraCancelBtnText}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  composerContainer: {
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: '#ECE7DD',
  },
  composer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F4F1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ECE7DD',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 8,
    maxHeight: 100,
    backgroundColor: '#FCFAF5',
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontFamily: FONTS.body,
  },
  sendBtnActive: {
    backgroundColor: COLORS.amber,
  },
  sendIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
  recordingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(183, 136, 69, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#F4EAD4',
  },
  recordingText: {
    fontSize: 12.5,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.amber,
  },
  recordCancelBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  recordCancelText: {
    fontSize: 11.5,
    color: COLORS.warn,
    fontFamily: FONTS.bodyMedium,
  },
  optionsDrawer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    backgroundColor: '#FCFAF5',
    borderTopWidth: 1,
    borderTopColor: '#ECE7DD',
  },
  optionItem: {
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodyMedium,
  },
  stickerPanel: {
    padding: 12,
    backgroundColor: '#FCFAF5',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE7DD',
  },
  stickerPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stickerPanelTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodySemiBold,
  },
  stickerClose: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  stickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stickerItem: {
    padding: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECE7DD',
  },
  stickerImg: {
    width: 60,
    height: 60,
  },
  cameraModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraWrapper: {
    width: 260,
    height: 260,
    borderRadius: 130,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.amber,
    marginBottom: 20,
    backgroundColor: '#000',
  },
  cameraView: {
    width: '100%',
    height: '100%',
  },
  cameraTimer: {
    color: '#fff',
    fontSize: 15,
    fontFamily: FONTS.bodySemiBold,
    marginBottom: 30,
  },
  cameraControls: {
    flexDirection: 'row',
    gap: 20,
  },
  cameraBtn: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    backgroundColor: COLORS.amber,
  },
  cameraBtnActive: {
    backgroundColor: COLORS.warn,
  },
  cameraBtnText: {
    color: '#fff',
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
  },
  cameraCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  cameraCancelBtnText: {
    color: '#fff',
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
  },
});
