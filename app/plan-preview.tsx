import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ResetGoal, ResetPlan } from '@/lib/reset-ai';
import { analyzeRoomPhoto } from '@/lib/reset-service';

const C = { ink: '#19201D', muted: '#68716C', cream: '#F8F6F0', card: '#FFFFFF', green: '#215C48', greenSoft: '#E5EFEA', coral: '#F0785E', border: '#E7E5DE' };

export default function PlanPreviewScreen() {
  const params = useLocalSearchParams<{ minutes?: string; goal?: string; photoUri?: string }>();
  const minutes = Number(params.minutes) || 10;
  const goal = (params.goal ?? 'quick') as ResetGoal;
  const photoUri = params.photoUri;
  const [plan, setPlan] = useState<ResetPlan | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const runAnalysis = useCallback(async () => {
    if (!photoUri) { setError('The room photo is missing. Please retake it.'); return; }
    setError(null); setPlan(null);
    try { const result = await analyzeRoomPhoto(photoUri, minutes, goal); setPlan(result.plan); setSessionId(result.sessionId); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Reset could not analyze this room.'); }
  }, [photoUri, minutes, goal]);

  useEffect(() => { runAnalysis(); }, [runAnalysis, attempt]);

  if (!plan) {
    return (
      <SafeAreaView style={styles.loadingPage} edges={['top', 'bottom']}>
        <View style={styles.loadingHeader}><Pressable accessibilityLabel="Cancel analysis" onPress={() => router.dismissAll()} style={styles.back}><Ionicons name="close" size={24} color={C.ink} /></Pressable></View>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.loadingPhoto} /> : null}
        <View style={styles.loadingContent}>
          {error ? <>
            <View style={[styles.loadingIcon, styles.errorIcon]}><Ionicons name="alert-circle-outline" size={34} color={C.coral} /></View><Text style={styles.loadingTitle}>We couldn’t build this plan</Text><Text style={styles.loadingText}>{error}</Text>
            <Pressable onPress={() => setAttempt((value) => value + 1)} style={styles.retryButton}><Ionicons name="refresh" size={19} color="#FFFFFF" /><Text style={styles.retryText}>Try again</Text></Pressable><Pressable onPress={() => router.dismissAll()}><Text style={styles.cancelText}>Back to Reset</Text></Pressable>
          </> : <>
            <View style={styles.loadingIcon}><ActivityIndicator size="large" color={C.green} /></View><Text style={styles.loadingTitle}>Finding your biggest wins…</Text><Text style={styles.loadingText}>Reset is looking for the few tasks that will make the most difference in {minutes} minutes.</Text>
            <View style={styles.progressSteps}><Text style={styles.progressStep}>✓ Photo secured privately</Text><Text style={styles.progressStep}>• Analyzing visible areas</Text><Text style={styles.progressStepMuted}>• Ranking tasks by impact</Text></View>
          </>}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={() => router.dismissAll()} style={styles.back}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable><View style={styles.livePill}><View style={styles.dot} /><Text style={styles.liveText}>AI PLAN</Text></View><View style={styles.spacer} /></View>
        <View style={styles.photoWrap}>{photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} /> : null}<View style={styles.photoBadge}><Ionicons name="sparkles" size={16} color={C.coral} /><Text style={styles.photoBadgeText}>Plan ready</Text></View></View>
        <Text style={styles.eyebrow}>{plan.roomType.toUpperCase()}</Text><Text style={styles.title}>{plan.title}</Text><Text style={styles.summary}>{plan.summary}</Text>
        <View style={styles.metaRow}><View style={styles.meta}><Ionicons name="time-outline" size={18} color={C.green} /><Text style={styles.metaText}>{plan.estimatedMinutes} min planned</Text></View><View style={styles.meta}><Ionicons name="list-outline" size={18} color={C.green} /><Text style={styles.metaText}>{plan.tasks.length} focused tasks</Text></View></View>
        {plan.safetyNote ? <View style={styles.safetyNote}><Ionicons name="warning-outline" size={20} color={C.coral} /><Text style={styles.safetyText}>{plan.safetyNote}</Text></View> : null}
        <Text style={styles.sectionLabel}>YOUR RESET PLAN</Text>
        {plan.tasks.map((task, index) => <View key={task.id} style={styles.taskCard}><View style={styles.taskNumber}><Text style={styles.taskNumberText}>{index + 1}</Text></View><View style={styles.taskCopy}><View style={styles.taskTitleRow}><Text style={styles.taskTitle}>{task.title}</Text><Text style={styles.taskTime}>~{Math.ceil(task.estimatedSeconds / 60)} min</Text></View><Text style={styles.taskInstruction}>{task.instruction}</Text><Text style={styles.taskWhy}>{task.whyItMatters}</Text></View></View>)}
        <Pressable disabled={!sessionId} onPress={() => router.push({ pathname: '/reset-session', params: { sessionId: sessionId!, plan: JSON.stringify(plan) } })} style={styles.doneButton}><Text style={styles.doneText}>Start my reset</Text><Ionicons name="arrow-forward" size={20} color="#FFFFFF" /></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingPage: { flex: 1, backgroundColor: C.cream, paddingHorizontal: 20 }, loadingHeader: { height: 60, justifyContent: 'center' }, loadingPhoto: { width: '100%', height: 210, borderRadius: 22 }, loadingContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingBottom: 50 }, loadingIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }, errorIcon: { backgroundColor: '#FBEAE5' }, loadingTitle: { color: C.ink, fontSize: 24, fontWeight: '700', textAlign: 'center' }, loadingText: { color: C.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 9 }, progressSteps: { alignSelf: 'stretch', backgroundColor: C.card, borderRadius: 17, padding: 16, marginTop: 25, gap: 10 }, progressStep: { color: C.green, fontSize: 13, fontWeight: '600' }, progressStepMuted: { color: C.muted, fontSize: 13 }, retryButton: { height: 54, alignSelf: 'stretch', borderRadius: 16, backgroundColor: C.green, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 25 }, retryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }, cancelText: { color: C.muted, fontSize: 14, fontWeight: '600', marginTop: 18 },
  safeArea: { flex: 1, backgroundColor: C.cream }, content: { paddingHorizontal: 20, paddingBottom: 36 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, marginBottom: 18 }, back: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }, spacer: { width: 42 }, livePill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.greenSoft, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 14 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green }, liveText: { color: C.green, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  photoWrap: { height: 155, borderRadius: 20, overflow: 'hidden', backgroundColor: C.greenSoft, marginBottom: 22 }, photo: { width: '100%', height: '100%' }, photoBadge: { position: 'absolute', right: 11, bottom: 11, backgroundColor: 'rgba(255,255,255,0.93)', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7, flexDirection: 'row', gap: 6, alignItems: 'center' }, photoBadgeText: { color: C.ink, fontSize: 12, fontWeight: '700' },
  eyebrow: { color: C.coral, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }, title: { color: C.ink, fontSize: 29, fontWeight: '700', letterSpacing: -0.6, marginTop: 6 }, summary: { color: C.muted, fontSize: 15, lineHeight: 21, marginTop: 8 }, metaRow: { flexDirection: 'row', gap: 9, marginTop: 17, marginBottom: 27 }, meta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 9 }, metaText: { color: C.ink, fontSize: 12, fontWeight: '600' },
  safetyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: '#FBEAE5', borderRadius: 14, padding: 13, marginBottom: 18 }, safetyText: { color: C.ink, fontSize: 13, lineHeight: 18, flex: 1 }, sectionLabel: { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.1, marginBottom: 12 }, taskCard: { flexDirection: 'row', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 15, marginBottom: 10 }, taskNumber: { width: 34, height: 34, borderRadius: 12, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, taskNumberText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }, taskCopy: { flex: 1 }, taskTitleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, taskTitle: { color: C.ink, fontSize: 16, fontWeight: '700', flex: 1 }, taskTime: { color: C.green, fontSize: 12, fontWeight: '700' }, taskInstruction: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 5 }, taskWhy: { color: C.green, fontSize: 12, lineHeight: 17, fontStyle: 'italic', marginTop: 7 }, doneButton: { height: 56, borderRadius: 17, backgroundColor: C.green, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', marginTop: 18 }, doneText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
