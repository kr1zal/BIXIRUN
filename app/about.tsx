import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const SUPPORT_EMAIL = 'support@bixirun.ru';

export default function AboutAppScreen() {
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const openMail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#F5F5F5' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/profile')} style={styles.headerBack}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>О приложении</Text>
          <View style={styles.headerBack} />
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.appName}>BIXIRUN</Text>
          <Text style={styles.meta}>Версия {version}</Text>
          <Text style={styles.meta}>© {new Date().getFullYear()} ООО «СИСТЕМНЫЕ РЕШЕНИЯ»</Text>

          <TouchableOpacity style={styles.mailRow} onPress={openMail} activeOpacity={0.85}>
            <Ionicons name="mail-outline" size={20} color="#2196f3" />
            <Text style={styles.mailText}>{SUPPORT_EMAIL}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Документы</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/legal/terms')}
            activeOpacity={0.85}
          >
            <Ionicons name="document-text-outline" size={20} color="#333" />
            <Text style={styles.linkText}>Пользовательское соглашение</Text>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/legal/privacy')}
            activeOpacity={0.85}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#333" />
            <Text style={styles.linkText}>Политика конфиденциальности</Text>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        </View>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  appName: { fontSize: 24, fontWeight: '700', marginBottom: 6 },
  meta: { color: '#666', marginBottom: 4 },
  mailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  mailText: { color: '#2196f3', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  linkText: { flex: 1, fontSize: 16 },
});


