import { Stack, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Section = { id: string; title: string; body: string[] };

const sections: Section[] = [
  {
    id: 'operator',
    title: '1. Оператор персональных данных',
    body: [
      'ООО «СИСТЕМНЫЕ РЕШЕНИЯ», ИНН 5700009897, ОГРН 1245700002514, адрес: 302027, Орловская область, г. Орёл, e-mail: support@bixirun.ru.'
    ]
  },
  {
    id: 'data',
    title: '2. Какие данные обрабатываются',
    body: [
      '• данные аккаунта (e-mail, имя/ник);',
      '• данные, которые вы явно загружаете (например, фото/видео для аватара);',
      '• технические данные устройства и журналов ОС (для диагностики стабильности);',
      '• разрешения Камеры/Микрофона/Медиатеки используются только по вашему действию.'
    ]
  },
  {
    id: 'purpose',
    title: '3. Цели обработки',
    body: ['Предоставление функциональности Программы, поддержка пользователей, безопасность и диагностика.']
  },
  {
    id: 'law',
    title: '4. Правовые основания',
    body: ['Согласие пользователя и/или исполнение договора (оказание услуг в рамках функционала Программы).']
  },
  {
    id: 'storage',
    title: '5. Хранение и удаление',
    body: ['Данные хранятся в объёме и сроках, необходимых для целей обработки. Аккаунт и связанные данные могут быть удалены из раздела «Профиль» → «Удалить аккаунт».']
  },
  {
    id: 'transfer',
    title: '6. Передача третьим лицам и трансграничная передача',
    body: ['Данные не передаются третьим лицам, за исключением случаев, предусмотренных законом. Программа использует облачную инфраструктуру (бэкенд), включая хранение за пределами страны пользователя, при соблюдении необходимых мер защиты.']
  },
  {
    id: 'rights',
    title: '7. Права пользователя',
    body: ['Вы вправе запросить доступ, исправление, удаление, а также отзыв согласия. Обращения направляйте на support@bixirun.ru.']
  },
  {
    id: 'update',
    title: '8. Обновления политики',
    body: ['Актуальная версия Политики доступна в разделе «О приложении».']
  }
];

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [anchors, setAnchors] = useState<Record<string, number>>({});

  const handleAnchorLayout = (id: string, y: number) => setAnchors((p) => ({ ...p, [id]: y }));
  const scrollTo = (id: string) => scrollRef.current?.scrollTo({ y: Math.max(0, (anchors[id] ?? 0) - 8), animated: true });
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#F5F5F5' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/about')} style={styles.headerBack}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Политика конфиденциальности</Text>
          <View style={styles.headerBack} />
        </View>
      </SafeAreaView>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}
      >
        <View style={styles.tocCard}>
          <Text style={styles.tocTitle}>Оглавление</Text>
          {sections.map((s) => (
            <TouchableOpacity key={s.id} style={styles.tocItem} onPress={() => scrollTo(s.id)}>
              <Text style={styles.tocText}>{s.title}</Text>
              <Ionicons name="chevron-forward" size={16} color="#1976d2" style={styles.tocIcon} />
            </TouchableOpacity>
          ))}
        </View>

        {sections.map((s) => (
          <View key={s.id} onLayout={(e) => handleAnchorLayout(s.id, e.nativeEvent.layout.y)} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            {s.body.map((p, idx) => (
              <Text key={idx} style={styles.paragraph}>{p}</Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#F5F5F5',
    borderBottomColor: '#E0E0E0',
    borderBottomWidth: 1,
  },
  headerBack: { padding: 4, width: 24 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: { padding: 16 },
  tocCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  tocTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  tocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tocText: { color: '#1976d2', fontSize: 15, flex: 1 },
  tocIcon: { marginLeft: 8 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  paragraph: { fontSize: 16, lineHeight: 23, color: '#222', marginBottom: 8 },
  md: { fontSize: 16, lineHeight: 22, color: '#222' },
});


