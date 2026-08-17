import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBackend } from '@/lib/backend-context';
import { getPlanAccess } from '@/lib/purchases';

const COLORS = { ink: '#19201D', muted: '#68716C', cream: '#F8F6F0', card: '#FFFFFF', green: '#215C48', greenSoft: '#E5EFEA', coral: '#F0785E', border: '#E7E5DE' };
const goals = [
  { id: 'quick', label: 'Quick Reset', icon: 'flash-outline' },
  { id: 'guest', label: 'Guest Ready', icon: 'people-outline' },
  { id: 'calm', label: 'Clear My Head', icon: 'sparkles-outline' },
  { id: 'function', label: 'Make It Functional', icon: 'grid-outline' },
] as const;
const times = [5, 10, 20] as const;

export default function HomeScreen() {
  const [selectedTime, setSelectedTime] = useState<number>(10);
  const [selectedGoal, setSelectedGoal] = useState<string>('quick');
  const { status: backendStatus } = useBackend();
  const [access, setAccess] = useState<{ pro: boolean; remaining: number | null; canCreate: boolean } | null>(null);
  useFocusEffect(useCallback(() => { getPlanAccess().then(setAccess).catch(() => {}); }, []));
  async function beginReset() {
    const latest = await getPlanAccess().catch(() => access);
    if (latest && !latest.canCreate) return router.push('/paywall');
    router.push({ pathname: '/camera', params: { minutes: selectedTime, goal: selectedGoal } });
  }
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>RESET</Text><Text style={styles.title}>Make space to breathe.</Text></View>
          <Pressable accessibilityLabel="Open app health" onPress={() => router.push('/insights')} style={styles.profileButton}><Ionicons name="pulse-outline" size={22} color={COLORS.ink} /><View accessibilityLabel={`Backend ${backendStatus}`} style={[styles.statusDot, backendStatus === 'connected' ? styles.statusConnected : backendStatus === 'error' ? styles.statusError : styles.statusConnecting]} /></Pressable>
        </View>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}><Ionicons name="camera-outline" size={28} color={COLORS.green} /></View>
          <View style={styles.heroCopy}><Text style={styles.heroTitle}>One photo. One simple plan.</Text><Text style={styles.heroText}>Reset finds the few tasks that will make the biggest visible difference.</Text></View>
        </View>
        <Pressable onPress={() => router.push('/paywall')} style={styles.accessBar}><View><Text style={styles.accessTitle}>{access?.pro ? 'Reset Pro is active' : `${access?.remaining ?? 3} free AI plans remaining`}</Text><Text style={styles.accessText}>{access?.pro ? 'Unlimited room resets' : 'Try Reset before choosing a plan'}</Text></View><Text style={styles.accessAction}>{access?.pro ? 'PRO' : 'See Pro'}</Text></Pressable>
        <Text style={styles.sectionLabel}>HOW MUCH TIME DO YOU HAVE?</Text>
        <View style={styles.timeRow}>
          {times.map((time) => { const selected = selectedTime === time; return (
            <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={time} onPress={() => setSelectedTime(time)} style={[styles.timeButton, selected && styles.timeButtonSelected]}>
              <Text style={[styles.timeNumber, selected && styles.timeTextSelected]}>{time}</Text><Text style={[styles.timeUnit, selected && styles.timeTextSelected]}>min</Text>
            </Pressable>
          ); })}
        </View>
        <Text style={styles.sectionLabel}>WHAT DO YOU NEED?</Text>
        <View style={styles.goalGrid}>
          {goals.map((goal) => { const selected = selectedGoal === goal.id; return (
            <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={goal.id} onPress={() => setSelectedGoal(goal.id)} style={[styles.goalCard, selected && styles.goalCardSelected]}>
              <View style={[styles.goalIcon, selected && styles.goalIconSelected]}><Ionicons name={goal.icon} size={22} color={selected ? COLORS.green : COLORS.muted} /></View>
              <Text style={[styles.goalText, selected && styles.goalTextSelected]}>{goal.label}</Text>
              {selected && <Ionicons name="checkmark-circle" size={20} color={COLORS.green} style={styles.check} />}
            </Pressable>
          ); })}
        </View>
        <Pressable accessibilityRole="button" onPress={beginReset} style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
          <Ionicons name="camera" size={21} color="#FFFFFF" /><Text style={styles.primaryButtonText}>Take a room photo</Text><Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.privacyNote}><Ionicons name="lock-closed-outline" size={13} color={COLORS.muted} />{' '}Your room photo stays private.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream }, content: { paddingHorizontal: 22, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 18, marginBottom: 24 },
  eyebrow: { color: COLORS.coral, fontSize: 13, fontWeight: '800', letterSpacing: 2.4 },
  title: { color: COLORS.ink, fontSize: 30, fontWeight: '700', letterSpacing: -0.8, marginTop: 7 },
  profileButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  statusDot: { position: 'absolute', right: 1, bottom: 1, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: COLORS.card }, statusConnected: { backgroundColor: '#37A56B' }, statusError: { backgroundColor: '#D65C4A' }, statusConnecting: { backgroundColor: '#E0A43A' },
  heroCard: { flexDirection: 'row', backgroundColor: COLORS.greenSoft, borderRadius: 20, padding: 18, marginBottom: 12 },
  heroIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  heroCopy: { flex: 1 }, heroTitle: { color: COLORS.ink, fontSize: 17, fontWeight: '700', marginBottom: 5 }, heroText: { color: COLORS.muted, fontSize: 14, lineHeight: 20 },
  accessBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 25 }, accessTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '700' }, accessText: { color: COLORS.muted, fontSize: 11, marginTop: 2 }, accessAction: { color: COLORS.green, fontSize: 12, fontWeight: '800' },
  sectionLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.1, marginBottom: 12 },
  timeRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  timeButton: { flex: 1, height: 70, borderRadius: 17, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 4 },
  timeButtonSelected: { backgroundColor: COLORS.green, borderColor: COLORS.green }, timeNumber: { color: COLORS.ink, fontSize: 25, fontWeight: '700' }, timeUnit: { color: COLORS.muted, fontSize: 13, fontWeight: '600' }, timeTextSelected: { color: '#FFFFFF' },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 26 },
  goalCard: { width: '48.5%', minHeight: 112, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 14 },
  goalCardSelected: { borderColor: COLORS.green, borderWidth: 2, padding: 13 },
  goalIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F2F1EC', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, goalIconSelected: { backgroundColor: COLORS.greenSoft },
  goalText: { color: COLORS.ink, fontSize: 14, fontWeight: '600', lineHeight: 18, paddingRight: 12 }, goalTextSelected: { color: COLORS.green }, check: { position: 'absolute', right: 11, top: 11 },
  primaryButton: { height: 58, borderRadius: 17, backgroundColor: COLORS.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }, primaryButtonPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] }, primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  privacyNote: { color: COLORS.muted, fontSize: 12, textAlign: 'center', marginTop: 13 },
});
