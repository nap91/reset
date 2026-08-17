import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getHealthMetrics, HealthMetrics } from '@/lib/analytics';

const C = { ink: '#19201D', muted: '#68716C', cream: '#F8F6F0', card: '#FFFFFF', green: '#215C48', greenSoft: '#E5EFEA', coral: '#F0785E', border: '#E7E5DE' };

export default function InsightsScreen() {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  useEffect(() => { getHealthMetrics().then(setMetrics).catch(() => setMetrics({ events: 0, aiRuns: 0, aiSuccessRate: 0, averageLatencyMs: 0, totalTokens: 0, appErrors: 0 })); }, []);
  return <SafeAreaView style={styles.page} edges={['top']}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={23} color={C.ink} /></Pressable><Text style={styles.headerTitle}>App health</Text><View style={styles.spacer} /></View>
    <ScrollView contentContainerStyle={styles.content}><Text style={styles.eyebrow}>PRIVATE MVP METRICS</Text><Text style={styles.title}>Know what’s working.</Text><Text style={styles.copy}>These measurements contain usage numbers—not room photos or AI plan text.</Text>
      {!metrics ? <ActivityIndicator color={C.green} size="large" style={styles.loading} /> : <>
        <Text style={styles.section}>AI PERFORMANCE</Text><View style={styles.grid}><Metric icon="sparkles-outline" value={`${metrics.aiSuccessRate}%`} label="Success rate" /><Metric icon="time-outline" value={metrics.averageLatencyMs ? `${(metrics.averageLatencyMs / 1000).toFixed(1)}s` : '—'} label="Avg. response" /><Metric icon="hardware-chip-outline" value={String(metrics.aiRuns)} label="AI analyses" /><Metric icon="document-text-outline" value={metrics.totalTokens.toLocaleString()} label="Total tokens" /></View>
        <Text style={styles.section}>ENGAGEMENT & HEALTH</Text><View style={styles.grid}><Metric icon="analytics-outline" value={String(metrics.events)} label="Product events" /><Metric icon="warning-outline" value={String(metrics.appErrors)} label="App errors" /></View>
        <View style={styles.note}><Ionicons name="shield-checkmark-outline" size={21} color={C.green} /><Text style={styles.noteText}>All metrics are stored in your Supabase project under your anonymous test account.</Text></View>
      </>}
    </ScrollView></SafeAreaView>;
}

function Metric({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) { return <View style={styles.card}><Ionicons name={icon} size={23} color={C.green} /><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></View>; }

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: C.cream }, header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }, spacer: { width: 42 }, headerTitle: { color: C.ink, fontSize: 15, fontWeight: '700' }, content: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 40 }, eyebrow: { color: C.coral, fontSize: 12, fontWeight: '800', letterSpacing: 1.6 }, title: { color: C.ink, fontSize: 31, fontWeight: '700', marginTop: 8 }, copy: { color: C.muted, fontSize: 15, lineHeight: 22, marginTop: 9, marginBottom: 30 }, loading: { marginTop: 60 }, section: { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 11 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }, card: { width: '48.5%', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 17 }, value: { color: C.ink, fontSize: 25, fontWeight: '700', marginTop: 14 }, label: { color: C.muted, fontSize: 12, marginTop: 3 }, wideCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 18, flexDirection: 'row', gap: 16, alignItems: 'center' }, wideValue: { color: C.ink, fontSize: 25, fontWeight: '700' }, note: { backgroundColor: C.greenSoft, borderRadius: 16, padding: 15, flexDirection: 'row', gap: 10, marginTop: 25 }, noteText: { color: C.green, fontSize: 13, lineHeight: 19, flex: 1 } });
