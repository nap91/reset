import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = { ink: '#19201D', muted: '#68716C', cream: '#F8F6F0', card: '#FFFFFF', green: '#215C48', greenSoft: '#E5EFEA', coral: '#F0785E' };

export default function ResetCompleteScreen() {
  const { completed = '0', total = '0', minutes = '0' } = useLocalSearchParams<{ completed?: string; total?: string; minutes?: string }>();
  return <SafeAreaView style={styles.page} edges={['top', 'bottom']}><View style={styles.body}>
    <View style={styles.icon}><Ionicons name="sparkles" size={44} color={C.coral} /></View><Text style={styles.eyebrow}>RESET COMPLETE</Text><Text style={styles.title}>You made space to breathe.</Text><Text style={styles.copy}>Small, focused actions changed the room. That counts.</Text>
    <View style={styles.stats}><View style={styles.stat}><Text style={styles.number}>{completed}/{total}</Text><Text style={styles.label}>tasks completed</Text></View><View style={styles.divider} /><View style={styles.stat}><Text style={styles.number}>{minutes}</Text><Text style={styles.label}>planned minutes</Text></View></View>
  </View><View style={styles.actions}><Pressable onPress={() => router.dismissAll()} style={styles.button}><Text style={styles.buttonText}>Back to Reset</Text></Pressable><Pressable onPress={() => { router.dismissAll(); router.navigate('/(tabs)/explore'); }} style={styles.linkButton}><Text style={styles.link}>View my progress</Text></Pressable></View></SafeAreaView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: C.cream }, body: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' }, icon: { width: 92, height: 92, borderRadius: 46, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', marginBottom: 27 }, eyebrow: { color: C.coral, fontSize: 12, fontWeight: '800', letterSpacing: 1.7 }, title: { color: C.ink, fontSize: 34, lineHeight: 40, fontWeight: '700', textAlign: 'center', marginTop: 10 }, copy: { color: C.muted, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 12 }, stats: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.greenSoft, borderRadius: 20, paddingVertical: 20, marginTop: 34, width: '100%' }, stat: { flex: 1, alignItems: 'center' }, number: { color: C.green, fontSize: 27, fontWeight: '700' }, label: { color: C.muted, fontSize: 12, marginTop: 4 }, divider: { width: 1, height: 42, backgroundColor: '#C9DCD4' }, actions: { paddingHorizontal: 20, paddingBottom: 10 }, button: { height: 58, borderRadius: 18, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' }, linkButton: { height: 48, alignItems: 'center', justifyContent: 'center' }, link: { color: C.green, fontSize: 14, fontWeight: '700' } });
