import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Image,
  View,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../hooks/useCart';

type MockCreatePaymentResponse = {
  payment_id: string;
  confirmation_url: string;
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
};

export default function CheckoutScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'sbp' | 'card' | 'yoomoney'>('card');
  const [sbpModalVisible, setSbpModalVisible] = useState(false);
  const [recipientModalVisible, setRecipientModalVisible] = useState(false);
  const [recipientName, setRecipientName] = useState<string>('Александр Виноградов');
  const [recipientPhone, setRecipientPhone] = useState<string>('+7 905 167‑86‑23');
  const [promo, setPromo] = useState<string>('');
  const insets = useSafeAreaInsets();
  const { cartItems, cartSummary } = useCart();

  // Swipe-to-dismiss for Recipient bottom sheet
  const recipientTranslateY = useRef(new Animated.Value(0)).current;
  const recipientPanResponder = useRef(
    PanResponder.create({
       onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 5 && Math.abs(g.dy) > Math.abs(g.dx),
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderMove: (_e, g) => {
        if (g.dy > 0) recipientTranslateY.setValue(g.dy);
      },
      onPanResponderRelease: (_e, g) => {
        const shouldClose = g.dy > 90 || g.vy > 0.8;
        if (shouldClose) {
          Animated.timing(recipientTranslateY, {
            toValue: 500,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            recipientTranslateY.setValue(0);
            setRecipientModalVisible(false);
          });
        } else {
          Animated.spring(recipientTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(recipientTranslateY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
      },
    })
  ).current;

  const orderSummary = useMemo(() => ({
    currency: 'RUB',
    total: cartSummary.total,
    items: cartItems.map((it: { product: { name: string; price: string }; quantity: number }) => ({
      name: it.product.name,
      qty: it.quantity,
      price: parseFloat(it.product.price),
    })),
  }), [cartItems, cartSummary.total]);

  const mockCreatePayment = useCallback(async (): Promise<MockCreatePaymentResponse> => {
    // Мок ответа YooKassa /payments с confirmation.type=redirect
    await new Promise((r) => setTimeout(r, 500));
    return {
      payment_id: 'mock-payment-id',
      confirmation_url: 'https://example.org/mock-yookassa-checkout',
      status: 'pending',
    };
  }, []);

  const handlePayByCard = useCallback(async () => {
    try {
      setLoading(true);
      // В реале: POST Edge Function /payments/create { type: 'bank_card' }
      const res = await mockCreatePayment();
      if (!res.confirmation_url) {
        Alert.alert('Ошибка', 'Не удалось получить ссылку оплаты');
        return;
      }
      await Linking.openURL(res.confirmation_url);
      Alert.alert('Оплата', 'Мок: открылся экран YooKassa (redirect).');
      router.replace('/');
    } catch (_e) {
      Alert.alert('Ошибка', 'Не удалось инициировать оплату');
    } finally {
      setLoading(false);
    }
  }, [mockCreatePayment, router]);

  const _handlePayBySBP = useCallback(() => {
    // В нашем UX сначала открываем выбор банка (модалка), а переход к банку осуществим после выбора
    setSbpModalVisible(true);
  }, []);

  const handlePay = useCallback(async () => {
    if (selectedMethod === 'sbp') {
      setSbpModalVisible(true);
      return;
    }
    if (selectedMethod === 'card') {
      await handlePayByCard();
      return;
    }
    // YooMoney заглушка
    try {
      setLoading(true);
      const res = await mockCreatePayment();
      await Linking.openURL(res.confirmation_url);
      Alert.alert('YooMoney', 'Мок: открыта платёжная страница YooMoney.');
      router.replace('/');
    } catch (_e) {
      Alert.alert('Ошибка', 'Не удалось инициировать оплату');
    } finally {
      setLoading(false);
    }
  }, [handlePayByCard, mockCreatePayment, router, selectedMethod]);

  return (
    <ThemedView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 8, 20) }]}>
          <View style={styles.headerRow}>
            <Pressable hitSlop={10} onPress={() => router.replace('/cart' as never)} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#111827" />
            </Pressable>
            <ThemedText style={[styles.titleText]}>Оформление заказа</ThemedText>
            <View style={{ width: 22 }} />
          </View>

          {/* Получатель */}
          <Section title="Получатель">
            <Pressable style={styles.recipientRow} onPress={() => setRecipientModalVisible(true)}>
              <View>
                <ThemedText style={[styles.textDefault, styles.recipientName]}>{recipientName}</ThemedText>
                <ThemedText style={[styles.textMuted, styles.recipientPhone]}>{recipientPhone}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9AA0A6" />
            </Pressable>
          </Section>

          {/* Способ оплаты */}
          <Section title="Способ оплаты">
            <View style={styles.methodsRow}>
              <MethodTile
                label="СБП"
                selected={selectedMethod === 'sbp'}
                onPress={() => setSelectedMethod('sbp')}
                icon={<SbpLogo />}
              />
              <MethodTile
                label="Картой онлайн"
                selected={selectedMethod === 'card'}
                onPress={() => setSelectedMethod('card')}
                icon={<Ionicons name="card-outline" size={20} color="#1A73E8" />}
                labelStyle={{ fontWeight: '400', fontSize: 14 }}
              />
              <MethodTile
                label="YooMoney"
                selected={selectedMethod === 'yoomoney'}
                onPress={() => setSelectedMethod('yoomoney')}
                icon={<Ionicons name="wallet-outline" size={20} color="#1A73E8" />}
              />
            </View>
          </Section>

          {/* Баллы/Бонусы - мок */}
          <Section title="Баллы и бонусы">
            <View style={styles.segmentRow}>
              <Segment selected>Не списывать</Segment>
              <Segment>Списать 600</Segment>
            </View>
          </Section>

          {/* Промокод */}
          <Section title="Промокод или сертификат">
            <TextInput
              value={promo}
              onChangeText={setPromo}
              placeholder="Введите промокод"
              placeholderTextColor="#9AA0A6"
              style={styles.input}
              autoCapitalize="characters"
            />
          </Section>

          {/* Состав заказа */}
          <Section title="Ваш заказ">
            {orderSummary.items.map((it: { name: string; qty: number; price: number }, idx: number) => (
              <View key={idx} style={styles.itemRow}>
                <ThemedText style={styles.textDefault}>{it.name} × {it.qty}</ThemedText>
                <ThemedText style={styles.textDefault}>{it.price.toFixed(2)} {orderSummary.currency}</ThemedText>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <ThemedText style={styles.totalText}>Итого</ThemedText>
              <ThemedText style={styles.totalText}>{Number(orderSummary.total).toFixed(2)} {orderSummary.currency}</ThemedText>
            </View>
          </Section>

          <Pressable style={styles.payButton} onPress={handlePay} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.payButtonText}>
                {selectedMethod === 'sbp' ? 'Оплатить СБП' : 'Оплатить онлайн'}
              </ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Модалка выбора банка СБП */}
      <Modal visible={sbpModalVisible} animationType="slide" transparent onRequestClose={() => setSbpModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ThemedText type="subtitle" style={{ marginBottom: 8 }}>Выберите банк для оплаты</ThemedText>
            <ThemedText style={{ color: '#5F6368', marginBottom: 12 }}>После выбора вы перейдёте в приложение банка</ThemedText>
            {['Сбербанк', 'Т‑Банк', 'АЛЬФА‑БАНК', 'ВТБ', 'Другой банк'].map((bank) => (
              <Pressable
                key={bank}
                style={styles.bankRow}
                onPress={async () => {
                  setSbpModalVisible(false);
                  await handlePayBySBPContinue(bank);
                }}
              >
                <ThemedText>{bank}</ThemedText>
                <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
              </Pressable>
            ))}
            <Pressable style={styles.modalClose} onPress={() => setSbpModalVisible(false)}>
              <ThemedText style={{ color: '#1A73E8', fontWeight: '600' }}>Отмена</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Модалка данных получателя */}
      <Modal visible={recipientModalVisible} animationType="slide" transparent onRequestClose={() => setRecipientModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: recipientTranslateY }] }]} {...recipientPanResponder.panHandlers}>
            <View style={styles.dragArea}>
              <View style={styles.modalHandle} />
            </View>
            <ThemedText type="subtitle" style={{ marginBottom: 12 }}>Данные получателя</ThemedText>
            <ThemedText style={styles.fieldLabel}>Имя и фамилия</ThemedText>
            <TextInput value={recipientName} onChangeText={setRecipientName} style={styles.input} placeholder="Иван Иванов" placeholderTextColor="#9AA0A6" />
            <ThemedText style={styles.fieldLabel}>Телефон</ThemedText>
            <TextInput value={recipientPhone} onChangeText={setRecipientPhone} style={styles.input} placeholder="+7 ..." placeholderTextColor="#9AA0A6" keyboardType="phone-pad" />
            <Pressable style={styles.saveButton} onPress={() => setRecipientModalVisible(false)}>
              <ThemedText style={styles.saveButtonText}>Сохранить</ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </ThemedView>
  );
}

async function handlePayBySBPContinue(_bank: string) {
  // Мок редиректа в приложение банка по СБП
  await new Promise((r) => setTimeout(r, 300));
  Alert.alert('СБП', 'Мок: переход в приложение банка.');
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function MethodTile({ label, selected, onPress, icon, labelStyle }: { label: string; selected: boolean; onPress: () => void; icon: React.ReactNode; labelStyle?: object }) {
  return (
    <Pressable onPress={onPress} style={[styles.methodTile, selected && styles.methodTileSelected]}
      android_ripple={{ color: '#E5E7EB' }}>
      <View style={[styles.methodIconBox, selected ? styles.methodIconBoxSelected : styles.methodIconBoxDefault]}>
        {icon}
      </View>
      <ThemedText style={[styles.methodLabel, labelStyle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function Segment({ children, selected = false }: { children: React.ReactNode; selected?: boolean }) {
  return (
    <View style={[styles.segment, selected && styles.segmentSelected]}>
      <ThemedText style={[styles.segmentText, selected && styles.segmentTextSelected]}>{children as string}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
    color: '#111827',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 22,
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 12,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recipientName: { fontWeight: '600' },
  recipientPhone: { color: '#5F6368', marginTop: 2 },
  methodsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  methodTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  methodTileSelected: {
    borderColor: '#1A73E8',
    backgroundColor: '#EEF5FF',
  },
  methodIconBox: { width: 56, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  methodIconBoxDefault: { borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  methodIconBoxSelected: { borderWidth: 2, borderColor: '#1A73E8', backgroundColor: '#FFFFFF' },
  methodLabel: { fontWeight: '600', textAlign: 'center', fontSize: 16, color: '#111827' },
  textDefault: { fontSize: 16, lineHeight: 24, color: '#111827' },
  textMuted: { fontSize: 16, lineHeight: 24, color: '#5F6368' },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    backgroundColor: '#F1F3F4',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentSelected: { backgroundColor: '#1A73E8' },
  segmentText: { color: '#3C4043', fontWeight: '500' },
  segmentTextSelected: { color: '#FFFFFF' },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalText: { fontSize: 20, fontWeight: '700', lineHeight: 24, color: '#111827' },
  payButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  payButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  sbpPayButton: {
    backgroundColor: '#F8F6EE',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
    borderWidth: 0,
  },
  sbpPayContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sbpPayText: { color: '#111827', fontWeight: '700', fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 8,
  },
  modalHandle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', marginBottom: 8 },
  dragArea: { paddingTop: 16, paddingBottom: 12 },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  modalClose: { alignSelf: 'center', paddingVertical: 8 },
  fieldLabel: { marginBottom: 6, color: '#5F6368' },
  saveButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 12,
  },
  saveButtonText: { color: '#FFFFFF', fontWeight: '600' },
});

function SbpLogo() {
  // Официальный PNG-логотип из assets
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const source = require('../assets/images/sbp-logo.png');
  return <Image source={source} style={{ width: 24, height: 24, resizeMode: 'contain' }} />;
}


