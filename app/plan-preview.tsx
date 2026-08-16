import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMockResetPlan, ResetGoal } from '@/lib/reset-ai';

const C = { ink: '#19201D', muted: '#68716C', cream: '#F8F6F0', card: '#FFFFFF', green: '#215C48', greenSoft: '#E5EFEA', coral: '#F0785E', border: '#E7E5DE' };

export default function PlanPreviewScreen() {
  const params = useLocalSearchParams<{ minutes?: string; goal?: string; photoUri?: string }>();
  const minutes = Number(params.minutes) || 10;
  const goal = (params.goal ?? 'quick') as ResetGoal;
  const plan = createMockResetPlan(minutes, goal);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable>
          <View style={styles.prototypePill}><View style={styles.dot} /><Text style={styles.prototypeText}>AI PROTOTYPE</Text></View><View style={styles.spacer} />
        </View>
        <View style={styles.photoWrap}>{params.photoUri ? <Image source={{ uri: params.photoUri }} style={styles.photo} /> : null}<View style={styles.photoBadge}><Ionicons name="sparkles" size={16} color={C.coral} /><Text style={styles.photoBadgeText}>Plan ready</Text></View></View>
        <Text style={styles.eyebrow}>{plan.roomType.toUpperCase()}</Text><Text style={styles.title}>{plan.title}</Text><Text style={styles.summary}>{plan.summary}</Text>
        <View style={styles.metaRow}><View style={styles.meta}><Ionicons name="time-outline" size={18} color={C.green} /><Text style={styles.metaText}>{plan.estimatedMinutes} min planned</Text></View><View style={styles.meta}><Ionicons name="list-outline" size={18} color={C.green} /><Text style={styles.metaText}>{plan.tasks.length} focused tasks</Text></View></View>
        <Text style={styles.sectionLabel}>YOUR RESET PLAN</Text>
        {plan.tasks.map((task, index) => (
          <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskNumber}><Text style={styles.taskNumberText}>{index + 1}</Text></View>
            <View style={styles.taskCopy}><View style={styles.taskTitleRow}><Text style={styles.taskTitle}>{task.title}</Text><Text style={styles.taskTime}>~{Math.ceil(task.estimatedSeconds / 60)} min</Text></View><Text style={styles.taskInstruction}>{task.instruction}</Text><Text style={styles.taskWhy}>{task.whyItMatters}</Text></View>
          </View>
        ))}
        <View style={styles.prototypeNote}><Ionicons name="flask-outline" size={20} color={C.green} /><Text style={styles.prototypeNoteText}>This is a mock AI result used to test Reset’s plan format. Real photo analysis will be connected after the secure backend is ready.</Text></View>
        <Pressable onPress={() => router.dismissAll()} style={styles.doneButton}><Text style={styles.doneText}>Back to Reset</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.cream }, content: { paddingHorizontal: 20, paddingBottom: 36 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, marginBottom: 18 }, back: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }, spacer: { width: 42 }, prototypePill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.greenSoft, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 14 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green }, prototypeText: { color: C.green, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  photoWrap: { height: 155, borderRadius: 20, overflow: 'hidden', backgroundColor: C.greenSoft, marginBottom: 22 }, photo: { width: '100%', height: '100%' }, photoBadge: { position: 'absolute', right: 11, bottom: 11, backgroundColor: 'rgba(255,255,255,0.93)', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7, flexDirection: 'row', gap: 6, alignItems: 'center' }, photoBadgeText: { color: C.ink, fontSize: 12, fontWeight: '700' },
  eyebrow: { color: C.coral, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }, title: { color: C.ink, fontSize: 29, fontWeight: '700', letterSpacing: -0.6, marginTop: 6 }, summary: { color: C.muted, fontSize: 15, lineHeight: 21, marginTop: 8 },
  metaRow: { flexDirection: 'row', gap: 9, marginTop: 17, marginBottom: 27 }, meta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 9 }, metaText: { color: C.ink, fontSize: 12, fontWeight: '600' }, sectionLabel: { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.1, marginBottom: 12 },
  taskCard: { flexDirection: 'row', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 15, marginBottom: 10 }, taskNumber: { width: 34, height: 34, borderRadius: 12, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, taskNumberText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }, taskCopy: { flex: 1 }, taskTitleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, taskTitle: { color: C.ink, fontSize: 16, fontWeight: '700', flex: 1 }, taskTime: { color: C.green, fontSize: 12, fontWeight: '700' }, taskInstruction: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 5 }, taskWhy: { color: C.green, fontSize: 12, lineHeight: 17, fontStyle: 'italic', marginTop: 7 },
  prototypeNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.greenSoft, borderRadius: 16, padding: 15, marginTop: 10 }, prototypeNoteText: { color: C.muted, flex: 1, fontSize: 12, lineHeight: 18 }, doneButton: { height: 56, borderRadius: 17, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginTop: 18 }, doneText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
