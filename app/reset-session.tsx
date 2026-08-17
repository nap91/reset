import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ResetPlan } from '@/lib/reset-ai';
import { completeResetSession, completeResetTask, startResetSession } from '@/lib/reset-service';
import { trackEvent } from '@/lib/analytics';

const C = { ink: '#19201D', muted: '#68716C', cream: '#F8F6F0', card: '#FFFFFF', green: '#215C48', greenSoft: '#E5EFEA', coral: '#F0785E' };
const clock = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.max(0, seconds) % 60).padStart(2, '0')}`;

export default function ResetSessionScreen() {
  const params = useLocalSearchParams<{ sessionId?: string; plan?: string }>();
  const plan = useMemo(() => { try { return JSON.parse(params.plan ?? '') as ResetPlan; } catch { return null; } }, [params.plan]);
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(plan?.tasks[0]?.estimatedSeconds ?? 0);
  const [running, setRunning] = useState(true);
  const [completed, setCompleted] = useState(0);
  const [saving, setSaving] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!params.sessionId || started.current) return;
    started.current = true;
    startResetSession(params.sessionId).catch(() => Alert.alert('Could not start tracking', 'The timer still works, but this reset may not be saved.'));
  }, [params.sessionId]);
  useEffect(() => {
    if (!running || secondsLeft <= 0 || saving) return;
    const timer = setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [running, secondsLeft, saving]);

  if (!plan || !params.sessionId || !plan.tasks.length) return <SafeAreaView style={styles.page}><View style={styles.center}><Text style={styles.title}>This reset is unavailable.</Text><Pressable onPress={() => router.dismissAll()}><Text style={styles.link}>Back to Reset</Text></Pressable></View></SafeAreaView>;
  const activePlan = plan;
  const task = activePlan.tasks[index];
  const total = activePlan.tasks.length;

  async function advance(didComplete: boolean) {
    if (saving) return;
    setSaving(true);
    try {
      if (didComplete) await completeResetTask(params.sessionId!, index + 1);
      else trackEvent('task_skipped', { position: index + 1 }, params.sessionId);
      const completedTotal = completed + (didComplete ? 1 : 0);
      if (index === total - 1) {
        await completeResetSession(params.sessionId!);
        router.replace({ pathname: '/reset-complete', params: { sessionId: params.sessionId!, completed: String(completedTotal), total: String(total), minutes: String(activePlan.estimatedMinutes) } });
        return;
      }
      const next = index + 1;
      setCompleted(completedTotal); setIndex(next); setSecondsLeft(activePlan.tasks[next].estimatedSeconds); setRunning(true);
    } catch (cause) { Alert.alert('Could not save progress', cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setSaving(false); }
  }

  function confirmExit() { Alert.alert('End this reset?', 'Your completed tasks will stay saved.', [{ text: 'Keep going', style: 'cancel' }, { text: 'End reset', style: 'destructive', onPress: () => router.dismissAll() }]); }

  return <SafeAreaView style={styles.page} edges={['top', 'bottom']}>
    <View style={styles.header}><Pressable accessibilityLabel="End reset" onPress={confirmExit} style={styles.close}><Ionicons name="close" size={23} color={C.ink} /></Pressable><Text style={styles.step}>TASK {index + 1} OF {total}</Text><View style={styles.headerSpacer} /></View>
    <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((index + 1) / total) * 100}%` }]} /></View>
    <View style={styles.body}><Text style={styles.eyebrow}>{task.area.toUpperCase()}</Text><Text style={styles.title}>{task.title}</Text><Text style={styles.instruction}>{task.instruction}</Text>
      <View style={[styles.timer, secondsLeft === 0 && styles.timerDone]}><Text style={styles.timerText}>{clock(secondsLeft)}</Text><Text style={styles.timerLabel}>{secondsLeft === 0 ? 'TIME’S UP — FINISH WHEN READY' : running ? 'FOCUS ON THIS ONE TASK' : 'TIMER PAUSED'}</Text><Pressable onPress={() => setRunning((value) => !value)} style={styles.pause}><Ionicons name={running ? 'pause' : 'play'} size={22} color={C.green} /><Text style={styles.pauseText}>{running ? 'Pause' : 'Resume'}</Text></Pressable></View>
      <View style={styles.why}><Ionicons name="sparkles-outline" size={19} color={C.green} /><Text style={styles.whyText}>{task.whyItMatters}</Text></View>
    </View>
    <View style={styles.actions}><Pressable disabled={saving} onPress={() => advance(true)} style={styles.completeButton}><Ionicons name="checkmark-circle" size={23} color="#FFFFFF" /><Text style={styles.completeText}>{index === total - 1 ? 'Finish reset' : 'Task complete'}</Text></Pressable><Pressable disabled={saving} onPress={() => advance(false)} style={styles.skipButton}><Text style={styles.skipText}>Skip for now</Text></Pressable></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.cream }, header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, close: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card }, headerSpacer: { width: 42 }, step: { color: C.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }, progressTrack: { height: 6, marginHorizontal: 22, borderRadius: 3, backgroundColor: C.greenSoft, overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: C.green, borderRadius: 3 }, body: { flex: 1, paddingHorizontal: 25, paddingTop: 32, alignItems: 'center' }, eyebrow: { color: C.coral, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 }, title: { color: C.ink, fontSize: 32, lineHeight: 38, fontWeight: '700', textAlign: 'center', marginTop: 10 }, instruction: { color: C.muted, fontSize: 17, lineHeight: 25, textAlign: 'center', marginTop: 14 }, timer: { width: 235, height: 235, borderRadius: 118, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center', marginTop: 28, borderWidth: 3, borderColor: '#C9DDD4' }, timerDone: { backgroundColor: '#FBEAE5', borderColor: '#F5C9BF' }, timerText: { color: C.ink, fontSize: 56, fontWeight: '700', fontVariant: ['tabular-nums'] }, timerLabel: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.7, marginTop: 2 }, pause: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 5 }, pauseText: { color: C.green, fontSize: 14, fontWeight: '700' }, why: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: C.card, borderRadius: 16, padding: 15, marginTop: 25, width: '100%' }, whyText: { color: C.green, fontSize: 13, lineHeight: 19, fontStyle: 'italic', flex: 1 }, actions: { paddingHorizontal: 20, paddingBottom: 8 }, completeButton: { height: 58, borderRadius: 18, backgroundColor: C.green, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' }, completeText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' }, skipButton: { height: 45, alignItems: 'center', justifyContent: 'center' }, skipText: { color: C.muted, fontSize: 14, fontWeight: '600' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }, link: { color: C.green, fontWeight: '700', marginTop: 20 },
});
