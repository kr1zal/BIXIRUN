import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Section = { id: string; title: string; body: string[] };

const sections: Section[] = [
  {
    id: 'intro',
    title: 'Введение',
    body: [
      'Перед использованием приложения «BIXIRUN» (далее — Программа) внимательно ознакомьтесь с условиями настоящей Лицензии.',
      'Любое использование Программы означает полное и безоговорочное принятие условий настоящей Лицензии.'
    ]
  },
  {
    id: 'holder',
    title: '1. Правообладатель',
    body: [
      'ООО «СИСТЕМНЫЕ РЕШЕНИЯ», ИНН 5700009897, ОГРН 1245700002514, адрес: 302027, Орловская область, г. Орёл.'
    ]
  },
  {
    id: 'subject',
    title: '2. Предмет Лицензии',
    body: [
      'Правообладатель предоставляет Пользователю простую (неисключительную) лицензию на использование Программы в личных некоммерческих целях в соответствии с её функционалом.'
    ]
  },
  {
    id: 'usage',
    title: '3. Способы использования',
    body: [
      '• установка и запуск Программы на мобильном устройстве Пользователя;',
      '• использование функционала Программы согласно документации.'
    ]
  },
  {
    id: 'limits',
    title: '4. Ограничения',
    body: [
      'Пользователь не вправе модифицировать или декомпилировать Программу; распространять Программу в коммерческих целях без письменного согласия Правообладателя; удалять или изменять сведения о Правообладателе.'
    ]
  },
  {
    id: 'account',
    title: '5. Регистрация и аккаунт',
    body: [
      'Для доступа к части функционала может потребоваться регистрация аккаунта. Пользователь обязан предоставить достоверные данные.',
      'Пользователь может удалить аккаунт из раздела «Профиль» — при подтверждении данные аккаунта будут удалены в разумный срок согласно Политике конфиденциальности.'
    ]
  },
  {
    id: 'liability',
    title: '6. Ответственность',
    body: [
      'Программа предоставляется «как есть». Правообладатель не гарантирует безошибочную и бесперебойную работу Программы и не несёт ответственности за любой прямой или косвенный ущерб, возникший вследствие использования Программы.'
    ]
  },
  {
    id: 'support',
    title: '7. Поддержка',
    body: ['Вопросы и обращения направляйте на e-mail: support@bixirun.ru.']
  },
  {
    id: 'law',
    title: '8. Применимое право',
    body: [
      'Настоящая Лицензия регулируется законодательством Российской Федерации.',
      'Актуальная версия Лицензии доступна в разделе «О приложении».',
    ]
  }
];

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [anchors, setAnchors] = useState<Record<string, number>>({});

  const handleAnchorLayout = (id: string, y: number) => {
    setAnchors((prev) => ({ ...prev, [id]: y }));
  };

  const scrollTo = (id: string) => {
    const y = anchors[id] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
  };
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#F5F5F5' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/about')} style={styles.headerBack}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Пользовательское соглашение</Text>
          <View style={styles.headerBack} />
        </View>
      </SafeAreaView>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}
      >
        {/* Оглавление */}
        <View style={styles.tocCard}>
          <Text style={styles.tocTitle}>Оглавление</Text>
          {sections.map((s) => (
            <TouchableOpacity key={s.id} style={styles.tocItem} onPress={() => scrollTo(s.id)}>
              <Text style={styles.tocText}>{s.title}</Text>
              <Ionicons name="chevron-forward" size={16} color="#1976d2" style={styles.tocIcon} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Секции */}
        {sections.map((s) => (
          <View
            key={s.id}
            onLayout={(e) => handleAnchorLayout(s.id, e.nativeEvent.layout.y)}
            style={styles.section}
          >
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


