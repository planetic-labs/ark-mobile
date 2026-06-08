import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { materialsStyles as styles } from './materialsStyles';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { COLORS, FONTS } from '../../constants/Config';

type ViewMode = 'menu' | 'audio' | 'quotes';

export default function MaterialsScreen() {
  const [mode, setMode] = useState<ViewMode>('menu');

  const quotes = [
    { id: '1', text: "Усилие — это не напряжение тела, а возвращение внимания.", source: "Сатсанг 13.08", time: "14:20" },
    { id: '2', text: "Не пытайтесь «сделать» состояние. Будьте тем, кто замечает.", source: "Сатсанг 19.07", time: "08:45" },
    { id: '3', text: "Внимание — единственная опора, которая не зависит от внешних обстоятельств.", source: "Гудение и Опора", time: "22:10" }
  ];

  if (mode === 'quotes') {
    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setMode('menu')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Назад</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Цитатник</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {quotes.map((q) => (
            <View key={q.id} style={styles.quoteCard}>
              <Text style={styles.quoteText}>«{q.text}»</Text>
              <View style={styles.quoteMeta}>
                <Text style={styles.quoteSource}>{q.source}</Text>
                <Text style={styles.quoteTime}>{q.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (mode === 'audio') {
    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setMode('menu')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Назад</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Аудиозаписи</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.playerCard}>
            <Text style={styles.playerTitle}>Практика Гудения</Text>
            <Text style={styles.playerSubtitle}>Утренняя сессия · 15 минут</Text>
            
            <View style={styles.progressLineBg}>
              <View style={[styles.progressLine, { width: '45%' }]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>06:45</Text>
              <Text style={styles.timeText}>15:00</Text>
            </View>

            <View style={styles.controlsRow}>
              <TouchableOpacity style={styles.controlBtn}>
                <Text style={styles.controlText}>◀◀</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, styles.playBtn]}>
                <Text style={styles.playText}>▶</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn}>
                <Text style={styles.controlText}>▶▶</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.playlistTitle}>Плейлист практик</Text>
          <View style={styles.audioRow}>
            <Text style={styles.audioNum}>01</Text>
            <Text style={styles.audioName}>Настройка внимания</Text>
            <Text style={styles.audioDuration}>12:30</Text>
          </View>
          <View style={styles.audioRow}>
            <Text style={styles.audioNum}>02</Text>
            <Text style={styles.audioName}>Гудение до 15:40</Text>
            <Text style={styles.audioDuration}>15:00</Text>
          </View>
          <View style={styles.audioRow}>
            <Text style={styles.audioNum}>03</Text>
            <Text style={styles.audioName}>Вечерняя тишина</Text>
            <Text style={styles.audioDuration}>20:15</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerInfo}>
          <Text style={styles.subtitle}>что изучаем сейчас</Text>
        </View>

        {/* Audio Card */}
        <TouchableOpacity style={styles.sheetItem} onPress={() => setMode('audio')}>
          <View style={styles.siIcon}>
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path d="M4 12V8a6 6 0 0112 0v4" stroke={COLORS.amber} strokeWidth={1.7} />
              <Rect x={2.5} y={11} width={4} height={6.5} rx={1.8} stroke={COLORS.amber} strokeWidth={1.7} />
              <Rect x={13.5} y={11} width={4} height={6.5} rx={1.8} stroke={COLORS.amber} strokeWidth={1.7} />
            </Svg>
          </View>
          <View style={styles.siBody}>
            <Text style={styles.siName}>Аудио</Text>
            <Text style={styles.siDesc}>плейлисты практик и архива · последовательно и точечно</Text>
          </View>
          <View style={styles.siChevron}>
            <Svg width={17} height={17} viewBox="0 0 17 17" fill="none">
              <Path d="M6 3.5l5 4.5-5 4.5" stroke={COLORS.textSecondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
        </TouchableOpacity>

        {/* Quotes Card */}
        <TouchableOpacity style={styles.sheetItem} onPress={() => setMode('quotes')}>
          <View style={styles.siIcon}>
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path d="M6 3.5h8a2 2 0 012 2v11l-3-2-3 2-3-2-3 2-3-2-3 2v-11a2 2 0 012-2z" stroke={COLORS.amber} strokeWidth={1.6} strokeLinejoin="round" />
              <Path d="M8 7.5h4M8 10.5h4" stroke={COLORS.amber} strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
          </View>
          <View style={styles.siBody}>
            <Text style={styles.siName}>Цитатник</Text>
            <Text style={styles.siDesc}>цитаты Мастера из видео · с источником и таймингом</Text>
          </View>
          <View style={styles.siChevron}>
            <Svg width={17} height={17} viewBox="0 0 17 17" fill="none">
              <Path d="M6 3.5l5 4.5-5 4.5" stroke={COLORS.textSecondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

