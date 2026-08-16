import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getResetProgress, ResetProgress } from '@/lib/reset-service';

const C = { ink: '#19201D', muted: '#68716C', cream: '#F8F6F0', card: '#FFFFFF', green: '#215C48', greenSoft: '#E5EFEA', coral: '#F0785E', border: '#E7E5DE' };

export default function ProgressScreen() {
  const [progress, setProgress] = useState<ResetProgress>({ completedResets: 0, completedMinutes: 0, latest: null });
  useFocusEffect(useCallback(() => { getResetProgress().then(setProgress).catch(() => {}); }, []));
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>YOUR PROGRESS</Text><Text style={styles.title}>Small resets add up.</Text>
        <View style={styles.streakCard}>
          <View style={styles.streakIcon}><Ionicons name="sparkles" size={28} color={C.coral} /></View>
          <Text style={styles.streakNumber}>{progress.completedResets ? 1 : 0}</Text><Text style={styles.streakLabel}>day reset streak</Text><Text style={styles.streakHint}>{progress.completedResets ? 'Your momentum has started.' : 'Complete your first reset to begin.'}</Text>
        </View>
        <Text style={styles.sectionLabel}>THIS WEEK</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}><Ionicons name="checkmark-circle-outline" size={24} color={C.green} /><Text style={styles.statNumber}>{progress.completedResets}</Text><Text style={styles.statLabel}>Resets</Text></View>
          <View style={styles.statCard}><Ionicons name="time-outline" size={24} color={C.green} /><Text style={styles.statNumber}>{progress.completedMinutes}</Text><Text style={styles.statLabel}>Minutes</Text></View>
        </View>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}><Ionicons name="images-outline" size={26} color={C.green} /></View>
          <Text style={styles.emptyTitle}>{progress.latest ? progress.latest.title : 'Your resets will live here'}</Text><Text style={styles.emptyText}>{progress.latest ? `${progress.latest.roomType} · ${progress.latest.minutes} minutes · Completed today` : 'Before-and-after photos and completed sessions will appear after your first reset.'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.cream }, content: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 36 },
  eyebrow: { color: C.coral, fontSize: 13, fontWeight: '800', letterSpacing: 2.1 }, title: { color: C.ink, fontSize: 30, fontWeight: '700', letterSpacing: -0.8, marginTop: 7, marginBottom: 25 },
  streakCard: { backgroundColor: C.green, borderRadius: 22, padding: 24, alignItems: 'center', marginBottom: 28 }, streakIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  streakNumber: { color: '#FFFFFF', fontSize: 48, fontWeight: '700', lineHeight: 55 }, streakLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }, streakHint: { color: '#C9DCD4', fontSize: 13, marginTop: 8 },
  sectionLabel: { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.1, marginBottom: 12 }, statsRow: { flexDirection: 'row', gap: 10, marginBottom: 26 },
  statCard: { flex: 1, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 17 }, statNumber: { color: C.ink, fontSize: 27, fontWeight: '700', marginTop: 13 }, statLabel: { color: C.muted, fontSize: 13, marginTop: 2 },
  emptyCard: { backgroundColor: C.greenSoft, borderRadius: 20, padding: 22, alignItems: 'center' }, emptyIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', marginBottom: 13 }, emptyTitle: { color: C.ink, fontSize: 17, fontWeight: '700', marginBottom: 7 }, emptyText: { color: C.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
