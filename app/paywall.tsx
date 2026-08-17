import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PurchasesPackage } from 'react-native-purchases';
import { getSubscriptionPackages, isPurchasesConfigured, purchasePro, restorePro } from '@/lib/purchases';
import { reportError, trackEvent } from '@/lib/analytics';

const C = { ink: '#19201D', muted: '#68716C', cream: '#F8F6F0', card: '#FFFFFF', green: '#215C48', greenSoft: '#E5EFEA', coral: '#F0785E', border: '#E7E5DE' };

export default function PaywallScreen() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const configured = isPurchasesConfigured();
  useEffect(() => { trackEvent('paywall_opened'); getSubscriptionPackages().then(setPackages).catch((cause) => reportError('paywall_offerings', cause)); }, []);

  const previewPlans = [{ name: 'Annual', price: '$39.99 / year', note: 'Best value · about $3.33/month' }, { name: 'Monthly', price: '$5.99 / month', note: 'Flexible monthly access' }];
  const plans = packages.length ? packages.map((item) => ({ name: item.packageType === 'ANNUAL' ? 'Annual' : item.packageType === 'MONTHLY' ? 'Monthly' : item.product.title, price: item.product.priceString, note: item.packageType === 'ANNUAL' ? 'Best value' : item.product.description })) : previewPlans;

  async function purchase() {
    if (!configured || !packages[selected]) return Alert.alert('Subscription setup is next', 'The paywall design is ready. Connect RevenueCat and App Store Connect to enable real purchases.');
    setBusy(true);
    try { if (await purchasePro(packages[selected])) { Alert.alert('Welcome to Reset Pro', 'Unlimited room plans are now unlocked.'); router.back(); } }
    catch (cause) { reportError('subscription_purchase', cause); }
    finally { setBusy(false); }
  }
  async function restore() {
    if (!configured) return Alert.alert('Nothing to restore yet', 'RevenueCat will enable this after the App Store subscription is connected.');
    setBusy(true);
    try { if (await restorePro()) { trackEvent('purchase_restored'); Alert.alert('Purchase restored', 'Reset Pro is active.'); router.back(); } else Alert.alert('No active subscription found'); }
    catch (cause) { reportError('purchase_restore', cause); Alert.alert('Could not restore', 'Please try again.'); }
    finally { setBusy(false); }
  }

  return <SafeAreaView style={styles.page} edges={['top', 'bottom']}><View style={styles.header}><View style={styles.spacer} /><Text style={styles.brand}>RESET PRO</Text><Pressable onPress={() => router.back()} style={styles.close}><Ionicons name="close" size={23} color={C.ink} /></Pressable></View><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.heroIcon}><Ionicons name="sparkles" size={36} color={C.coral} /></View><Text style={styles.title}>Keep making space to breathe.</Text><Text style={styles.subtitle}>Get unlimited AI room plans whenever life starts to feel cluttered.</Text>
    <View style={styles.features}><Feature icon="infinite-outline" text="Unlimited personalized reset plans" /><Feature icon="camera-outline" text="Private before-and-after history" /><Feature icon="stats-chart-outline" text="Progress, streaks, and momentum" /></View>
    <View style={styles.plans}>{plans.map((plan, index) => <Pressable key={`${plan.name}-${index}`} onPress={() => setSelected(index)} style={[styles.plan, selected === index && styles.planSelected]}><View style={[styles.radio, selected === index && styles.radioSelected]}>{selected === index && <View style={styles.radioDot} />}</View><View style={styles.planCopy}><Text style={styles.planName}>{plan.name}</Text><Text style={styles.planNote}>{plan.note}</Text></View><Text style={styles.planPrice}>{plan.price}</Text></Pressable>)}</View>
    <Text style={styles.disclaimer}>Payment will be charged to your Apple ID. Subscription renews automatically unless cancelled at least 24 hours before the end of the current period.</Text>
  </ScrollView><View style={styles.actions}><Pressable disabled={busy} onPress={purchase} style={styles.primary}>{busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Continue with Reset Pro</Text>}</Pressable><Pressable disabled={busy} onPress={restore}><Text style={styles.restore}>Restore purchases</Text></Pressable><Text style={styles.legal}>Terms of Use · Privacy Policy</Text></View></SafeAreaView>;
}

function Feature({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) { return <View style={styles.feature}><View style={styles.featureIcon}><Ionicons name={icon} size={20} color={C.green} /></View><Text style={styles.featureText}>{text}</Text></View>; }

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: C.cream }, header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }, spacer: { width: 42 }, brand: { color: C.coral, fontSize: 12, fontWeight: '800', letterSpacing: 1.7 }, close: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }, content: { paddingHorizontal: 23, paddingTop: 15, paddingBottom: 20, alignItems: 'center' }, heroIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }, title: { color: C.ink, fontSize: 31, lineHeight: 37, fontWeight: '700', textAlign: 'center' }, subtitle: { color: C.muted, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 10 }, features: { alignSelf: 'stretch', gap: 13, marginTop: 27 }, feature: { flexDirection: 'row', alignItems: 'center', gap: 12 }, featureIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center' }, featureText: { color: C.ink, fontSize: 15, fontWeight: '600', flex: 1 }, plans: { alignSelf: 'stretch', gap: 10, marginTop: 28 }, plan: { minHeight: 76, borderRadius: 17, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 }, planSelected: { borderWidth: 2, borderColor: C.green, padding: 12 }, radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#AAB1AD', alignItems: 'center', justifyContent: 'center' }, radioSelected: { borderColor: C.green }, radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.green }, planCopy: { flex: 1 }, planName: { color: C.ink, fontSize: 16, fontWeight: '700' }, planNote: { color: C.muted, fontSize: 11, marginTop: 4 }, planPrice: { color: C.ink, fontSize: 13, fontWeight: '700' }, disclaimer: { color: C.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 18 }, actions: { paddingHorizontal: 20, paddingBottom: 6 }, primary: { height: 58, borderRadius: 18, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }, restore: { color: C.green, fontSize: 13, fontWeight: '700', textAlign: 'center', paddingVertical: 13 }, legal: { color: C.muted, fontSize: 10, textAlign: 'center' } });
